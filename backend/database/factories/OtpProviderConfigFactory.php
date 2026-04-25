<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\OtpProviderConfig;
use App\Models\Site;
use App\Services\Widget\SmsOtp\Channel;
use App\Services\Widget\SmsOtp\Provider;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OtpProviderConfig>
 */
class OtpProviderConfigFactory extends Factory
{
    protected $model = OtpProviderConfig::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'site_id' => Site::factory(),
            'provider' => Provider::TurboSms,
            'channel' => Channel::Sms,
            'credentials' => ['token' => 'test-turbosms-token-1234567890'],
            'sender_name' => 'Widgetis',
            'templates' => [
                'uk' => 'Ваш код: {code}',
                'en' => 'Your code: {code}',
            ],
            'is_active' => true,
            'priority' => 0,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
