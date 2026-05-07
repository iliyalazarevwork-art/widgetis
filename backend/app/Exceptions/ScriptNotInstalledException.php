<?php

declare(strict_types=1);

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\HttpException;

class ScriptNotInstalledException extends HttpException
{
    public function __construct(string $message = 'Script is not installed on this site.')
    {
        parent::__construct(403, $message);
    }
}
