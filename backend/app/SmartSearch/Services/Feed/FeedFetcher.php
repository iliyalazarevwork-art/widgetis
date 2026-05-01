<?php

declare(strict_types=1);

namespace App\SmartSearch\Services\Feed;

interface FeedFetcher
{
    /**
     * Download the feed at $url to a local temp file.
     * Returns the absolute path of the downloaded file.
     * The caller is responsible for unlinking the file after use.
     *
     * @throws \App\SmartSearch\Exceptions\FeedFetchException
     */
    public function fetch(string $url): string;
}
