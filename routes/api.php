<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Auth\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API V1 Routes
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

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
        // Will be filled in later steps
    });

    // --- Admin ---
    Route::prefix('admin')->middleware(['auth:api', 'role:admin'])->group(function () {
        // Will be filled in later steps
    });
});
