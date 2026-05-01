<?php

declare(strict_types=1);

namespace App\SmartSearch\Services\Feed;

use App\SmartSearch\Enums\FeedSyncStatus;
use App\SmartSearch\Exceptions\FeedAlreadySyncingException;
use App\SmartSearch\Models\SiteSearchFeed;
use App\SmartSearch\Services\Cache\SearchCache;
use Illuminate\Support\Facades\DB;
use Psr\Log\LoggerInterface;

final class FeedSynchronizer
{
    private const STALE_SYNC_MINUTES = 30;
    private const BATCH_SIZE = 500;

    public function __construct(
        private readonly FeedFetcher $fetcher,
        private readonly FeedParser $parser,
        private readonly LoggerInterface $logger,
        private readonly SearchCache $searchCache,
    ) {
    }

    public function sync(SiteSearchFeed $feed): void
    {
        $this->guardAgainstConcurrentSync($feed);

        $syncStartedAt = now();

        $feed->update([
            'status'           => FeedSyncStatus::Syncing,
            'sync_started_at'  => $syncStartedAt,
            'error'            => null,
        ]);

        $tmpPath = null;

        try {
            $tmpPath = $this->fetcher->fetch($feed->feed_url);

            $siteId = (string) $feed->site_id;
            $lang = (string) $feed->lang;

            // In-memory category map for resolving paths: [externalId => ['name', 'parent_id']]
            /** @var array<string, array{name: string, parent_id: string|null}> $categoryMap */
            $categoryMap = [];

            // Batch accumulators
            $categoryBatch = [];
            $offerBatch = [];
            $seenExternalIds = [];
            $itemsCount = 0;

            foreach ($this->parser->parse($tmpPath) as $record) {
                if ($record['type'] === 'category') {
                    $data = $record['data'];
                    $categoryMap[$data['external_id']] = [
                        'name'      => $data['name'],
                        'parent_id' => $data['parent_id'],
                    ];
                    $categoryBatch[] = [
                        'id'          => \Illuminate\Support\Str::uuid7()->toString(),
                        'site_id'     => $siteId,
                        'lang'        => $lang,
                        'external_id' => $data['external_id'],
                        'parent_id'   => $data['parent_id'],
                        'name'        => $data['name'],
                        'url'         => null,
                        'updated_at'  => now(),
                        'created_at'  => now(),
                    ];
                    continue;
                }

                if ($record['type'] === 'offer') {
                    $data = $record['data'];
                    $catId = (string) ($data['category_id'] ?? '');

                    [$categoryName, $categoryPath] = $this->resolveCategoryInfo($catId, $categoryMap);

                    $searchText = mb_strtolower(
                        trim(implode(' ', array_filter([
                            $data['name'],
                            $data['vendor'] ?? '',
                            $categoryPath,
                            implode(' ', (array) ($data['params'] ?? [])),
                        ])))
                    );

                    $externalId = (string) $data['external_id'];
                    $seenExternalIds[] = $externalId;
                    $itemsCount++;

                    $offerBatch[] = [
                        'id'            => \Illuminate\Support\Str::uuid7()->toString(),
                        'site_id'       => $siteId,
                        'lang'          => $lang,
                        'external_id'   => $externalId,
                        'name'          => mb_substr((string) $data['name'], 0, 1000),
                        'vendor'        => $data['vendor'] !== '' ? mb_substr((string) $data['vendor'], 0, 255) : null,
                        'category_id'   => $catId !== '' ? $catId : null,
                        'category_path' => mb_substr($categoryPath, 0, 1000),
                        'category_name' => mb_substr($categoryName, 0, 1000),
                        'picture'       => mb_substr((string) ($data['picture'] ?? ''), 0, 2000) ?: null,
                        'url'           => mb_substr((string) $data['url'], 0, 2000),
                        'price'         => $data['price'],
                        'oldprice'      => (int) ($data['oldprice'] ?? 0),
                        'currency'      => mb_substr((string) ($data['currency'] ?? 'UAH'), 0, 8),
                        'available'     => $data['available'],
                        'search_text'   => $searchText,
                        'popularity'    => 0,
                        'updated_at'    => now(),
                        'created_at'    => now(),
                    ];

                    if (count($offerBatch) >= self::BATCH_SIZE) {
                        $this->flushCategories($categoryBatch);
                        $categoryBatch = [];
                        $this->flushOffers($offerBatch);
                        $offerBatch = [];
                    }
                }
            }

            // Flush remaining categories and offers
            if ($categoryBatch !== []) {
                $this->flushCategories($categoryBatch);
            }

            if ($offerBatch !== []) {
                $this->flushOffers($offerBatch);
            }

            // Delete products no longer in the feed (any row whose updated_at
            // is older than this sync's start time was not touched by upserts).
            $this->deleteStaleProducts($siteId, $lang, $syncStartedAt);

            // Recompute products_count per category
            $this->recomputeCategoryCounts($siteId, $lang);

            $feed->update([
                'status'         => FeedSyncStatus::Success,
                'last_synced_at' => now(),
                'items_count'    => $itemsCount,
                'error'          => null,
            ]);

            $this->searchCache->flushSite($siteId);

            $this->logger->info('SmartSearch feed synced', [
                'feed_id'  => $feed->id,
                'site_id'  => $siteId,
                'lang'     => $lang,
                'items'    => $itemsCount,
            ]);
        } catch (\Throwable $e) {
            $feed->update([
                'status' => FeedSyncStatus::Failed,
                'error'  => mb_substr($e->getMessage(), 0, 1000),
            ]);

            $this->logger->error('SmartSearch feed sync failed', [
                'feed_id' => $feed->id,
                'error'   => $e->getMessage(),
            ]);

            throw $e;
        } finally {
            if ($tmpPath !== null && file_exists($tmpPath)) {
                @unlink($tmpPath);
            }
        }
    }

    private function guardAgainstConcurrentSync(SiteSearchFeed $feed): void
    {
        if ($feed->status !== FeedSyncStatus::Syncing) {
            return;
        }

        $startedAt = $feed->sync_started_at;

        if ($startedAt !== null && $startedAt->diffInMinutes(now()) < self::STALE_SYNC_MINUTES) {
            throw FeedAlreadySyncingException::forFeed(
                (string) $feed->id,
                (string) $feed->site_id,
                (string) $feed->lang,
            );
        }

        // Stale syncing row — mark as failed and proceed
        $feed->update([
            'status' => FeedSyncStatus::Failed,
            'error'  => 'Previous sync timed out and was reset.',
        ]);
    }

    /**
     * @param list<array<string, mixed>> $batch
     */
    private function flushCategories(array $batch): void
    {
        if ($batch === []) {
            return;
        }

        DB::connection('pgsql_runtime')
            ->table('wgt_smart_search_categories')
            ->upsert(
                $batch,
                ['site_id', 'lang', 'external_id'],
                ['parent_id', 'name', 'updated_at'],
            );
    }

    /**
     * @param list<array<string, mixed>> $batch
     */
    private function flushOffers(array $batch): void
    {
        if ($batch === []) {
            return;
        }

        DB::connection('pgsql_runtime')
            ->table('wgt_smart_search_products')
            ->upsert(
                $batch,
                ['site_id', 'lang', 'external_id'],
                [
                    'name', 'vendor', 'category_id', 'category_path', 'category_name',
                    'picture', 'url', 'price', 'oldprice', 'currency', 'available',
                    'search_text', 'updated_at',
                ],
            );
    }

    /**
     * Delete products in this site+lang whose `updated_at` predates the current
     * sync's start time — i.e. rows that this run didn't touch (no longer in the
     * feed). One SQL, no chunking.
     */
    private function deleteStaleProducts(string $siteId, string $lang, \DateTimeInterface $syncStartedAt): void
    {
        DB::connection('pgsql_runtime')
            ->table('wgt_smart_search_products')
            ->where('site_id', $siteId)
            ->where('lang', $lang)
            ->where('updated_at', '<', $syncStartedAt)
            ->delete();
    }

    private function recomputeCategoryCounts(string $siteId, string $lang): void
    {
        DB::connection('pgsql_runtime')->statement('
            UPDATE wgt_smart_search_categories c
            SET products_count = sub.cnt
            FROM (
                SELECT category_id, COUNT(*) AS cnt
                FROM wgt_smart_search_products
                WHERE site_id = :site_id AND lang = :lang
                GROUP BY category_id
            ) sub
            WHERE c.site_id = :site_id2
              AND c.lang = :lang2
              AND c.external_id = sub.category_id
        ', [
            'site_id'  => $siteId,
            'lang'     => $lang,
            'site_id2' => $siteId,
            'lang2'    => $lang,
        ]);
    }

    /**
     * Walk the category map to build category_name and category_path.
     *
     * @param array<string, array{name: string, parent_id: string|null}> $categoryMap
     * @return array{string, string}  [categoryName, categoryPath]
     */
    private function resolveCategoryInfo(string $categoryId, array $categoryMap): array
    {
        // Real feeds reference categoryIds that aren't declared in <categories>.
        // Bucket those into a synthetic "Other" group so the response stays clean.
        if ($categoryId === '' || !isset($categoryMap[$categoryId])) {
            return ['Інше', 'Інше'];
        }

        $categoryName = $categoryMap[$categoryId]['name'];

        // Walk up the tree to build the full path
        $path = [];
        $currentId = $categoryId;
        $visited = [];

        while ($currentId !== '' && isset($categoryMap[$currentId]) && !isset($visited[$currentId])) {
            $visited[$currentId] = true;
            array_unshift($path, $categoryMap[$currentId]['name']);
            $currentId = (string) ($categoryMap[$currentId]['parent_id'] ?? '');
        }

        $categoryPath = implode(' › ', $path);

        return [$categoryName, $categoryPath];
    }
}
