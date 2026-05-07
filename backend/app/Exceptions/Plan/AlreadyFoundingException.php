<?php

declare(strict_types=1);

namespace App\Exceptions\Plan;

final class AlreadyFoundingException extends \DomainException
{
    public static function create(): self
    {
        return new self('User has already claimed a founding slot.');
    }
}
