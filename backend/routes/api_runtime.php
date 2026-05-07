<?php

declare(strict_types=1);

use App\SmartSearch\Http\Controllers\PublicSearchController;
use App\WidgetRuntime\Http\Controllers\Api\V1\Admin\DemoAnalyticsController;
use App\WidgetRuntime\Http\Controllers\Api\V1\Admin\DemoSessionController as AdminDemoSessionController;
use App\WidgetRuntime\Http\Controllers\Api\V1\Admin\OnePlusOnePromoController;
use App\WidgetRuntime\Http\Controllers\Api\V1\Admin\SiteController as AdminSiteController;
use App\WidgetRuntime\Http\Controllers\Api\V1\Admin\WidgetBuilderController;
use App\WidgetRuntime\Http\Controllers\Api\V1\Profile\SiteController as ProfileSiteController;
use App\WidgetRuntime\Http\Controllers\Api\V1\Profile\SmsOtpProviderController;
use App\WidgetRuntime\Http\Controllers\Api\V1\Profile\WidgetController;
use App\WidgetRuntime\Http\Controllers\Api\V1\Public\DemoSessionController;
use App\WidgetRuntime\Http\Controllers\Api\V1\Widget\CartRecommenderSuggestController;
use App\WidgetRuntime\Http\Controllers\Api\V1\Widget\OnePlusOneEvaluateController;
use App\WidgetRuntime\Http\Controllers\Api\V1\Widget\ScriptPingController;
use App\WidgetRuntime\Http\Controllers\Api\V1\Widget\SmsOtpRequestController;
use App\WidgetRuntime\Http\Controllers\Api\V1\Widget\SmsOtpVerifyController;
use App\WidgetRuntime\Http\Controllers\Api\V1\Widget\WidgetReviewController;
use App\WidgetRuntime\Http\Controllers\Api\V1\Widget\WidgetSessionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Widget Runtime API Routes
|--------------------------------------------------------------------------
|
| Endpoints serving widget runtime traffic on customer sites and the
| runtime-related parts of the customer cabinet (sites, site widgets,
| demo sessions, OTP, reviews). Kept separate from api.php so the
| WidgetRuntime context can be extracted into its own service later.
|
*/

Route::prefix('v1')->group(function () {

    // --- Public widget API (short-lived JWT session) ---
    Route::prefix('widgets')->group(function () {
        Route::post('session', WidgetSessionController::class)->middleware('throttle:30,1');
        Route::middleware('widget.session')->group(function () {
            Route::post('sms-otp/request', SmsOtpRequestController::class)->middleware('throttle:60,1');
            Route::post('sms-otp/verify', SmsOtpVerifyController::class)->middleware('throttle:60,1');
        });
    });

    // --- Widgets collection (Origin-checked, no JWT) ---
    Route::prefix('widgets')
        ->middleware([
            'resolve.site.origin',
            \App\WidgetRuntime\Http\Middleware\SetWidgetCorsHeaders::class,
        ])
        ->group(function () {
            Route::post('reviews', [WidgetReviewController::class, 'store'])->middleware('throttle:30,60');
            Route::get('reviews', [WidgetReviewController::class, 'index'])->middleware('throttle:60,1');

            Route::get('cart-recommender/suggest', CartRecommenderSuggestController::class)
                ->middleware('throttle:60,1');

            Route::post('one-plus-one/evaluate', OnePlusOneEvaluateController::class)
                ->middleware('throttle:120,1');

            Route::get('smart-search/feed', \App\SmartSearch\Http\Controllers\PublicFeedController::class)
                ->middleware('throttle:30,1');
            Route::get('smart-search', PublicSearchController::class)->middleware('throttle:60,1');

        });

    // Script installation ping — always 200, no auth, handles CORS itself
    Route::post('widgets/script-ping', ScriptPingController::class)->middleware('throttle:5,60');

    // --- Demo sessions (public) ---
    Route::get('demo-sessions/{code}', [DemoSessionController::class, 'show'])->middleware('throttle:30,1');
    Route::post('demo-sessions', [DemoSessionController::class, 'store'])->middleware('throttle:10,1');

    // --- Profile (customer) — runtime routes only ---
    Route::prefix('profile')->middleware(['auth:core', 'role:customer'])->group(function () {
        Route::get('sites', [ProfileSiteController::class, 'index']);
        Route::post('sites', [ProfileSiteController::class, 'store']);
        Route::get('sites/{id}', [ProfileSiteController::class, 'show']);
        Route::delete('sites/{id}', [ProfileSiteController::class, 'destroy']);
        Route::post('sites/{id}/verify', [ProfileSiteController::class, 'verify']);
        Route::get('sites/{id}/script', [ProfileSiteController::class, 'script']);
        Route::put('sites/{siteId}/widgets/{productId}', [ProfileSiteController::class, 'updateWidget']);
        Route::get('widgets/{productSlug}/config-schema', [WidgetController::class, 'configSchema']);

        Route::prefix('widgets/sms-otp')->group(function () {
            Route::get('providers', [SmsOtpProviderController::class, 'index']);
            Route::post('providers', [SmsOtpProviderController::class, 'store']);
            Route::put('providers/{configId}', [SmsOtpProviderController::class, 'update']);
            Route::delete('providers/{configId}', [SmsOtpProviderController::class, 'destroy']);
            Route::post('providers/{configId}/test', [SmsOtpProviderController::class, 'test'])->middleware('throttle:3,60');
        });
    });

    // --- Admin — runtime routes only ---
    Route::prefix('admin')->middleware(['auth:core', 'role:admin'])->group(function () {
        Route::get('sites', [AdminSiteController::class, 'index']);
        Route::get('sites/{id}', [AdminSiteController::class, 'show']);
        Route::post('sites/{id}/deploy', [AdminSiteController::class, 'deploy'])
            ->middleware('throttle:10,60');
        Route::put('sites/{siteId}/widgets/{productId}', [AdminSiteController::class, 'updateWidget']);
        Route::post('demo-sessions', [AdminDemoSessionController::class, 'store']);
        Route::get('demo-analytics', [DemoAnalyticsController::class, 'index']);

        // Widget-builder proxy — widget-builder itself is not exposed publicly.
        Route::get('widget-builder/modules', [WidgetBuilderController::class, 'modules']);
        Route::post('widget-builder/build', [WidgetBuilderController::class, 'build'])
            ->middleware('throttle:30,60');

        // 1+1=3 promos CRUD
        Route::get('one-plus-one-promos', [OnePlusOnePromoController::class, 'index']);
        Route::post('one-plus-one-promos', [OnePlusOnePromoController::class, 'store']);
        Route::get('one-plus-one-promos/{id}', [OnePlusOnePromoController::class, 'show']);
        Route::put('one-plus-one-promos/{id}', [OnePlusOnePromoController::class, 'update']);
        Route::delete('one-plus-one-promos/{id}', [OnePlusOnePromoController::class, 'destroy']);
        Route::post('one-plus-one-promos/{id}/rebuild-map', [OnePlusOnePromoController::class, 'rebuildMap'])
            ->middleware('throttle:10,60');
        Route::post('one-plus-one-promos/{id}/clear-cache', [OnePlusOnePromoController::class, 'clearCache'])
            ->middleware('throttle:30,60');
    });
});
