<?php

declare(strict_types=1);

namespace App\SmartSearch\Services\Search;

use App\SmartSearch\DataTransferObjects\SearchQueryDto;
use App\SmartSearch\DataTransferObjects\SearchResponseDto;
use App\SmartSearch\Services\Cache\SearchCache;
use Psr\Log\LoggerInterface;

final class SearchAction
{
    private const CACHE_TTL_SECONDS = 300;

    public function __construct(
        private readonly SearchCache $cache,
        private readonly ProductSearchEngine $engine,
        private readonly LoggerInterface $logger,
    ) {
    }

    public function __invoke(SearchQueryDto $query): SearchResponseDto
    {
        $hash = sha1(mb_strtolower(trim($query->query)));

        $cached = $this->cache->get(
            $query->siteId,
            $query->lang->value,
            $query->category,
            $hash,
            $query->limit,
        );

        if ($cached !== null) {
            return SearchResponseDto::fromCacheArray($cached);
        }

        $start = microtime(true);
        $response = $this->engine->search($query);
        $elapsedMs = (microtime(true) - $start) * 1000;

        $this->logger->info('search', [
            'site'  => $query->siteId,
            'q'     => $query->query,
            'ms'    => round($elapsedMs, 2),
            'total' => $response->total,
        ]);

        $this->cache->put(
            $query->siteId,
            $query->lang->value,
            $query->category,
            $hash,
            $query->limit,
            $response->toArray(),
            self::CACHE_TTL_SECONDS,
        );

        return $response;
    }
}
