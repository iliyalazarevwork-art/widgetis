<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Controllers\Api\V1\Widget;

use App\WidgetRuntime\Http\Requests\Widget\CartRecommender\SuggestRequest;
use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Services\Catalog\Cartum\LiveProductEnricher;
use App\WidgetRuntime\Services\Widget\CartRecommender\CartRecommenderService;
use Illuminate\Http\JsonResponse;

/**
 * GET /api/v1/widget/cart-recommender/suggest
 *
 * Returns up to top_n recommended products for a source product.
 * The site is resolved from the Origin/Referer header by the
 * `resolve.site.origin` middleware (stored in request attributes as 'site').
 *
 * Query parameters (at least one required for a non-empty response):
 *   - `alias`      (string) — Horoshop product URL slug mapped to wgt_catalog_products.alias.
 *                             Normalised before query: trimmed, lowercased, leading/trailing
 *                             slashes stripped (e.g. "/Foo-Bar/" → "foo-bar").
 *   - `sku`        (string) — Horoshop SKU mapped to wgt_catalog_products.sku
 *   - `product_id` (int)   — internal wgt_catalog_products.id (Phase 1 compat)
 *
 * Resolution priority: alias → sku → product_id.
 * When multiple params are supplied, the highest-priority match wins.
 */
final class CartRecommenderSuggestController
{
    public function __construct(
        private readonly CartRecommenderService $recommender,
        private readonly LiveProductEnricher $enricher,
    ) {
    }

    public function __invoke(SuggestRequest $request): JsonResponse
    {
        /** @var Site $site */
        $site = $request->attributes->get('site');

        $source = $this->resolveSourceProduct($request, $site);

        if ($source === null) {
            return response()->json([
                'data' => [],
                'meta' => [
                    'source_product_id' => null,
                    'source_sku'        => $request->validated('sku'),
                    'live'              => false,
                ],
            ]);
        }

        $relations = $this->recommender->suggestForProduct($site, $source->id);

        if ($relations === []) {
            return response()->json([
                'data' => [],
                'meta' => [
                    'source_product_id' => $source->id,
                    'source_sku'        => $source->sku,
                    'live'              => false,
                ],
            ]);
        }

        /** @var list<CatalogProduct> $relatedProducts */
        $relatedProducts = array_map(
            static fn ($r) => $r->relatedProduct,
            $relations,
        );

        $views = $this->enricher->enrich($site, $relatedProducts);

        /** @var array<int, int|null> $horoshopIds */
        $horoshopIds = [];
        foreach ($relatedProducts as $p) {
            $rawId = $p->getAttribute('horoshop_id');
            $horoshopIds[$p->id] = $rawId === null ? null : (int) $rawId;
        }

        $anyLive = false;
        $items   = [];

        foreach ($relations as $i => $rel) {
            $view = $views[$i];

            if ($view->live) {
                $anyLive = true;
            }

            $titleFields = array_filter(
                ['ua' => $view->titleUa, 'en' => $view->titleEn],
                static fn ($v) => $v !== null && $v !== '',
            );

            $rationaleFields = array_filter(
                ['ua' => $rel->rationale_ua, 'en' => $rel->rationale_en],
                static fn ($v) => $v !== null && $v !== '',
            );

            $items[] = [
                'id'          => $view->productId,
                'sku'         => $view->sku,
                'horoshop_id' => $horoshopIds[$view->productId] ?? null,
                'url'         => $view->url,
                'image'       => $view->imageUrl,
                'title'       => $titleFields ?: null,
                'price_new'   => $view->priceNew,
                'price_old'   => $view->priceOld,
                'currency'    => $view->currency,
                'rationale'   => $rationaleFields !== [] ? $rationaleFields : null,
                'source'      => $rel->source instanceof \BackedEnum
                    ? $rel->source->value
                    : (string) $rel->source,
            ];
        }

        return response()->json([
            'data' => $items,
            'meta' => [
                'source_product_id' => $source->id,
                'source_sku'        => $source->sku,
                'live'              => $anyLive,
            ],
        ]);
    }

    /**
     * Resolve the source CatalogProduct using priority: alias → sku → product_id.
     *
     * alias normalisation: trimmed, lowercased, leading/trailing slashes stripped.
     * E.g. "/Foo-Bar/" → "foo-bar", "  /product  " → "product".
     */
    private function resolveSourceProduct(SuggestRequest $request, Site $site): ?CatalogProduct
    {
        $alias     = $this->normaliseAlias($request->validated('alias'));
        $sku       = $request->validated('sku');
        $productId = $request->validated('product_id');


        if ($alias !== null) {
            return CatalogProduct::query()
                ->where('site_id', $site->id)
                ->where('alias', $alias)
                ->first();
        }

        if ($sku !== null) {
            return CatalogProduct::query()
                ->where('site_id', $site->id)
                ->where('sku', $sku)
                ->first();
        }

        if ($productId !== null) {
            return CatalogProduct::query()
                ->where('site_id', $site->id)
                ->where('id', (int) $productId)
                ->first();
        }

        return null;
    }

    /**
     * Normalise an alias value: trim whitespace, strip leading/trailing slashes,
     * lowercase. Returns null when the result is an empty string.
     */
    private function normaliseAlias(mixed $raw): ?string
    {
        if ($raw === null) {
            return null;
        }

        $alias = trim((string) $raw, '/ ');
        $alias = strtolower($alias);

        return $alias !== '' ? $alias : null;
    }
}
