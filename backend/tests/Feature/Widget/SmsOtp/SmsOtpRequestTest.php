<?php

declare(strict_types=1);

namespace Tests\Feature\Widget\SmsOtp;

use App\WidgetRuntime\Models\OtpProviderConfig;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Services\Widget\SmsOtp\WidgetSessionTokenService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class SmsOtpRequestTest extends TestCase
{
    use RefreshDatabase;

    private function makeWidgetToken(Site $site): string
    {
        /** @var WidgetSessionTokenService $service */
        $service = app(WidgetSessionTokenService::class);

        return $service->issue($site)['token'];
    }

    private function fakeTurboSmsSuccess(): void
    {
        Http::fake([
            'api.turbosms.ua/*' => Http::response([
                'response_code' => 0,
                'response_status' => 'OK',
                'response_result' => [['message_id' => 'msg-123']],
            ], 200),
        ]);
    }

    public function test_requests_otp_successfully(): void
    {
        $this->fakeTurboSmsSuccess();

        $site = Site::factory()->create();
        OtpProviderConfig::factory()->for($site)->create();
        $token = $this->makeWidgetToken($site);

        $response = $this->postJson('/api/v1/widgets/sms-otp/request', [
            'phone' => '+380501234567',
            'locale' => 'uk',
        ], ['Authorization' => "Bearer {$token}"]);

        $response->assertOk()
            ->assertJsonStructure(['requestId', 'expiresAt']);
    }

    public function test_returns_401_without_jwt(): void
    {
        $response = $this->postJson('/api/v1/widgets/sms-otp/request', [
            'phone' => '+380501234567',
        ]);

        $response->assertUnauthorized();
    }

    public function test_returns_401_with_expired_jwt(): void
    {
        // Build an expired token manually
        $site = Site::factory()->create();
        $secret = config('jwt.secret');

        $payload = [
            'iss' => config('app.url'),
            'aud' => 'widget',
            'sub' => (string) $site->id,
            'iat' => time() - 7200,
            'exp' => time() - 3600,
            'jti' => 'test-jti',
        ];

        $token = \Firebase\JWT\JWT::encode($payload, (string) $secret, 'HS256');

        $response = $this->postJson('/api/v1/widgets/sms-otp/request', [
            'phone' => '+380501234567',
        ], ['Authorization' => "Bearer {$token}"]);

        $response->assertUnauthorized();
    }

    public function test_returns_503_when_no_active_provider(): void
    {
        $site = Site::factory()->create();
        // No provider config created
        $token = $this->makeWidgetToken($site);

        $response = $this->postJson('/api/v1/widgets/sms-otp/request', [
            'phone' => '+380501234567',
        ], ['Authorization' => "Bearer {$token}"]);

        $response->assertStatus(503);
    }

    public function test_returns_429_on_phone_rate_limit(): void
    {
        $this->fakeTurboSmsSuccess();

        $site = Site::factory()->create();
        OtpProviderConfig::factory()->for($site)->create();
        $token = $this->makeWidgetToken($site);

        // Pre-exhaust the phone rate limit
        RateLimiter::hit('otp:phone:+380501234567', 3600);
        RateLimiter::hit('otp:phone:+380501234567', 3600);
        RateLimiter::hit('otp:phone:+380501234567', 3600);

        $response = $this->postJson('/api/v1/widgets/sms-otp/request', [
            'phone' => '+380501234567',
        ], ['Authorization' => "Bearer {$token}"]);

        $response->assertStatus(429);
    }

    public function test_returns_422_for_invalid_phone_format(): void
    {
        $site = Site::factory()->create();
        OtpProviderConfig::factory()->for($site)->create();
        $token = $this->makeWidgetToken($site);

        $response = $this->postJson('/api/v1/widgets/sms-otp/request', [
            'phone' => 'not-a-phone',
        ], ['Authorization' => "Bearer {$token}"]);

        $response->assertUnprocessable();
    }
}
