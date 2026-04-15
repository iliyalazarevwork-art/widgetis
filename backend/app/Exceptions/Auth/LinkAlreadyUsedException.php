<?php

declare(strict_types=1);

namespace App\Exceptions\Auth;

use Symfony\Component\HttpKernel\Exception\HttpException;

class LinkAlreadyUsedException extends HttpException
{
    public function __construct()
    {
        parent::__construct(422, 'Magic link has already been used.');
    }
}
