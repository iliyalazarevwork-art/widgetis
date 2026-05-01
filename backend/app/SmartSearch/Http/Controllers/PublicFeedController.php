<?php

declare(strict_types=1);

namespace App\SmartSearch\Http\Controllers;

use App\SmartSearch\Enums\SearchLanguage;
use App\WidgetRuntime\Models\Site;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

/**
 * Serves the full product index for a site+lang as a compact JSON feed.
 *
 * The response is used by the widget for client-side search (zero network latency
 * per keystroke after the initial load). The feed is gzip-compressed in Redis
 * (key: srch:feed:{siteId}:{lang}:v{version}) and invalidated automatically
 * when the version counter increments on feed sync (same key scheme as search cache).
 *
 * HTTP semantics:
 *   - Cache-Control: public, max-age=3600, stale-while-revalidate=86400
 *   - ETag: W/"sha1(json)" cached in a sibling Redis key — 304 checks cost one O(1) Redis get
 *   - Content-Encoding: gzip when the client accepts it (passes raw Redis bytes, skips gzdecode)
 *   - Vary: Origin, Accept-Encoding, Accept-Language
 */
final class PublicFeedController
{
    private const HTTP_MAX_AGE = 3600;

    private const HTTP_SWR = 86400;

    private const REDIS_TTL = 3600;

    private const VERSION_KEY_PREFIX = 'srch:ver:';

    public function __invoke(Request $request): Response
    {
        /** @var Site $site */
        $site = $request->attributes->get('site');
        $siteId = (string) $site->getKey();
        $lang   = SearchLanguage::fromAcceptLanguage($request->header('Accept-Language'))->value;

        $cacheKey   = $this->buildCacheKey($siteId, $lang);
        $etagKey    = $cacheKey . ':etag';
        $acceptGzip = $this->clientAcceptsGzip($request);

        // ── Fast 304 path: one O(1) Redis GET, never decompress the feed ─────
        $cachedEtag = Redis::get($etagKey);

        if (is_string($cachedEtag)) {
            if ($request->header('If-None-Match') === $cachedEtag) {
                return $this->respond304($cachedEtag);
            }

            $compressed = Redis::get($cacheKey);

            if (is_string($compressed)) {
                return $this->respondFromCache($compressed, $cachedEtag, $acceptGzip);
            }
        }

        // ── ETag missing but feed may still be in Redis ───────────────────────
        $compressed = Redis::get($cacheKey);

        if (is_string($compressed)) {
            $json  = (string) gzdecode($compressed);
            $etag  = 'W/"' . sha1($json) . '"';
            Redis::setex($etagKey, self::REDIS_TTL, $etag);

            if ($request->header('If-None-Match') === $etag) {
                return $this->respond304($etag);
            }

            return $acceptGzip
                ? $this->respondGzip($compressed, $etag)
                : $this->respondJson($json, $etag);
        }

        // ── Build from DB ────────────────────────────────────────────────────
        $json = $this->buildJson($siteId, (string) $lang);

        if ($json === false) {
            return response('{"error":{"code":"ENCODE_ERROR"}}', 500, [
                'Content-Type' => 'application/json; charset=utf-8',
            ]);
        }

        $etag    = 'W/"' . sha1($json) . '"';
        $gzipped = gzencode($json, 6);

        if (is_string($gzipped)) {
            Redis::setex($cacheKey, self::REDIS_TTL, $gzipped);
            Redis::setex($etagKey, self::REDIS_TTL, $etag);
        }

        if ($request->header('If-None-Match') === $etag) {
            return $this->respond304($etag);
        }

        return $acceptGzip && is_string($gzipped)
            ? $this->respondGzip($gzipped, $etag)
            : $this->respondJson($json, $etag);
    }

    private function buildCacheKey(string $siteId, string $lang): string
    {
        $version = (int) Redis::get(self::VERSION_KEY_PREFIX . $siteId);

        return "srch:feed:{$siteId}:{$lang}:v{$version}";
    }

    /** @return string|false */
    private function buildJson(string $siteId, string $lang): string|false
    {
        $products = DB::connection('pgsql_runtime')
            ->table('wgt_smart_search_products')
            ->select([
                'external_id as id',
                'url',
                'name',
                'price',
                'oldprice',
                'picture',
                'vendor',
                'category_name as cat',
                'available',
                'search_text as st',
            ])
            ->where('site_id', $siteId)
            ->where('lang', $lang)
            ->whereNotNull('name')
            ->where('name', '!=', '')
            ->orderByDesc('popularity')
            ->orderBy('name')
            ->get()
            ->map(static fn (object $row): array => [
                'id'        => (string) $row->id,
                'url'       => (string) $row->url,
                'name'      => (string) $row->name,
                'price'     => (int) $row->price,
                'oldprice'  => (int) $row->oldprice,
                'picture'   => (string) ($row->picture ?? ''),
                'vendor'    => (string) ($row->vendor ?? ''),
                'cat'       => (string) ($row->cat ?? ''),
                'available' => (bool) $row->available,
                'st'        => (string) $row->st,
            ])
            ->all();

        // Category URLs (populated by sitemap sync or manual config)
        $categoryUrls = DB::connection('pgsql_runtime')
            ->table('wgt_smart_search_categories')
            ->where('site_id', $siteId)
            ->where('lang', $lang)
            ->whereNotNull('url')
            ->where('url', '!=', '')
            ->pluck('url', 'name')
            ->all();

        // Stable version: product count + UNIX timestamp of last update
        $cnt     = DB::connection('pgsql_runtime')
            ->table('wgt_smart_search_products')
            ->where('site_id', $siteId)
            ->where('lang', $lang)
            ->count();

        $maxUpdatedAt = DB::connection('pgsql_runtime')
            ->table('wgt_smart_search_products')
            ->where('site_id', $siteId)
            ->where('lang', $lang)
            ->max('updated_at');

        $version = $cnt . ':' . ($maxUpdatedAt !== null ? strtotime((string) $maxUpdatedAt) : 0);

        $payload = [
            'version'      => $version,
            'currency'     => 'грн',
            'accentColor'  => null,
            'categoryUrls' => (object) $categoryUrls, // force JSON object even when empty
            'products'     => $products,
        ];

        return json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    private function respondFromCache(string $compressed, string $etag, bool $acceptGzip): Response
    {
        if ($acceptGzip) {
            return $this->respondGzip($compressed, $etag);
        }

        return $this->respondJson((string) gzdecode($compressed), $etag);
    }

    private function respond304(string $etag): Response
    {
        return response('', 304, [
            'ETag'          => $etag,
            'Cache-Control' => 'public, max-age=' . self::HTTP_MAX_AGE . ', stale-while-revalidate=' . self::HTTP_SWR,
        ]);
    }

    private function respondGzip(string $compressed, string $etag): Response
    {
        return response($compressed, 200, [
            'Content-Type'     => 'application/json; charset=utf-8',
            'Content-Encoding' => 'gzip',
            'Cache-Control'    => 'public, max-age=' . self::HTTP_MAX_AGE . ', stale-while-revalidate=' . self::HTTP_SWR,
            'ETag'             => $etag,
            'Vary'             => 'Origin, Accept-Encoding, Accept-Language',
        ]);
    }

    private function respondJson(string $json, string $etag): Response
    {
        return response($json, 200, [
            'Content-Type'  => 'application/json; charset=utf-8',
            'Cache-Control' => 'public, max-age=' . self::HTTP_MAX_AGE . ', stale-while-revalidate=' . self::HTTP_SWR,
            'ETag'          => $etag,
            'Vary'          => 'Origin, Accept-Encoding, Accept-Language',
        ]);
    }

    private function clientAcceptsGzip(Request $request): bool
    {
        $accept = (string) $request->header('Accept-Encoding', '');

        return str_contains($accept, 'gzip');
    }
}
