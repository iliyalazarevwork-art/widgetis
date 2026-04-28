<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Widget\CartRecommender;

use App\WidgetRuntime\Enums\CartRecommenderRelationSource;
use App\WidgetRuntime\Models\CartRecommenderRelation;
use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Services\Widget\CartRecommender\Composer\ComposerInterface;
use Psr\Log\LoggerInterface;

final class CartRecommenderService
{
    public function __construct(
        private readonly ComposerInterface $composer,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * Return up to top_n recommended products for a source product.
     *
     * Resolution order:
     * 1. Fresh persisted relations (already computed, not expired)
     * 2. On-demand AI composition via OnDemandComposer
     * 3. Category-proximity fallback (same category, price-sorted, in stock)
     *
     * @return list<CartRecommenderRelation>
     */
    public function suggestForProduct(Site $site, int $sourceProductId): array
    {
        $topN = (int) config('recommender.composer.top_n', 4);

        // 1) Try fresh persisted relations
        $existing = CartRecommenderRelation::on($site->getConnectionName() ?? 'pgsql_runtime')
            ->where('site_id', $site->id)
            ->where('source_product_id', $sourceProductId)
            ->fresh()
            ->orderByDesc('score')
            ->limit($topN)
            ->with('relatedProduct')
            ->get();

        if ($existing->count() >= 1) {
            return $existing->all();
        }

        // 2) Resolve source product
        $source = CatalogProduct::on($site->getConnectionName() ?? 'pgsql_runtime')
            ->where('site_id', $site->id)
            ->where('id', $sourceProductId)
            ->first();

        if ($source === null) {
            return [];
        }

        if ($source->ai_tags === null) {
            return $this->categoryFallback($site, $source, $topN);
        }

        // 3) Compose on-demand
        try {
            $composed = $this->composer->composeFor($source);

            if (count($composed) > 0) {
                return array_slice($composed, 0, $topN);
            }
        } catch (\Throwable $e) {
            $this->logger->error('cart-recommender lazy compose failed', [
                'site_id'    => $site->id,
                'product_id' => $sourceProductId,
                'error'      => $e->getMessage(),
            ]);
        }

        // 4) Category fallback
        return $this->categoryFallback($site, $source, $topN);
    }

    /**
     * Build transient CartRecommenderRelation instances from category-proximity products.
     * These are NOT persisted — they are in-memory only.
     *
     * @return list<CartRecommenderRelation>
     */
    private function categoryFallback(Site $site, CatalogProduct $source, int $topN): array
    {
        $connection = $site->getConnectionName() ?? 'pgsql_runtime';

        $fallback = CatalogProduct::on($connection)
            ->where('site_id', $site->id)
            ->where('id', '!=', $source->id)
            ->where('in_stock', true)
            ->when(
                $source->category_path !== null,
                fn ($q) => $q->where('category_path', $source->category_path),
            )
            ->orderByRaw('ABS(COALESCE(price, 0) - ?)', [$source->price ?? 0])
            ->limit($topN)
            ->get();

        $rels = [];

        foreach ($fallback as $product) {
            $rel = new CartRecommenderRelation();
            $rel->forceFill([
                'site_id'            => $site->id,
                'source_product_id'  => $source->id,
                'related_product_id' => $product->id,
                'score'              => 0.0,
                'rationale_ua'       => null,
                'rationale_en'       => null,
                'source'             => CartRecommenderRelationSource::CategoryFallback->value,
            ]);
            $rel->setRelation('relatedProduct', $product);
            $rels[] = $rel;
        }

        return $rels;
    }
}
