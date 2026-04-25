<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Widget\SmsOtp;

enum OtpRequestStatus: string
{
    case Pending = 'pending';
    case Sent = 'sent';
    case Verified = 'verified';
    case Failed = 'failed';
    case Expired = 'expired';
}
