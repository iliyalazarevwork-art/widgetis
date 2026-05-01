<?php

declare(strict_types=1);

namespace App\SmartSearch\Exceptions;

use RuntimeException;

final class FeedFetchException extends RuntimeException
{
    public static function http(int $status, string $url): self
    {
        return new self("HTTP {$status} received while fetching feed from: {$url}");
    }

    public static function network(string $url, \Throwable $prev): self
    {
        return new self("Network error while fetching feed from: {$url} — {$prev->getMessage()}", 0, $prev);
    }

    public static function tooLarge(string $url, int $bytes): self
    {
        $mb = (int) round($bytes / 1024 / 1024);

        return new self("Feed from {$url} exceeds size limit ({$mb} MB).");
    }
}
