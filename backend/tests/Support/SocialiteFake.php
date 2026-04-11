<?php

declare(strict_types=1);

namespace Tests\Support;

use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteTwoUser;
use Mockery;

/**
 * Helper for faking Laravel Socialite responses in feature tests.
 *
 * Usage:
 *   SocialiteFake::google(['email' => 'x@example.com', 'id' => '123']);
 *   SocialiteFake::googleFailure(new \RuntimeException('boom'));
 */
final class SocialiteFake
{
    /**
     * Stub a successful Google OAuth callback.
     *
     * @param array<string, mixed> $overrides
     */
    public static function google(array $overrides = []): SocialiteTwoUser
    {
        $user = self::buildSocialiteUser($overrides);

        $driver = Mockery::mock('Laravel\Socialite\Contracts\Provider');
        $driver->shouldReceive('stateless')->andReturnSelf();
        $driver->shouldReceive('user')->andReturn($user);

        Socialite::shouldReceive('driver')->with('google')->andReturn($driver);

        return $user;
    }

    /**
     * Stub Google OAuth token-exchange throwing (e.g. invalid_grant).
     */
    public static function googleFailure(\Throwable $exception): void
    {
        $driver = Mockery::mock('Laravel\Socialite\Contracts\Provider');
        $driver->shouldReceive('stateless')->andReturnSelf();
        $driver->shouldReceive('user')->andThrow($exception);

        Socialite::shouldReceive('driver')->with('google')->andReturn($driver);
    }

    /**
     * @param array<string, mixed> $overrides
     */
    private static function buildSocialiteUser(array $overrides): SocialiteTwoUser
    {
        $user = new SocialiteTwoUser();
        $user->id = $overrides['id'] ?? '1000'.fake()->numerify('##########');
        $user->name = $overrides['name'] ?? 'Test User';
        $user->email = $overrides['email'] ?? fake()->unique()->safeEmail();
        $user->avatar = $overrides['avatar'] ?? null;
        $user->token = $overrides['token'] ?? 'fake-access-token';
        $user->refreshToken = $overrides['refreshToken'] ?? 'fake-refresh-token';
        $user->expiresIn = $overrides['expiresIn'] ?? 3600;
        $user->user = $overrides['raw'] ?? [
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
        ];

        return $user;
    }
}
