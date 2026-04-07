<?php

declare(strict_types=1);

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\HttpException;

class TooManyOtpAttemptsException extends HttpException
{
    public function __construct()
    {
        parent::__construct(429, 'Too many attempts. Please request a new code.');
    }
}
