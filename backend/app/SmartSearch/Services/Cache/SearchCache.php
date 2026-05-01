<?php

declare(strict_types=1);

namespace App\SmartSearch\Services\Cache;

interface SearchCache
{
    /**
     * Retrieve a cached search result payload, or null on miss.
     *
     * @return array<string, mixed>|null
     */
    public function get(string $siteId, string $lang, ?string $category, string $queryHash, int $limit): ?array;

    /**
     * Store a search result payload.
     *
     * @param array<string, mixed> $payload
     */
    public function put(string $siteId, string $lang, ?string $category, string $queryHash, int $limit, array $payload, int $ttlSeconds): void;

    /**
     * Invalidate all cached results for a given site by bumping its version counter.
     */
    public function flushSite(string $siteId): void;

    /**
     * Retrieve the cached product feed payload for a site+lang, or null on miss.
     *
     * @return array<string, mixed>|null
     */
    public function getFeed(string $siteId, string $lang): ?array;

    /**
     * Store the product feed payload for a site+lang.
     *
     * @param array<string, mixed> $payload
     */
    public function putFeed(string $siteId, string $lang, array $payload, int $ttlSeconds): void;
}
