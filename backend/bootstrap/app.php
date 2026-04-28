<?php

declare(strict_types=1);

use App\Http\Middleware\ForceJsonResponse;
use App\Http\Middleware\LogApiRequests;
use App\Http\Middleware\RequireRole;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\SetLocale;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withCommands([
        \App\WidgetRuntime\Console\Commands\CleanupDemoSessions::class,
        \App\WidgetRuntime\Console\Commands\Catalog\ImportXlsxCommand::class,
        \App\WidgetRuntime\Console\Commands\Catalog\TagCommand::class,
        \App\Core\Console\Commands\OtpLogin::class,
        \App\Core\Console\Commands\GetOtpCode::class,
        \App\Core\Console\Commands\PurgeNonAdminUsers::class,
        \App\Core\Console\Commands\ExpireSubscriptions::class,
        \App\Core\Console\Commands\SendTrialEndingReminders::class,
        \App\Core\Console\Commands\CleanupNotifications::class,
        \App\Core\Console\Commands\ExpireTrials::class,
        \App\Core\Console\Commands\ProcessGracePeriod::class,
        \App\Core\Console\Commands\ChargeRecurringSubscriptions::class,
    ])
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function (): void {
            \Illuminate\Support\Facades\Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api_runtime.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');

        $middleware->api(prepend: [
            ForceJsonResponse::class,
            SecurityHeaders::class,
            SetLocale::class,
            LogApiRequests::class,
        ]);

        $middleware->alias([
            'role'                 => RequireRole::class,
            'widget.session'       => \App\Http\Middleware\VerifyWidgetSession::class,
            'resolve.site.origin'  => \App\WidgetRuntime\Http\Middleware\ResolveSiteFromOrigin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'error' => [
                        'code' => 'UNAUTHENTICATED',
                        'message' => 'Authentication required.',
                    ],
                ], 401);
            }

            return null; // Let Laravel handle web redirects (e.g. Google OAuth)
        });

        $exceptions->render(function (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'message' => __('messages.validation_error'),
                    'details' => $e->errors(),
                ],
            ], 422);
        });

        $exceptions->render(function (\Illuminate\Database\UniqueConstraintViolationException $e, \Illuminate\Http\Request $request) {
            if (!($request->is('api/*') || $request->expectsJson())) {
                return null;
            }

            if (str_contains($e->getMessage(), 'sites_domain_user_id_unique')) {
                return response()->json([
                    'error' => [
                        'code' => 'VALIDATION_ERROR',
                        'message' => __('messages.validation_error'),
                        'details' => [
                            'url' => [__('messages.site_already_connected')],
                        ],
                    ],
                ], 422);
            }

            return response()->json([
                'error' => [
                    'code' => 'CONFLICT',
                    'message' => 'Resource already exists.',
                ],
            ], 409);
        });

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'error' => [
                        'code' => 'NOT_FOUND',
                        'message' => $e->getMessage() ?: 'Resource not found.',
                    ],
                ], 404);
            }

            return null;
        });

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\HttpException $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'error' => [
                        'code' => 'HTTP_ERROR',
                        'message' => $e->getMessage(),
                    ],
                ], $e->getStatusCode());
            }

            return null;
        });

        $exceptions->render(function (\Tymon\JWTAuth\Exceptions\TokenExpiredException $e) {
            return response()->json([
                'error' => [
                    'code' => 'TOKEN_EXPIRED',
                    'message' => 'Token has expired.',
                ],
            ], 401);
        });

        $exceptions->render(function (\Tymon\JWTAuth\Exceptions\TokenInvalidException $e) {
            return response()->json([
                'error' => [
                    'code' => 'TOKEN_INVALID',
                    'message' => 'Token is invalid.',
                ],
            ], 401);
        });

        $exceptions->render(function (\Tymon\JWTAuth\Exceptions\JWTException $e) {
            return response()->json([
                'error' => [
                    'code' => 'TOKEN_ABSENT',
                    'message' => 'Token not provided.',
                ],
            ], 401);
        });
    })->create();
