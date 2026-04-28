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
 *   1. Exact domain match against wgt_sites.domain (strips www., lowercases, no port).
 *   2. If miss: check wgt_sites.allowed_origins for the full normalised origin
 *      (scheme+host+port, e.g. "http://localhost:3100") OR the host-only value.
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

        // 1. Primary: exact domain match (existing behaviour).
        $site = Site::where('domain', $hostOnly)->first();

        // 2. Fallback: check allowed_origins for full origin or host-only.
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
     * Scan all sites and return the first one whose allowed_origins contains
     * either the full rawOriginUrl or the hostOnly value.
     *
     * Loading all rows in PHP avoids driver differences between pgsql (jsonb @>)
     * and sqlite (no native JSON contains), keeping tests simple and correct.
     */
    private function findByAllowedOrigin(string $rawOriginUrl, string $hostOnly): ?Site
    {
        return Site::query()->get()->first(
            static function (Site $site) use ($rawOriginUrl, $hostOnly): bool {
                $origins = $site->allowed_origins ?? [];

                return in_array($rawOriginUrl, $origins, true)
                    || in_array($hostOnly, $origins, true);
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
