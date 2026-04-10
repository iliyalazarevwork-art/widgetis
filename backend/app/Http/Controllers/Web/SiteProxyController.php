<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use GuzzleHttp\Psr7\Uri;
use GuzzleHttp\Psr7\UriResolver;
use Illuminate\Http\Client\Response as HttpResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;

class SiteProxyController extends Controller
{
    private const VISITOR_COOKIE = 'wgts_pv';

    private const VISITOR_TTL = 3600;

    private const HTML_CACHE_TTL = 60;

    private const TEXT_ASSET_TTL = 3600;

    private const BINARY_ASSET_TTL = 86400;

    private const TEXT_ASSET_EXTENSIONS = [
        'js', 'mjs', 'css', 'map', 'json',
    ];

    private const BINARY_ASSET_EXTENSIONS = [
        'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'ico', 'bmp',
        'woff', 'woff2', 'ttf', 'otf', 'eot',
        'mp4', 'webm', 'mp3', 'ogg',
    ];

    public function proxy(Request $request, string $domain, string $path = ''): Response
    {
        if (! $this->isAllowedDomain($domain)) {
            return response()->json(['error' => 'Domain not allowed'], 403);
        }

        $visitorId = $this->ensureVisitorId($request);
        $this->setCurrentPreviewDomain($visitorId, $domain);

        $query = $request->query();
        $injectParam = null;
        if (array_key_exists('_inject', $query)) {
            $injectParam = is_string($query['_inject']) ? $query['_inject'] : null;
            unset($query['_inject']);
        }

        $targetPath = '/'.ltrim($path, '/');
        $queryString = http_build_query($query);
        if ($queryString !== '') {
            $targetPath .= '?'.$queryString;
        }

        $response = $this->proxyPathForDomain(
            request: $request,
            visitorId: $visitorId,
            domain: $domain,
            targetPath: $targetPath,
            injectScript: $this->loadInjectScript($injectParam)
        );

        return $this->attachVisitorCookie($response, $visitorId, $request);
    }

    public function proxyCurrentPrefix(Request $request, string $prefix, string $path = ''): Response
    {
        $visitorId = $this->ensureVisitorId($request);
        $domain = $this->getCurrentPreviewDomain($visitorId);
        if ($domain === null || ! $this->isAllowedDomain($domain)) {
            return response()->json(['error' => 'Preview domain not set'], 404);
        }

        $targetPath = '/'.$prefix;
        if ($path !== '') {
            $targetPath .= '/'.ltrim($path, '/');
        }

        $queryString = $request->getQueryString();
        if ($queryString !== null && $queryString !== '') {
            $targetPath .= '?'.$queryString;
        }

        $response = $this->proxyPathForDomain($request, $visitorId, $domain, $targetPath);

        return $this->attachVisitorCookie($response, $visitorId, $request);
    }

    public function proxyCurrentLocalePrefix(Request $request, string $locale, string $prefix, string $path = ''): Response
    {
        $visitorId = $this->ensureVisitorId($request);
        $domain = $this->getCurrentPreviewDomain($visitorId);
        if ($domain === null || ! $this->isAllowedDomain($domain)) {
            return response()->json(['error' => 'Preview domain not set'], 404);
        }

        $targetPath = '/'.$locale.'/'.$prefix;
        if ($path !== '') {
            $targetPath .= '/'.ltrim($path, '/');
        }

        $queryString = $request->getQueryString();
        if ($queryString !== null && $queryString !== '') {
            $targetPath .= '?'.$queryString;
        }

        $response = $this->proxyPathForDomain($request, $visitorId, $domain, $targetPath);

        return $this->attachVisitorCookie($response, $visitorId, $request);
    }

    private function proxyPathForDomain(
        Request $request,
        string $visitorId,
        string $domain,
        string $targetPath,
        ?string $injectScript = null
    ): Response {
        $targetUrl = "https://{$domain}{$targetPath}";

        // Fast path: cached response (asset or HTML).
        $cacheKey = null;
        $cacheTtl = 0;
        if ($request->isMethod('GET')) {
            [$cacheKey, $cacheTtl] = $this->resolveCacheKeyForGet($targetUrl, $targetPath, $injectScript);
            if ($cacheKey !== null) {
                /** @var array{body: string, content_type: string, ttl: int}|null $cached */
                $cached = Cache::get($cacheKey);
                if (is_array($cached)) {
                    return response($cached['body'], 200)
                        ->header('Content-Type', $cached['content_type'])
                        ->header('Cache-Control', 'public, max-age='.$cached['ttl'])
                        ->header('Access-Control-Allow-Origin', '*');
                }
            }
        }

        $upstream = $this->fetchRemote($request, $visitorId, $domain, $targetUrl);
        if ($upstream === null) {
            return response('Proxy error', 502);
        }

        // Horoshop challenge: save cookie and retry.
        $body = $upstream->body();
        if (
            is_string($body) &&
            Str::contains($body, 'challenge_passed') &&
            Str::contains($body, 'location.reload') &&
            preg_match('/defaultHash\s*=\s*"([0-9a-f]+)"/i', $body, $m) === 1
        ) {
            $this->putCookieToJar($visitorId, $domain, 'challenge_passed', $m[1]);
            $retry = $this->fetchRemote($request, $visitorId, $domain, $targetUrl, 5, true);
            if ($retry !== null) {
                $upstream = $retry;
                $body = $upstream->body();
            }
        }

        if (in_array($upstream->status(), [403, 503], true)) {
            $isCloudflare = Str::contains(Str::lower((string) $body), 'just a moment') ||
                Str::contains(Str::lower((string) $body), 'cf-mitigated');

            return $this->blockedResponse($domain, $upstream->status(), $isCloudflare);
        }

        $contentType = (string) ($upstream->header('Content-Type') ?? 'application/octet-stream');
        $rewrittenBody = (string) $body;

        if (Str::contains(Str::lower($contentType), 'text/html')) {
            $rewrittenBody = $this->rewriteHtml($rewrittenBody, $domain);
            $rewrittenBody = $this->injectRuntimeScript($rewrittenBody, $domain, $injectScript);
        } elseif (
            Str::contains(Str::lower($contentType), 'text/css') ||
            Str::contains(Str::lower($contentType), 'javascript')
        ) {
            $rewrittenBody = $this->rewriteTextAssets($rewrittenBody, $domain);
        }

        $response = response($rewrittenBody, $upstream->status());
        $response->headers->set('Content-Type', $contentType);
        $response->headers->set('Access-Control-Allow-Origin', '*');

        $this->forwardSafeHeaders($upstream, $response);
        $upstreamSetCookies = $upstream->toPsrResponse()->getHeader('Set-Cookie');
        $this->forwardCookies($visitorId, $upstream, $response, $domain);

        // Store in cache for subsequent requests. Skip HTML cache when
        // upstream set cookies (per-visitor state) to avoid leaking them.
        if (
            $cacheKey !== null
            && $cacheTtl > 0
            && $upstream->status() === 200
            && ! (Str::contains(Str::lower($contentType), 'text/html') && $upstreamSetCookies !== [])
        ) {
            Cache::put(
                $cacheKey,
                ['body' => $rewrittenBody, 'content_type' => $contentType, 'ttl' => $cacheTtl],
                $cacheTtl,
            );
            $response->headers->set('Cache-Control', 'public, max-age='.$cacheTtl);
        }

        return $response;
    }

    /**
     * Decide whether this GET is cacheable and with what TTL.
     *
     * @return array{0: string|null, 1: int}
     */
    private function resolveCacheKeyForGet(string $targetUrl, string $targetPath, ?string $injectScript): array
    {
        $path = parse_url($targetPath, PHP_URL_PATH);
        if (! is_string($path)) {
            return [null, 0];
        }

        $ext = strtolower((string) pathinfo($path, PATHINFO_EXTENSION));

        if (in_array($ext, self::BINARY_ASSET_EXTENSIONS, true)) {
            return ['site_proxy:asset:'.sha1($targetUrl), self::BINARY_ASSET_TTL];
        }

        if (in_array($ext, self::TEXT_ASSET_EXTENSIONS, true)) {
            return ['site_proxy:asset:'.sha1($targetUrl), self::TEXT_ASSET_TTL];
        }

        // HTML / extension-less path: cache only without inject override
        // so the runtime script remains deterministic for all visitors.
        if ($ext === '' || $ext === 'html' || $ext === 'htm') {
            if ($injectScript !== null) {
                return [null, 0];
            }

            return ['site_proxy:html:'.sha1($targetUrl), self::HTML_CACHE_TTL];
        }

        return [null, 0];
    }

    private function fetchRemote(
        Request $request,
        string $visitorId,
        string $domain,
        string $url,
        int $maxRedirects = 5,
        bool $forceGet = false
    ): ?HttpResponse {
        $method = $forceGet ? 'GET' : strtoupper($request->method());
        $headers = [
            'User-Agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept' => '*/*',
            'Accept-Language' => 'uk,ru;q=0.9,en;q=0.8',
            'Accept-Encoding' => 'gzip, deflate',
        ];

        $jarCookie = $this->getCookieFromJar($visitorId, $domain);
        $browserCookie = (string) ($request->header('Cookie') ?? '');
        $mergedCookie = $this->mergeCookies([$jarCookie, $browserCookie]);
        if ($mergedCookie !== '') {
            $headers['Cookie'] = $mergedCookie;
        }

        if (! in_array($method, ['GET', 'HEAD'], true)) {
            if ($request->headers->has('Content-Type')) {
                $headers['Content-Type'] = (string) $request->header('Content-Type');
            }

            if ($request->headers->has('X-Requested-With')) {
                $headers['X-Requested-With'] = (string) $request->header('X-Requested-With');
            }

            if ($request->headers->has('X-CSRF-Token')) {
                $headers['X-CSRF-Token'] = (string) $request->header('X-CSRF-Token');
            }

            $headers['Referer'] = "https://{$domain}/";
            $headers['Origin'] = "https://{$domain}";
        }

        $options = [
            'http_errors' => false,
            'allow_redirects' => false,
            'timeout' => 20,
            'connect_timeout' => 8,
            // Prefer HTTP/2 to upstream when curl/nghttp2 is available;
            // curl silently downgrades to 1.1 if not supported.
            'version' => 2.0,
        ];

        if (! in_array($method, ['GET', 'HEAD'], true)) {
            $options['body'] = $request->getContent();
        }

        try {
            $response = Http::withHeaders($headers)
                ->withOptions($options)
                ->send($method, $url);
        } catch (\Throwable) {
            return null;
        }

        $this->storeCookies($visitorId, $domain, $response->toPsrResponse()->getHeader('Set-Cookie'));

        if ($maxRedirects <= 0 || ! in_array($response->status(), [301, 302, 303, 307, 308], true)) {
            return $response;
        }

        $location = $response->toPsrResponse()->getHeaderLine('Location');
        if ($location === '') {
            return $response;
        }

        $redirectUrl = (string) UriResolver::resolve(new Uri($url), new Uri($location));
        $redirectHost = parse_url($redirectUrl, PHP_URL_HOST);
        if (! is_string($redirectHost) || ! $this->isAllowedDomain($redirectHost)) {
            return $response;
        }

        return $this->fetchRemote($request, $visitorId, $redirectHost, $redirectUrl, $maxRedirects - 1, $forceGet);
    }

    private function blockedResponse(string $domain, int $status, bool $isCloudflare): Response
    {
        $reason = $isCloudflare ? 'cloudflare' : 'blocked';
        $message = $isCloudflare
            ? 'This site is protected and blocks loading through proxy.'
            : "The target site returned HTTP {$status}.";
        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #f8f9fa;
      font-family: system-ui, -apple-system, sans-serif;
      color: #64748b;
      text-align: center;
      padding: 32px;
    }
    .wrap { max-width: 360px; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h2 { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
    p { font-size: 14px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="icon">!</div>
    <h2>Preview unavailable</h2>
    <p>{$message} Try another domain.</p>
  </div>
  <script>window.parent.postMessage({type:'site-proxy-error',reason:'{$reason}',domain:'{$domain}'},'*')</script>
</body>
</html>
HTML;

        return response($html, 200, ['Content-Type' => 'text/html; charset=utf-8']);
    }

    private function rewriteHtml(string $html, string $domain): string
    {
        $prefix = "/site/{$domain}";
        $escapedDomain = preg_quote($domain, '/');

        $html = preg_replace('/<base[^>]*>/i', '', $html) ?? $html;

        $html = preg_replace_callback(
            "/https?:\\/\\/{$escapedDomain}(\\/|(?=[\"'`\\s>]))/i",
            static fn (array $m): string => $m[1] === '/' ? "{$prefix}/" : $prefix,
            $html
        ) ?? $html;

        $html = preg_replace(
            '/((?:href|src|action|poster|data-[\w-]+)\s*=\s*["\'])\/(?!\/|site\/)/i',
            '$1'.$prefix.'/',
            $html
        ) ?? $html;

        $html = preg_replace(
            '/(url\(\s*[\'"]?)\/(?!\/|site\/)/i',
            '$1'.$prefix.'/',
            $html
        ) ?? $html;

        $html = preg_replace_callback('/srcset\s*=\s*"([^"]*)"/i', static function (array $m) use ($prefix): string {
            $rewritten = preg_replace('/(^|,\s*)\/(?!\/|site\/)/', '$1'.$prefix.'/', $m[1]) ?? $m[1];

            return 'srcset="'.$rewritten.'"';
        }, $html) ?? $html;

        $html = preg_replace_callback(
            '/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/i',
            static function (array $m) use ($prefix): string {
                $code = preg_replace('/(["\'`])(\/(?:content|frontend|assets|_widget)\/)/', '$1'.$prefix.'$2', $m[2]) ?? $m[2];

                return $m[1].$code.$m[3];
            },
            $html
        ) ?? $html;

        return $html;
    }

    private function rewriteTextAssets(string $body, string $domain): string
    {
        $prefix = "/site/{$domain}";

        return preg_replace('/(url\(\s*[\'"]?)\/(?!\/)/i', '$1'.$prefix.'/', $body) ?? $body;
    }

    private function injectRuntimeScript(string $html, string $domain, ?string $injectScript): string
    {
        $runtime = $this->runtimeScript($domain);
        $extra = $injectScript ?? '';
        $injection = '<script>'.$runtime.$extra.'</script>';

        if (Str::contains(Str::lower($html), '</body>')) {
            return preg_replace('/<\/body>/i', $injection.'</body>', $html, 1) ?? ($html.$injection);
        }

        return $html.$injection;
    }

    private function runtimeScript(string $domain): string
    {
        $prefix = '/site/'.$domain;

        return <<<JS
(function(){
  var PREFIX = "{$prefix}";
  function rewriteUrl(input){
    if (typeof input !== 'string') return input;
    if (input.startsWith('//')) return input;
    if (input.startsWith(PREFIX + '/')) return input;
    if (input.startsWith('/')) return PREFIX + input;
    var abs = input.match(/^https?:\/\/([^\/]+)(\/.*)?$/i);
    if (abs && abs[1].toLowerCase() === "{$domain}".toLowerCase()) {
      return PREFIX + (abs[2] || '/');
    }
    return input;
  }
  var nativeFetch = window.fetch;
  if (nativeFetch) {
    window.fetch = function(input, init){
      if (typeof input === 'string') input = rewriteUrl(input);
      else if (input && input.url) input = new Request(rewriteUrl(input.url), input);
      return nativeFetch.call(this, input, init);
    };
  }
  var nativeOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url){
    if (typeof url === 'string') url = rewriteUrl(url);
    return nativeOpen.apply(this, [method, url].concat([].slice.call(arguments, 2)));
  };
  document.addEventListener('submit', function(e){
    var form = e.target;
    if (!form || !form.action) return;
    form.action = rewriteUrl(form.action);
  }, true);
})();
JS;
    }

    private function forwardSafeHeaders(HttpResponse $upstream, Response $response): void
    {
        $passthrough = ['Cache-Control', 'ETag', 'Last-Modified', 'Expires'];

        foreach ($passthrough as $name) {
            $value = $upstream->toPsrResponse()->getHeaderLine($name);
            if ($value !== '') {
                $response->headers->set($name, $value);
            }
        }
    }

    private function forwardCookies(string $visitorId, HttpResponse $upstream, Response $response, string $domain): void
    {
        $cookies = $upstream->toPsrResponse()->getHeader('Set-Cookie');
        if ($cookies === []) {
            return;
        }

        $this->storeCookies($visitorId, $domain, $cookies);

        foreach ($cookies as $cookie) {
            $normalized = $this->normalizeSetCookie($cookie, $domain);
            $response->headers->set('Set-Cookie', $normalized, false);
        }
    }

    private function normalizeSetCookie(string $cookie, string $domain): string
    {
        $cookie = preg_replace('/;\s*domain=[^;]*/i', '', $cookie) ?? $cookie;
        $cookie = preg_replace('/;\s*secure/i', '', $cookie) ?? $cookie;

        if (preg_match('/;\s*path=[^;]*/i', $cookie) === 1) {
            $cookie = preg_replace('/;\s*path=[^;]*/i', '; Path=/site/'.$domain.'/', $cookie) ?? $cookie;
        } else {
            $cookie .= '; Path=/site/'.$domain.'/';
        }

        if (preg_match('/;\s*samesite=[^;]*/i', $cookie) === 1) {
            $cookie = preg_replace('/;\s*samesite=[^;]*/i', '; SameSite=Lax', $cookie) ?? $cookie;
        } else {
            $cookie .= '; SameSite=Lax';
        }

        return $cookie;
    }

    private function ensureVisitorId(Request $request): string
    {
        $id = $request->cookie(self::VISITOR_COOKIE);
        if (is_string($id) && preg_match('/^[A-Za-z0-9]{32}$/', $id) === 1) {
            return $id;
        }

        return Str::random(32);
    }

    private function attachVisitorCookie(Response $response, string $visitorId, Request $request): Response
    {
        $existing = $request->cookie(self::VISITOR_COOKIE);
        if ($existing === $visitorId) {
            return $response;
        }

        $cookie = Cookie::create(
            name: self::VISITOR_COOKIE,
            value: $visitorId,
            expire: time() + self::VISITOR_TTL,
            path: '/',
            domain: null,
            secure: $request->isSecure(),
            httpOnly: true,
            raw: false,
            sameSite: Cookie::SAMESITE_LAX,
        );

        $response->headers->setCookie($cookie);

        return $response;
    }

    private function setCurrentPreviewDomain(string $visitorId, string $domain): void
    {
        Cache::put('site_proxy:visitor:'.$visitorId.':current', $domain, self::VISITOR_TTL);
    }

    private function getCurrentPreviewDomain(string $visitorId): ?string
    {
        $domain = Cache::get('site_proxy:visitor:'.$visitorId.':current');

        return is_string($domain) && $domain !== '' ? $domain : null;
    }

    private function getCookieFromJar(string $visitorId, string $domain): string
    {
        $jar = Cache::get($this->jarKey($visitorId, $domain), []);
        if (! is_array($jar) || $jar === []) {
            return '';
        }

        $pairs = [];
        foreach ($jar as $name => $value) {
            if (is_string($name) && is_string($value) && $name !== '') {
                $pairs[] = $name.'='.$value;
            }
        }

        return implode('; ', $pairs);
    }

    /**
     * @param  list<string>  $setCookieHeaders
     */
    private function storeCookies(string $visitorId, string $domain, array $setCookieHeaders): void
    {
        if ($setCookieHeaders === []) {
            return;
        }

        $key = $this->jarKey($visitorId, $domain);
        $jar = Cache::get($key, []);
        if (! is_array($jar)) {
            $jar = [];
        }

        $changed = false;
        foreach ($setCookieHeaders as $header) {
            if (! is_string($header)) {
                continue;
            }

            if (preg_match('/^([^=;\s]+)=([^;]*)/i', $header, $m) !== 1) {
                continue;
            }

            $name = trim($m[1]);
            $value = $m[2];
            if ($name === '') {
                continue;
            }

            if (($jar[$name] ?? null) !== $value) {
                $jar[$name] = $value;
                $changed = true;
            }
        }

        if ($changed) {
            Cache::put($key, $jar, self::VISITOR_TTL);
        }
    }

    private function putCookieToJar(string $visitorId, string $domain, string $name, string $value): void
    {
        $key = $this->jarKey($visitorId, $domain);
        $jar = Cache::get($key, []);
        if (! is_array($jar)) {
            $jar = [];
        }

        $jar[$name] = $value;
        Cache::put($key, $jar, self::VISITOR_TTL);
    }

    private function jarKey(string $visitorId, string $domain): string
    {
        return 'site_proxy:visitor:'.$visitorId.':cookies:'.$domain;
    }

    /**
     * @param  list<string>  $cookieParts
     */
    private function mergeCookies(array $cookieParts): string
    {
        $parts = [];
        foreach ($cookieParts as $part) {
            $part = trim($part);
            if ($part !== '') {
                $parts[] = $part;
            }
        }

        return implode('; ', $parts);
    }

    private function loadInjectScript(?string $injectParam): ?string
    {
        if ($injectParam === null || trim($injectParam) === '') {
            return null;
        }

        if (Str::contains($injectParam, ['..', '\\', "\0"])) {
            return null;
        }

        $absolutePath = public_path($injectParam);
        if (! is_file($absolutePath) || ! is_readable($absolutePath)) {
            return null;
        }

        try {
            $content = file_get_contents($absolutePath);
        } catch (\Throwable) {
            return null;
        }

        return is_string($content) ? $content : null;
    }

    private function isAllowedDomain(string $domain): bool
    {
        if (! Str::contains($domain, '.')) {
            return false;
        }

        if (preg_match('/^\d{1,3}(\.\d{1,3}){3}$/', $domain) === 1) {
            return false;
        }

        if (preg_match('/^\[|^::|^0x/i', $domain) === 1) {
            return false;
        }

        $lower = Str::lower($domain);
        if ($lower === 'localhost' || Str::endsWith($lower, '.localhost')) {
            return false;
        }

        foreach (['.local', '.internal', '.test', '.invalid', '.example'] as $suffix) {
            if (Str::endsWith($lower, $suffix)) {
                return false;
            }
        }

        if (Str::startsWith($lower, '169.254.') || $lower === 'metadata.google.internal') {
            return false;
        }

        return true;
    }
}
