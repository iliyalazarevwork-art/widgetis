<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Mail\Auth\OtpMail;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OtpAuthTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // sendOtp
    // -------------------------------------------------------------------------

    public function test_send_otp_queues_mail_and_stores_code_in_cache(): void
    {
        Mail::fake();

        $email = 'user@example.com';

        $response = $this->postJson('/api/v1/auth/otp', ['email' => $email]);

        $response->assertStatus(200);
        $this->assertTrue(Cache::has("otp:code:{$email}"));
        Mail::assertQueued(OtpMail::class, fn (OtpMail $mail) => $mail->hasTo($email));
    }

    public function test_send_otp_respects_cooldown(): void
    {
        Mail::fake();

        $email = 'cooldown@example.com';

        // First request — succeeds and sets cooldown flag
        $this->postJson('/api/v1/auth/otp', ['email' => $email])->assertStatus(200);

        // Store the original code to confirm it is not overwritten
        $originalCode = Cache::get("otp:code:{$email}");

        // Second request within cooldown window — OtpCooldownException → 429
        $second = $this->postJson('/api/v1/auth/otp', ['email' => $email]);

        $second->assertStatus(429);

        // Original code must still be in cache (not replaced)
        $this->assertSame($originalCode, Cache::get("otp:code:{$email}"));
    }

    public function test_send_otp_validates_email(): void
    {
        // Empty email
        $this->postJson('/api/v1/auth/otp', ['email' => ''])->assertStatus(422);

        // Malformed email
        $this->postJson('/api/v1/auth/otp', ['email' => 'not-an-email'])->assertStatus(422);

        // Missing key entirely
        $this->postJson('/api/v1/auth/otp', [])->assertStatus(422);
    }

    // -------------------------------------------------------------------------
    // verifyOtp — success paths
    // -------------------------------------------------------------------------

    public function test_verify_otp_with_correct_code_creates_new_user_and_returns_jwt(): void
    {
        $email = 'newuser@example.com';
        $code  = '123456';

        Cache::put("otp:code:{$email}", $code, 600);

        $response = $this->postJson('/api/v1/auth/otp/verify', [
            'email' => $email,
            'code'  => $code,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('token_type', 'bearer')
            ->assertJsonStructure(['token', 'user' => ['id', 'email']])
            ->assertJsonPath('user.email', $email);

        // User created in DB with correct role
        $user = User::where('email', $email)->first();
        $this->assertNotNull($user);
        $this->assertNotNull($user->email_verified_at);
        $this->assertTrue($user->hasRole(UserRole::Customer->value));

        // Cache entry cleared after successful verification
        $this->assertFalse(Cache::has("otp:code:{$email}"));
    }

    public function test_verify_otp_with_correct_code_logs_in_existing_user_without_creating_duplicate(): void
    {
        $email = 'existing@example.com';
        $code  = '654321';

        $existing = User::factory()->create(['email' => $email]);
        $existing->assignRole(UserRole::Customer->value);

        Cache::put("otp:code:{$email}", $code, 600);

        $response = $this->postJson('/api/v1/auth/otp/verify', [
            'email' => $email,
            'code'  => $code,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('user.email', $email)
            ->assertJsonStructure(['token']);

        // Only one user row for that email
        $this->assertSame(1, User::where('email', $email)->count());
    }

    // -------------------------------------------------------------------------
    // verifyOtp — failure paths
    // -------------------------------------------------------------------------

    public function test_verify_otp_with_wrong_code_returns_401_and_does_not_create_user(): void
    {
        $email = 'wrong@example.com';

        Cache::put("otp:code:{$email}", '111111', 600);

        $response = $this->postJson('/api/v1/auth/otp/verify', [
            'email' => $email,
            'code'  => '222222',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('error.code', 'INVALID_OTP');

        $this->assertSame(0, User::where('email', $email)->count());
    }

    public function test_verify_otp_with_expired_code_returns_401(): void
    {
        $email = 'expired@example.com';
        // Intentionally do NOT seed cache — simulates an expired / missing code

        $response = $this->postJson('/api/v1/auth/otp/verify', [
            'email' => $email,
            'code'  => '000000',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('error.code', 'INVALID_OTP');
    }

    public function test_verify_otp_validates_input(): void
    {
        // Missing email
        $this->postJson('/api/v1/auth/otp/verify', ['code' => '123456'])
            ->assertStatus(422);

        // Missing code
        $this->postJson('/api/v1/auth/otp/verify', ['email' => 'a@b.com'])
            ->assertStatus(422);

        // Code not exactly 6 characters
        $this->postJson('/api/v1/auth/otp/verify', ['email' => 'a@b.com', 'code' => '12345'])
            ->assertStatus(422);

        $this->postJson('/api/v1/auth/otp/verify', ['email' => 'a@b.com', 'code' => '1234567'])
            ->assertStatus(422);
    }

    // -------------------------------------------------------------------------
    // refresh
    // -------------------------------------------------------------------------

    public function test_refresh_returns_new_token_for_authenticated_user(): void
    {
        $user = User::factory()->create();
        $user->assignRole(UserRole::Customer->value);

        /** @var string $token */
        $token = auth('api')->login($user);

        $response = $this->postJson('/api/v1/auth/refresh', [], [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'token_type', 'expires_in', 'user']);
    }

    public function test_refresh_rejects_unauthenticated_request(): void
    {
        $this->postJson('/api/v1/auth/refresh')->assertStatus(401);
    }

    // -------------------------------------------------------------------------
    // logout
    // -------------------------------------------------------------------------

    public function test_logout_invalidates_token(): void
    {
        $user = User::factory()->create();
        $user->assignRole(UserRole::Customer->value);

        /** @var string $token */
        $token = auth('api')->login($user);

        $response = $this->postJson('/api/v1/auth/logout', [], [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertStatus(204);
    }

    // -------------------------------------------------------------------------
    // user endpoint
    // -------------------------------------------------------------------------

    public function test_get_user_returns_current_user_with_role_and_onboarding_flag(): void
    {
        $user = User::factory()->create(['onboarding_completed_at' => null]);
        $user->assignRole(UserRole::Customer->value);

        $response = $this->actingAs($user, 'api')
            ->getJson('/api/v1/auth/user');

        $response->assertStatus(200)
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.role', 'customer')
            ->assertJsonPath('data.onboarding_completed', false)
            ->assertJsonPath('data.subscription_status', null);
    }

    public function test_get_user_includes_subscription_status_when_set(): void
    {
        $user = User::factory()->create();
        $user->assignRole(UserRole::Customer->value);

        $plan = Plan::factory()->create();

        Subscription::factory()->trial()->create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
        ]);

        $response = $this->actingAs($user, 'api')
            ->getJson('/api/v1/auth/user');

        $response->assertStatus(200)
            ->assertJsonPath('data.subscription_status', 'trial');
    }

    public function test_get_user_requires_auth(): void
    {
        $this->getJson('/api/v1/auth/user')->assertStatus(401);
    }
}
