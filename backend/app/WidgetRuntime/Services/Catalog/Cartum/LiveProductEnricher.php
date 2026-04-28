<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Catalog\Cartum;

use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Services\Catalog\Cartum\DTO\LiveProductView;
use App\WidgetRuntime\Services\Catalog\Cartum\Exceptions\CartumException;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Psr\Log\LoggerInterface;

/**
 * Enriches a list of CatalogProduct records with fresh Cartum live data.
 *
 * Strategy:
 *  1. For each product check the per-(site, sku) cache entry first.
 *  2. Batch-fetch uncached SKUs from Cartum in one request.
 *  3. Write fresh results back into cache (5-minute TTL).
 *  4. On any Cartum failure, fall back silently to DB snapshot values.
 *
 * Input order is always preserved in the returned list.
 */
final readonly class LiveProductEnricher
{
    public function __construct(
        private CartumClient $client,
        private CacheRepository $cache,
        private LoggerInterface $logger,
    ) {
    }

    /**
     * @param  list<CatalogProduct>  $products
     * @return list<LiveProductView>
     */
    public function enrich(Site $site, array $products): array
    {
        if ($products === []) {
            return [];
        }

        $ttl = (int) config('recommender.cache.cartum_ttl_seconds', 300);

        // ---- 1) Separate cache hits from misses --------------------------------
        /** @var array<string, array<string, mixed>> $liveData keyed by sku */
        $liveData = [];
        /** @var list<string> $missSkus */
        $missSkus = [];

        foreach ($products as $product) {
            $sku      = (string) $product->sku;
            $cacheKey = $this->cacheKey($site->id, $sku);
            /** @var array<string, mixed>|null $cached */
            $cached   = $this->cache->get($cacheKey);

            if ($cached !== null) {
                $liveData[$sku] = $cached;
            } else {
                $missSkus[] = $sku;
            }
        }

        // ---- 2) Batch-fetch misses from Cartum ---------------------------------
        if ($missSkus !== []) {
            try {
                $fresh = $this->client->exportProducts($site, $missSkus);

                // ---- 3) Write fresh entries to cache ---------------------------
                foreach ($fresh as $sku => $item) {
                    $this->cache->put($this->cacheKey($site->id, $sku), $item, $ttl);
                    $liveData[$sku] = $item;
                }
            } catch (CartumException $e) {
                $this->logger->warning(
                    'Cartum enrichment failed for site {site_id}, falling back to snapshot: {message}',
                    [
                        'site_id' => $site->id,
                        'message' => $e->getMessage(),
                    ],
                );
                // $liveData stays as-is; miss SKUs simply won't have live data.
            }
        }

        // ---- 4) Build result list preserving input order ----------------------
        $views = [];
        foreach ($products as $product) {
            $sku = (string) $product->sku;

            if (isset($liveData[$sku])) {
                $views[] = LiveProductView::fromCartum($product, $liveData[$sku]);
            } else {
                $views[] = LiveProductView::fromSnapshot($product);
            }
        }

        return $views;
    }

    // ------------------------------------------------------------------
    // Private helpers
    // ------------------------------------------------------------------

    private function cacheKey(mixed $siteId, string $sku): string
    {
        return "cartum:p:{$siteId}:{$sku}";
    }
}
