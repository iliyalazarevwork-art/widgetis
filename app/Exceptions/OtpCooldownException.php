<?php

declare(strict_types=1);

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\HttpException;

class OtpCooldownException extends HttpException
{
    public function __construct()
    {
        parent::__construct(429, 'Please wait before requesting a new code.');
    }
}
