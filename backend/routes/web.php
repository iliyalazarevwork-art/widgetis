<?php

declare(strict_types=1);

use App\Http\Controllers\Web\GoogleAuthController;
use App\Http\Controllers\Web\LiqPayReturnController;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Route;

// --- Google OAuth ---
Route::get('/auth/google', [GoogleAuthController::class, 'redirect'])->name('auth.google');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');

// --- LiqPay result_url (browser redirect after payment) ---
Route::match(['GET', 'POST'], '/liqpay/return', [LiqPayReturnController::class, 'handle'])
    ->withoutMiddleware([ValidateCsrfToken::class]);

// Live-demo site proxy lives in the dedicated `site-proxy` Node service.
// Caddy routes /site/*, /content/*, /frontend/*, /bundles/*, /_widget/*,
// /seen_items/* and /{locale}/(_widget|seen_items)/* straight to it.

Route::view('/', 'welcome');
