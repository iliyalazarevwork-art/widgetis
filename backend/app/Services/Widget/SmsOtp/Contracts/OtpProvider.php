<?php

declare(strict_types=1);

namespace App\Services\Widget\SmsOtp\Contracts;

use App\Services\Widget\SmsOtp\Data\SendOtpCommand;
use App\Services\Widget\SmsOtp\Data\SendOtpResult;

interface OtpProvider
{
    public function send(SendOtpCommand $command): SendOtpResult;
}
