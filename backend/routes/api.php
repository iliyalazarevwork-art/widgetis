<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Admin;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Profile\DashboardController;
use App\Http\Controllers\Api\V1\Profile\NotificationController;
use App\Http\Controllers\Api\V1\Profile\ProfileController;
use App\Http\Controllers\Api\V1\Profile\SubscriptionController;
use App\Http\Controllers\Api\V1\Public\CaseController;
use App\Http\Controllers\Api\V1\Public\ConsultationController;
use App\Http\Controllers\Api\V1\Public\FaqController;
use App\Http\Controllers\Api\V1\Public\GuestCheckoutController;
use App\Http\Controllers\Api\V1\Public\LeadRequestController;
use App\Http\Controllers\Api\V1\Public\ManagerRequestController;
use App\Http\Controllers\Api\V1\Public\PlanController;
use App\Http\Controllers\Api\V1\Public\ProductController;
use App\Http\Controllers\Api\V1\Public\SettingsController;
use App\Http\Controllers\Api\V1\Public\SystemController;
use App\Http\Controllers\Api\V1\Public\TagController;
use App\Http\Controllers\Api\V1\Webhooks\MonobankWebhookController;
use App\Http\Controllers\Api\V1\Webhooks\WayForPayWebhookController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // --- Monobank webhook (public, ECDSA signature verified inside provider) ---
    Route::post('webhooks/monobank', MonobankWebhookController::class);

    // --- WayForPay webhook (public, HMAC-MD5 signature verified inside provider) ---
    Route::post('payments/wayforpay/callback', WayForPayWebhookController::class);

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
    Route::post('public/checkout', GuestCheckoutController::class)->middleware('throttle:10,1');

    // --- Auth (public) ---
    // In dev (OTP_DEV_BYPASS=true) the throttle caps are raised so the
    // Playwright E2E suite — which fires dozens of OTP calls per run from
    // 127.0.0.1 — doesn't trip the 10/min per-IP limiter. The higher cap
    // has no effect in prod because OTP_DEV_BYPASS stays false there.
    $otpSendLimit   = (bool) config('app.otp_dev_bypass', false) ? 500 : 10;
    $otpVerifyLimit = (bool) config('app.otp_dev_bypass', false) ? 500 : 10;
    $otpResendLimit = (bool) config('app.otp_dev_bypass', false) ? 200 : 3;

    Route::prefix('auth')->group(function () use ($otpSendLimit, $otpVerifyLimit, $otpResendLimit) {
        Route::post('otp', [AuthController::class, 'sendOtp'])->middleware("throttle:{$otpSendLimit},1");
        Route::post('otp/verify', [AuthController::class, 'verifyOtp'])->middleware("throttle:{$otpVerifyLimit},1");
        Route::post('otp/resend', [AuthController::class, 'resendOtp'])->middleware("throttle:{$otpResendLimit},1");

        // Magic link — user clicks confirm, frontend polls for status
        Route::get('link/{token}/confirm', [AuthController::class, 'confirmLink'])->middleware('throttle:20,1');
        Route::get('link/{token}/status', [AuthController::class, 'linkStatus'])->middleware('throttle:60,1');
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
        Route::get('subscription/upgrade-preview', [SubscriptionController::class, 'upgradePreview']);
        Route::post('subscription/upgrade', [SubscriptionController::class, 'upgrade'])
            ->middleware('throttle:5,60');
        Route::post('subscription/cancel', [SubscriptionController::class, 'cancel']);
        Route::post('subscription/checkout/cancel', [SubscriptionController::class, 'cancelPendingCheckout']);
        Route::post('subscription/checkout', [SubscriptionController::class, 'checkout'])
            ->middleware('throttle:5,60');
    });

    // --- Admin ---
    Route::prefix('admin')->middleware(['auth:api', 'role:admin'])->group(function () {
        Route::get('dashboard', [Admin\DashboardController::class, 'index']);
        Route::get('orders', [Admin\OrderController::class, 'index']);
        Route::get('orders/{id}', [Admin\OrderController::class, 'show']);
        Route::get('users', [Admin\UserController::class, 'index']);
        Route::get('users/{id}', [Admin\UserController::class, 'show']);
        Route::get('subscriptions', [Admin\SubscriptionController::class, 'index']);
    });
});
