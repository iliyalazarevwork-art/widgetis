<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteTwoUser;
use Throwable;
use Tymon\JWTAuth\Facades\JWTAuth;

class GoogleAuthController extends Controller
{
    public function redirect(): RedirectResponse
    {
        /** @var RedirectResponse */
        return Socialite::driver('google')->stateless()->redirect();
    }

    public function callback(\Illuminate\Http\Request $request): RedirectResponse
    {
        $frontendUrl = (string) config('app.frontend_url');

        $code = (string) $request->query('code', '');
        $codeFingerprint = $code === '' ? null : substr(hash('sha256', $code), 0, 12);

        \Illuminate\Support\Facades\Log::channel('auth')->info('Google OAuth callback received', [
            'ip' => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
            'has_code' => $code !== '',
            'code_fp' => $codeFingerprint,
            'state' => (string) $request->query('state', ''),
            'error' => (string) $request->query('error', ''),
        ]);

        try {
            /** @var SocialiteUser $googleUser */
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Google OAuth failed', [
                'message' => $e->getMessage(),
                'class' => $e::class,
                'ip' => $request->ip(),
                'user_agent' => (string) $request->userAgent(),
                'code_fp' => $codeFingerprint,
            ]);

            return redirect($frontendUrl . '/login?error=google_failed');
        }

        \Illuminate\Support\Facades\Log::channel('auth')->info('Google OAuth token exchange succeeded', [
            'ip' => $request->ip(),
            'code_fp' => $codeFingerprint,
            'google_id' => $googleUser->getId(),
            'email' => $googleUser->getEmail(),
        ]);

        $email = $googleUser->getEmail();

        if (! $email) {
            return redirect($frontendUrl . '/login?error=google_no_email');
        }

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $googleUser->getName() ?? $email,
                'email_verified_at' => now()->toDateTimeString(),
            ],
        );

        if ($user->wasRecentlyCreated) {
            $user->assignRole(UserRole::Customer->value);
        } else {
            if (! $user->email_verified_at) {
                $user->email_verified_at = now()->toDateTimeString();
                $user->save();
            }
            if ($user->roles->isEmpty()) {
                $user->assignRole(UserRole::Customer->value);
            }
        }

        $token = null;
        $refreshToken = null;

        if ($googleUser instanceof SocialiteTwoUser) {
            $token = $googleUser->token;
            $refreshToken = $googleUser->refreshToken;
        }

        SocialAccount::updateOrCreate(
            ['provider' => 'google', 'provider_id' => (string) $googleUser->getId()],
            [
                'user_id' => $user->id,
                'provider_token' => $token,
                'provider_refresh_token' => $refreshToken,
            ],
        );

        /** @var string $token */
        $token = JWTAuth::fromUser($user);

        return redirect($frontendUrl . '/login/google-callback?token=' . urlencode($token));
    }
}
