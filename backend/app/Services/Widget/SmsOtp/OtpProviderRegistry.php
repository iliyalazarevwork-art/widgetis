<?php

declare(strict_types=1);

namespace App\Services\Widget\SmsOtp;

use App\Services\Widget\SmsOtp\Contracts\OtpProvider;
use App\Services\Widget\SmsOtp\Providers\TurboSmsProvider;

final class OtpProviderRegistry
{
    /**
     * @param array<string, mixed> $credentials
     */
    public function resolve(Provider $provider, array $credentials): OtpProvider
    {
        return match ($provider) {
            Provider::TurboSms => new TurboSmsProvider($credentials),
        };
    }
}
