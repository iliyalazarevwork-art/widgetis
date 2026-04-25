<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Widget\SmsOtp;

enum Provider: string
{
    case TurboSms = 'turbosms';

    /**
     * @return array<string, mixed>
     */
    public function credentialsRules(): array
    {
        return match ($this) {
            self::TurboSms => [
                'credentials.token' => ['required', 'string', 'min:10'],
            ],
        };
    }
}
