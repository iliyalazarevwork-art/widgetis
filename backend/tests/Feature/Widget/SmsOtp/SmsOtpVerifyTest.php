<?php

declare(strict_types=1);

namespace Tests\Feature\Widget\SmsOtp;

use App\WidgetRuntime\Models\OtpRequest;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Services\Widget\SmsOtp\WidgetSessionTokenService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SmsOtpVerifyTest extends TestCase
{
    use RefreshDatabase;

    private function makeWidgetToken(Site $site): string
    {
        /** @var WidgetSessionTokenService $service */
        $service = app(WidgetSessionTokenService::class);

        return $service->issue($site)['token'];
    }

    public function test_verifies_correct_code_successfully(): void
    {
        $site = Site::factory()->create();
        $token = $this->makeWidgetToken($site);

        $otpRequest = OtpRequest::factory()
            ->for($site)
            ->withCode('654321')
            ->create();

        $response = $this->postJson('/api/v1/widgets/sms-otp/verify', [
            'requestId' => $otpRequest->request_id,
            'code' => '654321',
        ], ['Authorization' => "Bearer {$token}"]);

        $response->assertOk()
            ->assertJson(['verified' => true]);
    }

    public function test_returns_422_for_wrong_code(): void
    {
        $site = Site::factory()->create();
        $token = $this->makeWidgetToken($site);

        $otpRequest = OtpRequest::factory()
            ->for($site)
            ->withCode('654321')
            ->create();

        $response = $this->postJson('/api/v1/widgets/sms-otp/verify', [
            'requestId' => $otpRequest->request_id,
            'code' => '000000',
        ], ['Authorization' => "Bearer {$token}"]);

        $response->assertUnprocessable();
    }

    public function test_returns_422_for_expired_otp(): void
    {
        $site = Site::factory()->create();
        $token = $this->makeWidgetToken($site);

        $otpRequest = OtpRequest::factory()
            ->for($site)
            ->expired()
            ->withCode('654321')
            ->create();

        $response = $this->postJson('/api/v1/widgets/sms-otp/verify', [
            'requestId' => $otpRequest->request_id,
            'code' => '654321',
        ], ['Authorization' => "Bearer {$token}"]);

        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'OTP_EXPIRED');
    }

    public function test_returns_429_when_max_attempts_exceeded(): void
    {
        $site = Site::factory()->create();
        $token = $this->makeWidgetToken($site);

        $otpRequest = OtpRequest::factory()
            ->for($site)
            ->maxAttempts()
            ->withCode('654321')
            ->create();

        $response = $this->postJson('/api/v1/widgets/sms-otp/verify', [
            'requestId' => $otpRequest->request_id,
            'code' => '654321',
        ], ['Authorization' => "Bearer {$token}"]);

        $response->assertStatus(429)
            ->assertJsonPath('error.code', 'TOO_MANY_ATTEMPTS');
    }

    public function test_returns_422_for_unknown_request_id(): void
    {
        $site = Site::factory()->create();
        $token = $this->makeWidgetToken($site);

        $response = $this->postJson('/api/v1/widgets/sms-otp/verify', [
            'requestId' => '00000000-0000-0000-0000-000000000000',
            'code' => '123456',
        ], ['Authorization' => "Bearer {$token}"]);

        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'INVALID_CODE');
    }

    public function test_returns_422_when_code_is_not_6_digits(): void
    {
        $site = Site::factory()->create();
        $token = $this->makeWidgetToken($site);

        $response = $this->postJson('/api/v1/widgets/sms-otp/verify', [
            'requestId' => '00000000-0000-0000-0000-000000000000',
            'code' => 'abc123',
        ], ['Authorization' => "Bearer {$token}"]);

        $response->assertUnprocessable();
    }
}
