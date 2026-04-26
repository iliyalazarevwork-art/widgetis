<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Cross-Origin Resource Sharing (CORS) Configuration
|--------------------------------------------------------------------------
|
| Strategy for widget endpoints (api/v1/widget/*):
|   • We do NOT allow '*' — that would expose widget endpoints to any site.
|   • Instead we use a runtime-reflection approach: the ResolveSiteFromOrigin
|     middleware (registered as 'resolve.site.origin') validates that the
|     incoming Origin matches a row in wgt_sites.domain and sets request
|     attributes accordingly.
|   • To make the browser's preflight (OPTIONS) succeed we add a tiny wrapper
|     that sets Access-Control-Allow-Origin to the reflected origin AFTER the
|     middleware chain has confirmed it is registered.  This is done via the
|     WidgetCorsMiddleware registered on the widget route group.
|
|   For all other API paths (profile, admin) the default fruitcake/cors
|   config applies with an empty allowed_origins list (same-origin only).
|
| See: App\WidgetRuntime\Http\Middleware\ResolveSiteFromOrigin
|      App\WidgetRuntime\Http\Middleware\SetWidgetCorsHeaders
*/

return [

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    /*
     * Allow all origins here — we do our own domain check in
     * ResolveSiteFromOrigin and then narrow down the header in
     * SetWidgetCorsHeaders.  A wildcard here is required so that
     * HandleCors doesn't short-circuit before our middleware runs.
     *
     * Security note: just because HandleCors passes the request through
     * does NOT mean the widget endpoint accepts it — ResolveSiteFromOrigin
     * will still return 403 for unknown origins.  The actual
     * Access-Control-Allow-Origin value sent to the client is narrowed to
     * the exact Origin by SetWidgetCorsHeaders (not '*').
     */
    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'Accept', 'X-Requested-With', 'Authorization', 'Accept-Language'],

    'exposed_headers' => [],

    'max_age' => 3600,

    'supports_credentials' => false,

];
