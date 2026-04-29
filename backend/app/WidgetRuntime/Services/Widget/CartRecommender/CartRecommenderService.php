<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Widget\CartRecommender;

use App\WidgetRuntime\Enums\CartRecommenderRelationSource;
use App\WidgetRuntime\Models\CartRecommenderRelation;
use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Services\Widget\CartRecommender\Composer\ComposerInterface;
use Illuminate\Database\Eloquent\Builder;
use Psr\Log\LoggerInterface;

final class CartRecommenderService
{
    /** @var array<string, list<string>> */
    private const FALLBACK_COMPLEMENTS = [
        'bedding_set' => ['pillowcase', 'fitted_sheet', 'flat_sheet', 'duvet_cover', 'throw_blanket', 'bedspread'],
        'duvet_cover' => ['fitted_sheet', 'flat_sheet', 'pillowcase', 'bedspread', 'throw_blanket'],
        'fitted_sheet' => ['duvet_cover', 'pillowcase', 'bedspread', 'throw_blanket'],
        'flat_sheet' => ['duvet_cover', 'pillowcase', 'bedspread', 'throw_blanket'],
        'pillowcase' => ['fitted_sheet', 'flat_sheet', 'duvet_cover', 'bedspread', 'throw_blanket', 'bedding_set'],
        'throw_blanket' => ['pillowcase', 'fitted_sheet', 'bedspread', 'bedding_set'],
        'bedspread' => ['pillowcase', 'fitted_sheet', 'duvet_cover', 'throw_blanket', 'bedding_set'],
    ];

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

        // Resolve source product first so cached relations can be filtered by
        // the same type-compatibility rules as newly composed recommendations.
        $source = CatalogProduct::on($site->getConnectionName() ?? 'pgsql_runtime')
            ->where('site_id', $site->id)
            ->where('id', $sourceProductId)
            ->first();

        if ($source === null) {
            return [];
        }

        // 1) Try fresh persisted relations
        $existing = CartRecommenderRelation::on($site->getConnectionName() ?? 'pgsql_runtime')
            ->where('site_id', $site->id)
            ->where('source_product_id', $sourceProductId)
            ->fresh()
            ->whereHas('relatedProduct', static function (Builder $q): void {
                /** @var Builder<CatalogProduct> $q */
                $q->purchasableForWidget();
            })
            ->orderByDesc('score')
            ->limit(max(20, $topN * 5))
            ->with('relatedProduct')
            ->get()
            ->filter(fn (CartRecommenderRelation $relation): bool => $relation->relatedProduct instanceof CatalogProduct
                && $this->isComplementaryRecommendation($source, $relation->relatedProduct))
            ->take($topN)
            ->values();

        if ($existing->count() >= 1) {
            return $existing->all();
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

        $query = CatalogProduct::on($connection)
            ->where('site_id', $site->id)
            ->where('id', '!=', $source->id)
            ->purchasableForWidget()
            ->orderByRaw('ABS(COALESCE(price, 0) - ?)', [$source->price ?? 0]);

        $sourceType = $this->primaryTypeFor($source);
        $allowedTypes = $sourceType !== null ? (self::FALLBACK_COMPLEMENTS[$sourceType] ?? []) : [];

        if ($allowedTypes === []) {
            $query->when(
                $source->category_path !== null,
                fn ($q) => $q->where('category_path', $source->category_path),
            );
        }

        $fallback = $query
            ->limit($allowedTypes !== [] ? max(100, $topN * 20) : $topN)
            ->get();

        if ($allowedTypes !== []) {
            $fallback = $fallback
                ->filter(fn (CatalogProduct $product): bool => in_array($this->primaryTypeFor($product), $allowedTypes, true))
                ->take($topN)
                ->values();
        }

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

    private function primaryTypeFor(CatalogProduct $product): ?string
    {
        $tagged = $product->ai_tags['primary_type'] ?? null;
        if (is_string($tagged) && $tagged !== '') {
            return $tagged;
        }

        $haystack = mb_strtolower(implode(' ', array_filter([
            $product->category_path,
            $product->title_ua,
            $product->title_en,
        ])));

        return match (true) {
            str_contains($haystack, 'наволоч'), str_contains($haystack, 'pillowcase') => 'pillowcase',
            str_contains($haystack, 'простирад'), str_contains($haystack, 'sheet') => 'fitted_sheet',
            str_contains($haystack, 'підковдр'), str_contains($haystack, 'пододеял'), str_contains($haystack, 'duvet cover') => 'duvet_cover',
            str_contains($haystack, 'покривал'), str_contains($haystack, 'bedspread') => 'bedspread',
            str_contains($haystack, 'плед'), str_contains($haystack, 'throw') => 'throw_blanket',
            str_contains($haystack, 'комплект'), str_contains($haystack, 'постільна білизна'), str_contains($haystack, 'bedding set') => 'bedding_set',
            default => null,
        };
    }

    private function isComplementaryRecommendation(CatalogProduct $source, CatalogProduct $candidate): bool
    {
        $sourceType = $this->primaryTypeFor($source);
        $candidateType = $this->primaryTypeFor($candidate);

        return $sourceType === null
            || $candidateType === null
            || $sourceType !== $candidateType;
    }
}
