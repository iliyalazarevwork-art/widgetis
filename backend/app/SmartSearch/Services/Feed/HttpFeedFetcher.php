<?php

declare(strict_types=1);

namespace App\SmartSearch\Services\Feed;

use App\SmartSearch\Exceptions\FeedFetchException;
use Illuminate\Support\Facades\Http;

final class HttpFeedFetcher implements FeedFetcher
{
    private const MAX_BYTES = 200 * 1024 * 1024; // 200 MB
    private const TIMEOUT_SECONDS = 120;

    public function fetch(string $url): string
    {
        $tmpPath = tempnam(sys_get_temp_dir(), 'smart_search_feed_');

        if ($tmpPath === false) {
            throw new \RuntimeException('Failed to create temporary file for feed download.');
        }

        try {
            $response = Http::sink($tmpPath)
                ->timeout(self::TIMEOUT_SECONDS)
                ->get($url);

            if ($response->failed()) {
                @unlink($tmpPath);
                throw FeedFetchException::http($response->status(), $url);
            }

            $contentType = strtolower((string) $response->header('Content-Type'));
            if ($contentType !== '' && !str_contains($contentType, 'xml') && !str_contains($contentType, 'text')) {
                @unlink($tmpPath);
                throw FeedFetchException::http($response->status(), $url);
            }

            $fileSize = @filesize($tmpPath);

            if ($fileSize !== false && $fileSize > self::MAX_BYTES) {
                @unlink($tmpPath);
                throw FeedFetchException::tooLarge($url, $fileSize);
            }
        } catch (FeedFetchException $e) {
            throw $e;
        } catch (\Throwable $e) {
            @unlink($tmpPath);
            throw FeedFetchException::network($url, $e);
        }

        return $tmpPath;
    }
}
