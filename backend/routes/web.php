<?php

declare(strict_types=1);

use App\Http\Controllers\Web\GoogleAuthController;
use App\Http\Controllers\Web\SiteProxyController;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Route;

// --- Google OAuth ---
Route::get('/auth/google', [GoogleAuthController::class, 'redirect'])->name('auth.google');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');

$proxyMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

Route::match($proxyMethods, '/site/{domain}/{path?}', [SiteProxyController::class, 'proxy'])
    ->where('path', '.*')
    ->withoutMiddleware([ValidateCsrfToken::class]);

Route::match($proxyMethods, '/{prefix}/{path?}', [SiteProxyController::class, 'proxyCurrentPrefix'])
    ->where('prefix', 'content|frontend|bundles|_widget|seen_items')
    ->where('path', '.*')
    ->withoutMiddleware([ValidateCsrfToken::class]);

Route::match($proxyMethods, '/{locale}/{prefix}/{path?}', [SiteProxyController::class, 'proxyCurrentLocalePrefix'])
    ->where('locale', '[a-z]{2}(?:-[A-Z]{2})?')
    ->where('prefix', '_widget|seen_items')
    ->where('path', '.*')
    ->withoutMiddleware([ValidateCsrfToken::class]);

Route::get('/', function () {
    return view('welcome');
});
