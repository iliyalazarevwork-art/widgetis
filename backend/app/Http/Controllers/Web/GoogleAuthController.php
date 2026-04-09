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

    public function callback(): RedirectResponse
    {
        $frontendUrl = (string) config('app.frontend_url');

        try {
            /** @var SocialiteUser $googleUser */
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Google OAuth failed', [
                'message' => $e->getMessage(),
                'class' => $e::class,
            ]);

            return redirect($frontendUrl . '/login?error=google_failed');
        }

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
        } elseif (! $user->email_verified_at) {
            $user->email_verified_at = now()->toDateTimeString();
            $user->save();
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

        return redirect($frontendUrl . '/auth/google/callback?token=' . urlencode($token));
    }
}
