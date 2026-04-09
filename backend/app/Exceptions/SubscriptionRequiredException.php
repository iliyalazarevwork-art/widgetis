<?php

declare(strict_types=1);

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\HttpException;

class SubscriptionRequiredException extends HttpException
{
    public function __construct(string $message = 'An active subscription is required.')
    {
        parent::__construct(403, $message);
    }
}
