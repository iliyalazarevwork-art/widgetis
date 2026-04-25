<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Widget\SmsOtp\Contracts;

use App\WidgetRuntime\Services\Widget\SmsOtp\Data\SendOtpCommand;
use App\WidgetRuntime\Services\Widget\SmsOtp\Data\SendOtpResult;

interface OtpProvider
{
    public function send(SendOtpCommand $command): SendOtpResult;
}
