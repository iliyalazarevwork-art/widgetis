<?php

declare(strict_types=1);

namespace App\Exceptions\Plan;

final class FoundingSlotsExhaustedException extends \DomainException
{
    public static function create(): self
    {
        return new self('All founding slots have been claimed.');
    }
}
