<?php

declare(strict_types=1);

namespace App\SmartSearch\Exceptions;

use RuntimeException;

final class FeedAlreadySyncingException extends RuntimeException
{
    public static function forFeed(string $feedId, string $siteId, string $lang): self
    {
        return new self("Feed {$feedId} (site={$siteId}, lang={$lang}) is already syncing.");
    }
}
