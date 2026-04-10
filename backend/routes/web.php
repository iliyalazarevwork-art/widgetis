<?php

declare(strict_types=1);

use App\Http\Controllers\Web\GoogleAuthController;
use App\Http\Controllers\Web\LiqPayReturnController;
use App\Http\Controllers\Web\SiteProxyController;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Support\Facades\Route;
use Illuminate\View\Middleware\ShareErrorsFromSession;

// --- Google OAuth ---
Route::get('/auth/google', [GoogleAuthController::class, 'redirect'])->name('auth.google');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');

// --- LiqPay result_url (browser redirect after payment) ---
Route::match(['GET', 'POST'], '/liqpay/return', [LiqPayReturnController::class, 'handle'])
    ->withoutMiddleware([ValidateCsrfToken::class]);

$proxyMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

// Strip session/CSRF/cookie middleware from proxy routes.
// Sessions use a file lock that serializes every parallel asset request,
// turning a multi-second page load into tens of seconds. Visitor state
// lives in Cache keyed by a plain visitor cookie instead.
$proxyWithoutMiddleware = [
    ValidateCsrfToken::class,
    StartSession::class,
    ShareErrorsFromSession::class,
    EncryptCookies::class,
    AddQueuedCookiesToResponse::class,
];

Route::match($proxyMethods, '/site/{domain}/{path?}', [SiteProxyController::class, 'proxy'])
    ->where('path', '.*')
    ->withoutMiddleware($proxyWithoutMiddleware);

Route::match($proxyMethods, '/{prefix}/{path?}', [SiteProxyController::class, 'proxyCurrentPrefix'])
    ->where('prefix', 'content|frontend|bundles|_widget|seen_items')
    ->where('path', '.*')
    ->withoutMiddleware($proxyWithoutMiddleware);

Route::match($proxyMethods, '/{locale}/{prefix}/{path?}', [SiteProxyController::class, 'proxyCurrentLocalePrefix'])
    ->where('locale', '[a-z]{2}(?:-[A-Z]{2})?')
    ->where('prefix', '_widget|seen_items')
    ->where('path', '.*')
    ->withoutMiddleware($proxyWithoutMiddleware);

Route::view('/', 'welcome');
