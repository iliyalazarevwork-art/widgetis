<?php

declare(strict_types=1);

namespace App\SmartSearch\Exceptions;

use RuntimeException;

final class InvalidSearchQueryException extends RuntimeException
{
    public static function tooShort(string $query): self
    {
        return new self("Search query is too short (min 2 chars): \"{$query}\"");
    }

    public static function tooLong(string $query): self
    {
        $len = mb_strlen($query);

        return new self("Search query is too long ({$len} chars, max 90): \"{$query}\"");
    }
}
