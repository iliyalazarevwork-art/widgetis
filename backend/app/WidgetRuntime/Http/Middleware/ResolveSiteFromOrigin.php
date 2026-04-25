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
 * Extracts the host, strips www., lowercases it, then looks up wgt_sites.domain.
 * On a miss the request is rejected with 403 UNKNOWN_ORIGIN.
 * On a hit the Site model is stored in request attributes as 'site'.
 */
final class ResolveSiteFromOrigin
{
    public function handle(Request $request, Closure $next): Response
    {
        $host = $this->resolveHost($request);

        if ($host === null) {
            return $this->unknownOriginResponse('Origin header is missing.');
        }

        $site = Site::where('domain', $host)->first();

        if ($site === null) {
            return $this->unknownOriginResponse("Origin '{$host}' is not registered.");
        }

        $request->attributes->set('site', $site);

        return $next($request);
    }

    private function resolveHost(Request $request): ?string
    {
        $raw = $request->header('Origin') ?? $request->header('Referer');

        if ($raw === null || $raw === '') {
            return null;
        }

        $parsed = parse_url($raw);

        if (!is_array($parsed)) {
            return null;
        }

        $host = $parsed['host'] ?? null;

        if ($host === null || $host === '') {
            return null;
        }

        // Normalise: lowercase, strip port, strip www.
        $host = strtolower($host);
        $host = (string) preg_replace('/:\d+$/', '', $host);   // strip :port
        $host = (string) preg_replace('/^www\./i', '', $host); // strip www.

        return $host !== '' ? $host : null;
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
