<?php

declare(strict_types=1);

namespace App\Exceptions\Auth;

use Symfony\Component\HttpKernel\Exception\HttpException;

class LinkExpiredException extends HttpException
{
    public function __construct()
    {
        parent::__construct(422, 'Magic link has expired or is invalid.');
    }
}
