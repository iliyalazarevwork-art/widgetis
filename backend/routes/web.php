<?php

declare(strict_types=1);

use App\Http\Controllers\Web\GoogleAuthController;
use Illuminate\Support\Facades\Route;

// --- Google OAuth ---
Route::get('/auth/google', [GoogleAuthController::class, 'redirect'])->name('auth.google');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');

// Live-demo site proxy lives in the dedicated `site-proxy` Node service.
// Caddy routes /site/*, /content/*, /frontend/*, /bundles/*, /_widget/*,
// /seen_items/* and /{locale}/(_widget|seen_items)/* straight to it.

Route::view('/', 'welcome');
