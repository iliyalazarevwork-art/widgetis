<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Widget\SmsOtp;

enum Channel: string
{
    case Sms = 'sms';
    case Viber = 'viber';
    case Email = 'email';
}
