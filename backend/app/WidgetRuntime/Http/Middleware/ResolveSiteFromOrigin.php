<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Middleware;

use App\WidgetRuntime\Models\Site;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves the Site model from the request's Origin (or Referer) header.
 *
 * Resolution order:
 *   1. allowed_origins exact-URL match (full normalised origin including scheme+port,
 *      e.g. "http://localhost:3100"). This wins over a bare-host domain lookup so
 *      that adding "http://localhost:3100" to a real site's allowed_origins is not
 *      pre-empted by a separate dev "localhost" site whose `domain` happens to match.
 *   2. Exact domain match against wgt_sites.domain (strips www., lowercases, no port).
 *   3. allowed_origins host-only match (e.g. "localhost").
 *
 * On a miss the request is rejected with 403 UNKNOWN_ORIGIN.
 * On a hit the Site model is stored in request attributes as 'site'.
 *
 * NOTE: The allowed_origins fallback loads all sites into PHP for filtering.
 * This is acceptable while the sites table is small (<1 000 rows).
 * TODO: Replace with a DB-level JSON index query when sites > 1 000.
 */
final class ResolveSiteFromOrigin
{
    public function handle(Request $request, Closure $next): Response
    {
        [$rawOriginUrl, $hostOnly] = $this->resolveOriginParts($request);

        if ($hostOnly === null) {
            return $this->unknownOriginResponse('Origin header is missing.');
        }

        // 1. allowed_origins exact-URL match wins first.
        $site = $rawOriginUrl !== null
            ? $this->findByExactAllowedOrigin($rawOriginUrl)
            : null;

        // 2. Fallback: exact domain match.
        if ($site === null) {
            $site = Site::where('domain', $hostOnly)->first();
        }

        // 3. Last resort: host-only allowed_origins match.
        if ($site === null) {
            $site = $this->findByAllowedOrigin($rawOriginUrl, $hostOnly);
        }

        if ($site === null) {
            return $this->unknownOriginResponse("Origin '{$hostOnly}' is not registered.");
        }

        $request->attributes->set('site', $site);

        return $next($request);
    }

    /**
     * Returns [rawOriginUrl, hostOnly] extracted and normalised from the request.
     * rawOriginUrl: lowercased scheme+host+port (e.g. "http://localhost:3100").
     * hostOnly: lowercased host without port and www. prefix.
     * Both are null on parse failure.
     *
     * @return array{string|null, string|null}
     */
    private function resolveOriginParts(Request $request): array
    {
        $raw = $request->header('Origin') ?? $request->header('Referer');

        if ($raw === null || $raw === '') {
            return [null, null];
        }

        $parsed = parse_url($raw);

        if (! is_array($parsed)) {
            return [null, null];
        }

        $host = $parsed['host'] ?? null;

        if ($host === null || $host === '') {
            return [null, null];
        }

        $scheme = strtolower($parsed['scheme'] ?? 'https');
        $hostLower = strtolower($host);
        $port = isset($parsed['port']) ? ':' . $parsed['port'] : '';

        // Full normalised origin: scheme://host:port (no path).
        $rawOriginUrl = $scheme . '://' . $hostLower . $port;

        // Host-only: no port, no www.
        $hostOnly = (string) preg_replace('/:\d+$/', '', $hostLower);   // strip :port
        $hostOnly = (string) preg_replace('/^www\./i', '', $hostOnly);  // strip www.

        if ($hostOnly === '') {
            return [null, null];
        }

        return [$rawOriginUrl, $hostOnly];
    }

    /**
     * First step of allowed_origins matching: only accept the full URL form
     * (scheme://host:port). Used before the domain match so that explicit
     * dev origins (e.g. "http://localhost:3100" added to a real site) win
     * over a host-only `domain` collision.
     */
    private function findByExactAllowedOrigin(string $rawOriginUrl): ?Site
    {
        return Site::query()->get()->first(
            static fn (Site $site): bool => in_array($rawOriginUrl, $site->allowed_origins ?? [], true),
        );
    }

    /**
     * Scan all sites and return the first one whose allowed_origins contains
     * either the full rawOriginUrl or the hostOnly value.
     *
     * Loading all rows in PHP avoids driver differences between pgsql (jsonb @>)
     * and sqlite (no native JSON contains), keeping tests simple and correct.
     */
    private function findByAllowedOrigin(?string $rawOriginUrl, string $hostOnly): ?Site
    {
        return Site::query()->get()->first(
            static function (Site $site) use ($rawOriginUrl, $hostOnly): bool {
                $origins = $site->allowed_origins ?? [];

                if ($rawOriginUrl !== null && in_array($rawOriginUrl, $origins, true)) {
                    return true;
                }

                return in_array($hostOnly, $origins, true);
            },
        );
    }

    private function unknownOriginResponse(string $message): Response
    {
        return response()->json([
            'error' => [
                'code'    => 'UNKNOWN_ORIGIN',
                'message' => $message,
            ],
        ], 403);
    }
}
