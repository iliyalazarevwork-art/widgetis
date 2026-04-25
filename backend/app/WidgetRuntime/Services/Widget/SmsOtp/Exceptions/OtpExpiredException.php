<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Widget\SmsOtp\Exceptions;

use DomainException;

final class OtpExpiredException extends DomainException
{
}
