<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sets precise CORS response headers for widget endpoints.
 *
 * This middleware runs AFTER ResolveSiteFromOrigin has confirmed the Origin
 * belongs to a registered site.  It replaces the wildcard '*' that
 * HandleCors may have echoed with the exact Origin from the request.
 *
 * This ensures browsers enforce the same-origin check while still allowing
 * legitimate merchant sites to call the widget API.
 */
final class SetWidgetCorsHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $origin = $request->header('Origin');

        if ($origin !== null && $origin !== '') {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Vary', 'Origin');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Accept');
        }

        return $response;
    }
}
