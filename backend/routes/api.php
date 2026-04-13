<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Admin;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Payment\CheckoutController;
use App\Http\Controllers\Api\V1\Profile\DashboardController;
use App\Http\Controllers\Api\V1\Profile\NotificationController;
use App\Http\Controllers\Api\V1\Profile\ProfileController;
use App\Http\Controllers\Api\V1\Profile\SiteController;
use App\Http\Controllers\Api\V1\Profile\SubscriptionController;
use App\Http\Controllers\Api\V1\Profile\WidgetController;
use App\Http\Controllers\Api\V1\Public\CaseController;
use App\Http\Controllers\Api\V1\Public\ConsultationController;
use App\Http\Controllers\Api\V1\Public\DemoSessionController;
use App\Http\Controllers\Api\V1\Public\FaqController;
use App\Http\Controllers\Api\V1\Public\LeadRequestController;
use App\Http\Controllers\Api\V1\Public\ManagerRequestController;
use App\Http\Controllers\Api\V1\Public\PlanController;
use App\Http\Controllers\Api\V1\Public\ProductController;
use App\Http\Controllers\Api\V1\Public\SettingsController;
use App\Http\Controllers\Api\V1\Public\SystemController;
use App\Http\Controllers\Api\V1\Public\TagController;
use App\Http\Controllers\Api\V1\Webhooks\LiqPayWebhookController;
use App\Http\Controllers\Api\V1\Webhooks\MonobankWebhookController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // --- LiqPay webhook (public, no auth — signature verified inside controller) ---
    Route::post('payments/liqpay/callback', [LiqPayWebhookController::class, 'handle']);

    // --- Monobank webhook (public, ECDSA signature verified inside provider) ---
    Route::post('webhooks/monobank', MonobankWebhookController::class);

    // --- Health check ---
    Route::get('health', [SystemController::class, 'health']);

    // --- Public catalog ---
    Route::get('plans', [PlanController::class, 'index']);
    Route::get('plans/features', [PlanController::class, 'features']);
    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{slug}', [ProductController::class, 'show']);
    Route::get('tags', [TagController::class, 'index']);
    Route::get('settings', [SettingsController::class, 'index']);
    Route::get('platforms', [SystemController::class, 'platforms']);
    Route::get('cases', [CaseController::class, 'index']);
    Route::get('faq', [FaqController::class, 'index']);
    Route::post('consultations', [ConsultationController::class, 'store'])->middleware('throttle:3,60');
    Route::post('manager-requests', [ManagerRequestController::class, 'store'])->middleware('throttle:3,60');
    Route::post('lead-requests', [LeadRequestController::class, 'store'])->middleware('throttle:5,1');

    // --- Demo sessions (public) ---
    Route::get('demo-sessions/{code}', [DemoSessionController::class, 'show'])->middleware('throttle:30,1');
    Route::post('demo-sessions', [DemoSessionController::class, 'store'])->middleware('throttle:10,1');

    // --- Auth (public) ---
    Route::prefix('auth')->group(function () {
        Route::post('otp', [AuthController::class, 'sendOtp'])->middleware('throttle:10,1');
        Route::post('otp/verify', [AuthController::class, 'verifyOtp'])->middleware('throttle:10,1');
        Route::post('otp/resend', [AuthController::class, 'resendOtp'])->middleware('throttle:3,1');
    });

    // --- Auth (protected) ---
    Route::prefix('auth')->middleware('auth:api')->group(function () {
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('user', [AuthController::class, 'user']);
    });

    // --- Profile (customer) ---
    // Admin role is intentionally excluded: admins have no subscription and must not access cabinet routes.
    Route::prefix('profile')->middleware(['auth:api', 'role:customer'])->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index']);
        Route::get('/', [ProfileController::class, 'show']);
        Route::put('/', [ProfileController::class, 'update']);
        Route::delete('/', [ProfileController::class, 'destroy']);
        Route::post('onboarding/complete', [ProfileController::class, 'completeOnboarding']);
        Route::put('settings', [ProfileController::class, 'updateSettings']);
        Route::get('widgets', [ProfileController::class, 'widgets']);
        Route::get('payments', [ProfileController::class, 'payments']);
        Route::post('support-requests', [ProfileController::class, 'createSupportRequest']);
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::get('subscription', [SubscriptionController::class, 'show']);
        Route::post('subscription/start-trial', [SubscriptionController::class, 'startTrial']);
        Route::get('subscription/prorate', [SubscriptionController::class, 'prorate']);
        Route::post('subscription/change', [SubscriptionController::class, 'change']);
        Route::post('subscription/cancel', [SubscriptionController::class, 'cancel']);
        Route::post('subscription/checkout/trial', [CheckoutController::class, 'startTrial']);
        Route::post('subscription/checkout', [SubscriptionController::class, 'checkout']);
        Route::get('sites', [SiteController::class, 'index']);
        Route::post('sites', [SiteController::class, 'store']);
        Route::get('sites/{id}', [SiteController::class, 'show']);
        Route::delete('sites/{id}', [SiteController::class, 'destroy']);
        Route::post('sites/{id}/verify', [SiteController::class, 'verify']);
        Route::get('sites/{id}/script', [SiteController::class, 'script']);
        Route::put('sites/{siteId}/widgets/{productId}', [SiteController::class, 'updateWidget']);
        Route::get('widgets/{productSlug}/config-schema', [WidgetController::class, 'configSchema']);
    });

    // --- Admin ---
    Route::prefix('admin')->middleware(['auth:api', 'role:admin'])->group(function () {
        Route::get('dashboard', [Admin\DashboardController::class, 'index']);
        Route::get('orders', [Admin\OrderController::class, 'index']);
        Route::get('orders/{id}', [Admin\OrderController::class, 'show']);
        Route::get('users', [Admin\UserController::class, 'index']);
        Route::get('users/{id}', [Admin\UserController::class, 'show']);
        Route::get('subscriptions', [Admin\SubscriptionController::class, 'index']);
        Route::get('sites', [Admin\SiteController::class, 'index']);
        Route::get('sites/{id}', [Admin\SiteController::class, 'show']);
        Route::post('sites/{id}/deploy', [Admin\SiteController::class, 'deploy']);
        Route::put('sites/{siteId}/widgets/{productId}', [Admin\SiteController::class, 'updateWidget']);
        Route::post('demo-sessions', [Admin\DemoSessionController::class, 'store']);
    });
});
