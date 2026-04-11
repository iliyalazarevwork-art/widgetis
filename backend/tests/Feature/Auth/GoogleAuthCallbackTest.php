<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Laravel\Socialite\Facades\Socialite;
use Tests\Support\SocialiteFake;
use Tests\TestCase;

class GoogleAuthCallbackTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('app.frontend_url', 'https://app.test');
    }

    public function test_redirect_endpoint_returns_redirect_response(): void
    {
        $driver = \Mockery::mock('Laravel\Socialite\Contracts\Provider');
        $driver->shouldReceive('stateless')->andReturnSelf();
        $driver->shouldReceive('redirect')->andReturn(redirect('https://accounts.google.com/fake'));

        Socialite::shouldReceive('driver')->with('google')->andReturn($driver);

        $response = $this->get('/auth/google');

        $response->assertStatus(302);
        $this->assertStringStartsWith(
            'https://accounts.google.com',
            $response->headers->get('Location'),
        );
    }

    public function test_callback_creates_new_user_with_customer_role_and_redirects_with_jwt(): void
    {
        SocialiteFake::google([
            'id'    => '9999',
            'email' => 'new@user.test',
            'name'  => 'New User',
        ]);

        $response = $this->get('/auth/google/callback?code=fake-code');

        $response->assertStatus(302);

        $location = $response->headers->get('Location');
        $this->assertStringStartsWith('https://app.test/login/google-callback?token=', $location);

        // Token param is non-empty
        parse_str((string) parse_url($location, PHP_URL_QUERY), $params);
        $this->assertNotEmpty($params['token']);

        // User created with verified email
        $user = User::where('email', 'new@user.test')->firstOrFail();
        $this->assertNotNull($user->email_verified_at);

        // Role assigned
        $this->assertTrue($user->hasRole('customer'));

        // SocialAccount created
        $this->assertDatabaseHas('social_accounts', [
            'provider'    => 'google',
            'provider_id' => '9999',
            'user_id'     => $user->id,
        ]);
    }

    public function test_callback_updates_existing_user_without_creating_duplicate(): void
    {
        $existing = User::factory()->create(['email' => 'existing@user.test']);
        $existing->assignRole('customer');

        SocialiteFake::google([
            'id'    => '1111',
            'email' => 'existing@user.test',
        ]);

        $response = $this->get('/auth/google/callback?code=fake-code');

        $response->assertStatus(302);
        $this->assertStringStartsWith(
            'https://app.test/login/google-callback?token=',
            $response->headers->get('Location'),
        );

        // Only one user with this email
        $this->assertSame(1, User::where('email', 'existing@user.test')->count());

        // SocialAccount created
        $this->assertDatabaseHas('social_accounts', [
            'provider'    => 'google',
            'provider_id' => '1111',
            'user_id'     => $existing->id,
        ]);
    }

    public function test_callback_assigns_customer_role_to_existing_user_without_roles(): void
    {
        $user = User::factory()->create(['email' => 'norole@user.test']);
        // Deliberately NOT assigning any role

        SocialiteFake::google([
            'id'    => '2222',
            'email' => 'norole@user.test',
        ]);

        $this->get('/auth/google/callback?code=fake-code');

        $this->assertTrue($user->fresh()->hasRole('customer'));
    }

    public function test_callback_backfills_email_verified_at_for_unverified_existing_user(): void
    {
        $user = User::factory()->unverified()->create(['email' => 'unverified@user.test']);
        $user->assignRole('customer');

        $this->assertNull($user->email_verified_at);

        SocialiteFake::google([
            'id'    => '3333',
            'email' => 'unverified@user.test',
        ]);

        $this->get('/auth/google/callback?code=fake-code');

        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_callback_redirects_with_error_when_token_exchange_fails(): void
    {
        SocialiteFake::googleFailure(new \RuntimeException('invalid_grant'));

        $response = $this->get('/auth/google/callback?code=bad');

        $response->assertStatus(302);
        $this->assertSame(
            'https://app.test/login?error=google_failed',
            $response->headers->get('Location'),
        );

        $this->assertSame(0, User::count());
    }

    public function test_callback_redirects_with_error_when_google_returns_no_email(): void
    {
        // Build a Socialite user with a genuinely null email (SocialiteFake falls
        // back to fake()->safeEmail() when the override is null/absent, so we
        // mock the driver directly here to guarantee a null email).
        $socialiteUser = new \Laravel\Socialite\Two\User();
        $socialiteUser->id = '5555';
        $socialiteUser->name = 'No Email User';
        $socialiteUser->email = null;
        $socialiteUser->token = 'tok';
        $socialiteUser->refreshToken = null;
        $socialiteUser->user = [];

        $driver = \Mockery::mock('Laravel\Socialite\Contracts\Provider');
        $driver->shouldReceive('stateless')->andReturnSelf();
        $driver->shouldReceive('user')->andReturn($socialiteUser);
        Socialite::shouldReceive('driver')->with('google')->andReturn($driver);

        $response = $this->get('/auth/google/callback?code=fake-code');

        $response->assertStatus(302);
        $this->assertSame(
            'https://app.test/login?error=google_no_email',
            $response->headers->get('Location'),
        );

        $this->assertSame(0, User::count());
    }

    public function test_callback_stores_provider_tokens_on_social_account(): void
    {
        SocialiteFake::google([
            'email'        => 'tok@test.io',
            'id'           => '4444',
            'token'        => 'at-123',
            'refreshToken' => 'rt-123',
        ]);

        $this->get('/auth/google/callback?code=fake-code');

        $account = SocialAccount::where('provider', 'google')
            ->where('provider_id', '4444')
            ->firstOrFail();

        $this->assertSame('at-123', $account->provider_token);
        $this->assertSame('rt-123', $account->provider_refresh_token);
    }
}
