<?php

declare(strict_types=1);

namespace App\SmartSearch\Exceptions;

use RuntimeException;

final class FeedParseException extends RuntimeException
{
    public static function malformedXml(string $detail): self
    {
        return new self("Malformed YML/XML feed: {$detail}");
    }
}
