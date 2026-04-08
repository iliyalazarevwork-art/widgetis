<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Profile\SiteController;
use App\Http\Controllers\Api\V1\Profile\SubscriptionController;
use App\Http\Controllers\Api\V1\Public\PlanController;
use App\Http\Controllers\Api\V1\Public\ProductController;
use App\Http\Controllers\Api\V1\Public\SettingsController;
use App\Http\Controllers\Api\V1\Public\TagController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API V1 Routes
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // --- Health check ---
    Route::get('health', function () {
        return response()->json([
            'status' => 'ok',
            'version' => app()->version(),
            'timestamp' => now()->toIso8601String(),
        ]);
    });

    // --- Public catalog ---
    Route::get('plans', [PlanController::class, 'index']);
    Route::get('plans/features', [PlanController::class, 'features']);
    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{slug}', [ProductController::class, 'show']);
    Route::get('tags', [TagController::class, 'index']);
    Route::get('settings', [SettingsController::class, 'index']);

    // --- Auth (public) ---
    Route::prefix('auth')->group(function () {
        Route::post('otp', [AuthController::class, 'sendOtp'])
            ->middleware('throttle:10,1');
        Route::post('otp/verify', [AuthController::class, 'verifyOtp'])
            ->middleware('throttle:10,1');
        Route::post('otp/resend', [AuthController::class, 'resendOtp'])
            ->middleware('throttle:3,1');
    });

    // --- Auth (protected) ---
    Route::prefix('auth')->middleware('auth:api')->group(function () {
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('user', [AuthController::class, 'user']);
    });

    // --- Profile (customer) ---
    Route::prefix('profile')->middleware(['auth:api', 'role:customer,admin'])->group(function () {
        // Subscription
        Route::get('subscription', [SubscriptionController::class, 'show']);
        Route::get('subscription/prorate', [SubscriptionController::class, 'prorate']);
        Route::post('subscription/change', [SubscriptionController::class, 'change']);
        Route::post('subscription/cancel', [SubscriptionController::class, 'cancel']);

        // Sites
        Route::get('sites', [SiteController::class, 'index']);
        Route::post('sites', [SiteController::class, 'store']);
        Route::get('sites/{id}', [SiteController::class, 'show']);
        Route::delete('sites/{id}', [SiteController::class, 'destroy']);
        Route::post('sites/{id}/verify', [SiteController::class, 'verify']);
        Route::get('sites/{id}/script', [SiteController::class, 'script']);
        Route::put('sites/{siteId}/widgets/{productId}', [SiteController::class, 'updateWidget']);
    });

    // --- Admin ---
    Route::prefix('admin')->middleware(['auth:api', 'role:admin'])->group(function () {
        // Will be filled in later steps
    });
});
