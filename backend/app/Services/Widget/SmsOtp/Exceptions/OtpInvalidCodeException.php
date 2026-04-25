<?php

declare(strict_types=1);

namespace App\Services\Widget\SmsOtp\Exceptions;

use DomainException;

final class OtpInvalidCodeException extends DomainException
{
}
