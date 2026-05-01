<?php

declare(strict_types=1);

namespace App\SmartSearch\Services\Cache;

use Illuminate\Support\Facades\Cache;

final class RedisSearchCache implements SearchCache
{
    private const VERSION_KEY_PREFIX = 'srch:ver:';
    private const CACHE_STORE = 'redis';

    /**
     * @return array<string, mixed>|null
     */
    public function get(string $siteId, string $lang, ?string $category, string $queryHash, int $limit): ?array
    {
        $key = $this->buildKey($siteId, $lang, $category, $queryHash, $limit);

        /** @var array<string, mixed>|null $value */
        $value = Cache::store(self::CACHE_STORE)->get($key);

        return $value;
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function put(string $siteId, string $lang, ?string $category, string $queryHash, int $limit, array $payload, int $ttlSeconds): void
    {
        $key = $this->buildKey($siteId, $lang, $category, $queryHash, $limit);

        Cache::store(self::CACHE_STORE)->put($key, $payload, $ttlSeconds);
    }

    public function flushSite(string $siteId): void
    {
        $versionKey = self::VERSION_KEY_PREFIX . $siteId;

        Cache::store(self::CACHE_STORE)->increment($versionKey);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getFeed(string $siteId, string $lang): ?array
    {
        $key = $this->buildFeedKey($siteId, $lang);

        /** @var array<string, mixed>|null $value */
        $value = Cache::store(self::CACHE_STORE)->get($key);

        return $value;
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function putFeed(string $siteId, string $lang, array $payload, int $ttlSeconds): void
    {
        $key = $this->buildFeedKey($siteId, $lang);

        Cache::store(self::CACHE_STORE)->put($key, $payload, $ttlSeconds);
    }

    private function buildKey(string $siteId, string $lang, ?string $category, string $queryHash, int $limit): string
    {
        $version = (int) Cache::store(self::CACHE_STORE)->get(self::VERSION_KEY_PREFIX . $siteId, 0);
        $cat = $category !== null ? $category : 'none';

        return "srch:{$siteId}:{$lang}:{$cat}:{$queryHash}:{$limit}:v{$version}";
    }

    private function buildFeedKey(string $siteId, string $lang): string
    {
        $version = (int) Cache::store(self::CACHE_STORE)->get(self::VERSION_KEY_PREFIX . $siteId, 0);

        return "srch:feed:{$siteId}:{$lang}:v{$version}";
    }
}
