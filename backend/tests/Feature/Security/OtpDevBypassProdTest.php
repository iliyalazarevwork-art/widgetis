<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use App\Core\Models\User;
use App\Core\Services\Auth\OtpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * The OTP dev bypass (OTP_DEV_BYPASS=true + OTP_DEV_CODE=121212) is allowed
 * in production but ONLY for the configured admin email. For every other
 * address the master code must be rejected — that's the regression we shipped
 * once and never want to ship again (full auth-bypass for any account).
 *
 * Outside production the bypass is wide open by design (local dev / CI).
 */
class OtpDevBypassProdTest extends TestCase
{
    use RefreshDatabase;

    public function test_master_code_is_rejected_for_non_admin_email_in_production(): void
    {
        $this->app['env'] = 'production';
        config([
            'app.env' => 'production',
            'app.otp_dev_bypass' => true,
            'app.otp_dev_code' => '121212',
            'app.admin_email' => 'admin@widgetis.com',
        ]);

        /** @var OtpService $service */
        $service = app(OtpService::class);

        // Random victim — not the admin. No real code was issued. The only
        // way this could pass is via the bypass — and the bypass must refuse.
        $this->assertFalse(
            $service->verify('attacker@example.com', '121212'),
            'OTP dev bypass must reject non-admin emails in production',
        );
    }

    public function test_master_code_works_for_admin_email_in_production(): void
    {
        $this->app['env'] = 'production';
        config([
            'app.env' => 'production',
            'app.otp_dev_bypass' => true,
            'app.otp_dev_code' => '121212',
            'app.admin_email' => 'admin@widgetis.com',
        ]);

        /** @var OtpService $service */
        $service = app(OtpService::class);

        Cache::put('otp:attempts:admin@widgetis.com', 0, 600);

        $this->assertTrue(
            $service->verify('admin@widgetis.com', '121212'),
            'Admin must still be able to log in via master code',
        );
    }

    public function test_master_code_email_match_is_case_insensitive(): void
    {
        $this->app['env'] = 'production';
        config([
            'app.env' => 'production',
            'app.otp_dev_bypass' => true,
            'app.otp_dev_code' => '121212',
            'app.admin_email' => 'Admin@Widgetis.com',
        ]);

        /** @var OtpService $service */
        $service = app(OtpService::class);

        Cache::put('otp:attempts:admin@widgetis.com', 0, 600);

        $this->assertTrue($service->verify('admin@widgetis.com', '121212'));
    }

    public function test_master_code_blocked_when_admin_email_unset_in_production(): void
    {
        $this->app['env'] = 'production';
        config([
            'app.env' => 'production',
            'app.otp_dev_bypass' => true,
            'app.otp_dev_code' => '121212',
            'app.admin_email' => '',
        ]);

        /** @var OtpService $service */
        $service = app(OtpService::class);

        $this->assertFalse(
            $service->verify('anything@example.com', '121212'),
            'Without ADMIN_EMAIL the prod bypass must refuse every email',
        );
    }

    public function test_otp_verify_endpoint_rejects_master_code_for_random_email_in_production(): void
    {
        $this->app['env'] = 'production';
        config([
            'app.env' => 'production',
            'app.otp_dev_bypass' => true,
            'app.otp_dev_code' => '121212',
            'app.admin_email' => 'admin@widgetis.com',
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

    public function test_dev_bypass_still_works_for_any_email_outside_production(): void
    {
        $this->app['env'] = 'local';
        config([
            'app.env' => 'local',
            'app.otp_dev_bypass' => true,
            'app.otp_dev_code' => '121212',
            'app.admin_email' => 'admin@widgetis.com',
        ]);

        /** @var OtpService $service */
        $service = app(OtpService::class);

        Cache::put('otp:attempts:dev@example.com', 0, 600);

        $this->assertTrue(
            $service->verify('dev@example.com', '121212'),
            'Local dev convenience is preserved — bypass works for any email outside prod',
        );
    }
}
