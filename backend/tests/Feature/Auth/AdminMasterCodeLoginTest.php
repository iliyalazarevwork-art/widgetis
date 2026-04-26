<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Core\Models\User;
use App\Enums\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Full HTTP login flow for the admin via the OTP master code (121212).
 *
 * In production the OTP dev bypass is intentionally allowed for the single
 * configured ADMIN_EMAIL — that is how the operator signs into the React
 * /admin SPA without waiting for an email round-trip. A regression in this
 * path silently locks the operator out of their own product, so guard the
 * happy path end-to-end through the actual HTTP endpoint.
 *
 * The negative half (master code MUST NOT work for any other email, even in
 * prod) lives in tests/Feature/Security/OtpDevBypassProdTest.php — keeping
 * the two intents in separate files so a failure name says exactly what
 * broke.
 */
class AdminMasterCodeLoginTest extends TestCase
{
    use RefreshDatabase;

    private const ADMIN_EMAIL = 'admin@widgetis.com';
    private const MASTER_CODE = '121212';

    protected function setUp(): void
    {
        parent::setUp();

        // Mirror the production env shape exactly — including APP_ENV — so
        // we exercise the same code path the real operator hits, not a
        // friendlier local one.
        $this->app['env'] = 'production';
        config([
            'app.env' => 'production',
            'app.otp_dev_bypass' => true,
            'app.otp_dev_code' => self::MASTER_CODE,
            'app.admin_email' => self::ADMIN_EMAIL,
        ]);
    }

    public function test_admin_can_log_in_via_master_code_in_production(): void
    {
        $admin = User::factory()->create([
            'email' => self::ADMIN_EMAIL,
            'email_verified_at' => now(),
        ]);
        $admin->assignRole(UserRole::Admin->value);

        $response = $this->postJson('/api/v1/auth/otp/verify', [
            'email' => self::ADMIN_EMAIL,
            'code' => self::MASTER_CODE,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('token_type', 'bearer')
            ->assertJsonPath('user.email', self::ADMIN_EMAIL)
            ->assertJsonPath('user.role', UserRole::Admin->value)
            ->assertJsonStructure(['token', 'token_type', 'expires_in', 'user' => ['id', 'email', 'role']]);

        // The token must actually authenticate against a protected admin
        // endpoint — otherwise we'd have a "valid-looking" payload that
        // doesn't open any door.
        $token = $response->json('token');
        $this->assertIsString($token);
        $this->assertNotEmpty($token);

        $this->withHeaders(['Authorization' => 'Bearer '.$token])
            ->getJson('/api/v1/admin/dashboard')
            ->assertOk();
    }

    public function test_master_code_login_works_with_case_mismatched_email(): void
    {
        // Operators type their email in whatever case their browser
        // autofilled it. The login form's email lookup must be tolerant.
        $admin = User::factory()->create([
            'email' => self::ADMIN_EMAIL,
            'email_verified_at' => now(),
        ]);
        $admin->assignRole(UserRole::Admin->value);

        $response = $this->postJson('/api/v1/auth/otp/verify', [
            'email' => 'Admin@Widgetis.COM',
            'code' => self::MASTER_CODE,
        ]);

        $response->assertOk();
    }
}
