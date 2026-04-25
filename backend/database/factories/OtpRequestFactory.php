<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\OtpRequest;
use App\Models\Site;
use App\Services\Widget\SmsOtp\Channel;
use App\Services\Widget\SmsOtp\OtpRequestStatus;
use App\Services\Widget\SmsOtp\Provider;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<OtpRequest>
 */
class OtpRequestFactory extends Factory
{
    protected $model = OtpRequest::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'site_id' => Site::factory(),
            'request_id' => (string) Str::uuid(),
            'phone' => '+380501234567',
            'code_hash' => Hash::make('123456'),
            'provider' => Provider::TurboSms,
            'channel' => Channel::Sms,
            'status' => OtpRequestStatus::Sent,
            'attempts' => 0,
            'ip' => '127.0.0.1',
            'expires_at' => now()->addMinutes(5),
        ];
    }

    public function pending(): static
    {
        return $this->state(['status' => OtpRequestStatus::Pending]);
    }

    public function expired(): static
    {
        return $this->state([
            'status' => OtpRequestStatus::Sent,
            'expires_at' => now()->subMinutes(10),
        ]);
    }

    public function verified(): static
    {
        return $this->state([
            'status' => OtpRequestStatus::Verified,
            'verified_at' => now(),
        ]);
    }

    public function maxAttempts(): static
    {
        return $this->state(['attempts' => 5]);
    }

    public function withCode(string $code): static
    {
        return $this->state(['code_hash' => Hash::make($code)]);
    }
}
