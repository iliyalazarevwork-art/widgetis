<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use App\Core\Models\User;
use App\Core\Services\Auth\OtpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * Regression against the auth-bypass we shipped to production once:
 * OTP_DEV_BYPASS=true + OTP_DEV_CODE=121212 allowed anyone to log in as
 * any user by submitting the master code.
 *
 * Two-layer defence:
 *   1. OtpService::isDevBypass() short-circuits to false when
 *      APP_ENV=production, ignoring the env flag entirely.
 *   2. The actual HTTP verify endpoint must still reject `121212` when
 *      no real OTP was issued for the email.
 */
class OtpDevBypassProdTest extends TestCase
{
    use RefreshDatabase;

    public function test_otp_service_ignores_dev_bypass_in_production_even_when_flag_is_set(): void
    {
        // Force production env AND turn bypass on. The guard in OtpService
        // must refuse to honour the master code anyway.
        $this->app['env'] = 'production';
        config([
            'app.env' => 'production',
            'app.otp_dev_bypass' => true,
            'app.otp_dev_code' => '121212',
        ]);

        /** @var OtpService $service */
        $service = app(OtpService::class);

        // No real code seeded → only the dev bypass could have let this through.
        $result = $service->verify('attacker@example.com', '121212');

        $this->assertFalse($result, 'OTP dev bypass must be inert in production');
    }

    public function test_otp_verify_endpoint_rejects_master_code_in_production(): void
    {
        $this->app['env'] = 'production';
        config([
            'app.env' => 'production',
            'app.otp_dev_bypass' => true,
            'app.otp_dev_code' => '121212',
        ]);

        $response = $this->postJson('/api/v1/auth/otp/verify', [
            'email' => 'victim@example.com',
            'code' => '121212',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('error.code', 'INVALID_OTP');

        // And no user row was silently created as a side effect.
        $this->assertSame(0, User::where('email', 'victim@example.com')->count());
    }

    public function test_dev_bypass_still_works_when_explicitly_enabled_outside_production(): void
    {
        // Sanity check: local dev convenience is preserved.
        $this->app['env'] = 'local';
        config([
            'app.env' => 'local',
            'app.otp_dev_bypass' => true,
            'app.otp_dev_code' => '121212',
        ]);

        /** @var OtpService $service */
        $service = app(OtpService::class);

        Cache::put('otp:attempts:dev@example.com', 0, 600);

        $this->assertTrue($service->verify('dev@example.com', '121212'));
    }
}
