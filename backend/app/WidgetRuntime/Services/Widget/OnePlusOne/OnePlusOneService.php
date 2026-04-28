<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Widget\OnePlusOne;

use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Models\OnePlusOnePromo;
use App\WidgetRuntime\Models\Site;
use Illuminate\Support\Facades\Log;

final class OnePlusOneService
{
    /**
     * Evaluate the cart and return swap instructions.
     *
     * @param  list<array{id: int, price: float, quantity: int, article?: string}>  $cartItems
     * @return array{
     *     promo_active: bool,
     *     min_items: int,
     *     total_items: int,
     *     gift_count: int,
     *     swaps: list<array{
     *         original_id: int,
     *         original_article: string,
     *         clone_article: string,
     *         clone_id: int|null,
     *         quantity: int,
     *         original_price: float,
     *         clone_price: float,
     *     }>,
     * }
     */
    public function evaluate(Site $site, array $cartItems): array
    {
        $promo = OnePlusOnePromo::query()->forSite($site->id)->first();

        if ($promo === null || ! $promo->is_active) {
            return $this->emptyResult($promo);
        }

        $productMapValue = $promo->getAttribute('product_map');
        /** @var array<string, string> $productMap */
        $productMap = is_array($productMapValue) ? $productMapValue : [];
        if ($productMap === []) {
            Log::warning('[OnePlusOne] product_map empty', ['site_id' => $site->id]);

            return $this->emptyResult($promo);
        }

        $idMap = $this->buildSkuToHoroshopIdMap($site->id);
        $categoriesValue = $promo->getAttribute('categories');
        /** @var list<string>|null $allowedCategories */
        $allowedCategories = is_array($categoriesValue) ? array_values($categoriesValue) : null;

        $articleCategoriesValue = $promo->getAttribute('article_categories');
        /** @var array<string, string> $articleCategories */
        $articleCategories = is_array($articleCategoriesValue) ? $articleCategoriesValue : [];

        $eligible = $this->filterByCategory($cartItems, $allowedCategories, $articleCategories);
        $units = $this->expandToUnits($eligible);

        $total = count($units);
        if ($total < $promo->min_items) {
            return $this->emptyResult($promo);
        }

        $giftCount = (int) floor($total / $promo->min_items);
        usort($units, static fn ($a, $b) => $a['price'] <=> $b['price']);

        $gifts = $this->pickGifts($units, $productMap, $giftCount);
        if ($gifts === []) {
            return $this->emptyResult($promo);
        }

        $swaps = $this->groupSwaps($gifts, $productMap, $idMap, (float) $promo->one_uah_price);

        Log::info('[OnePlusOne] Evaluated', [
            'site_id' => $site->id,
            'total'   => $total,
            'gifts'   => count($gifts),
            'swaps'   => $swaps,
        ]);

        return [
            'promo_active' => true,
            'min_items'    => $promo->min_items,
            'total_items'  => $total,
            'gift_count'   => count($gifts),
            'swaps'        => $swaps,
        ];
    }

    /**
     * @return array<string, int>
     */
    private function buildSkuToHoroshopIdMap(string $siteId): array
    {
        return CatalogProduct::query()
            ->where('site_id', $siteId)
            ->whereNotNull('horoshop_id')
            ->pluck('horoshop_id', 'sku')
            ->map(static fn ($v) => (int) $v)
            ->all();
    }

    /**
     * @param  list<array{id: int, price: float, quantity: int, article?: string}>  $cartItems
     * @param  list<string>|null  $allowed
     * @param  array<string, string>  $articleCategories
     * @return list<array{id: int, price: float, quantity: int, article?: string}>
     */
    private function filterByCategory(array $cartItems, ?array $allowed, array $articleCategories): array
    {
        if ($allowed === null || $allowed === []) {
            return $cartItems;
        }

        $eligible = [];
        foreach ($cartItems as $item) {
            $article = $item['article'] ?? null;
            if ($article === null) {
                continue;
            }

            $cat = $articleCategories[$article] ?? null;
            if ($cat === null || ! $this->inCategory($cat, $allowed)) {
                continue;
            }

            $eligible[] = $item;
        }

        return $eligible;
    }

    /**
     * @param  list<array{id: int, price: float, quantity: int, article?: string}>  $eligible
     * @return list<array{id: int, price: float, article: ?string}>
     */
    private function expandToUnits(array $eligible): array
    {
        $units = [];
        foreach ($eligible as $item) {
            for ($i = 0; $i < $item['quantity']; $i++) {
                $units[] = [
                    'id'      => $item['id'],
                    'price'   => (float) $item['price'],
                    'article' => $item['article'] ?? null,
                ];
            }
        }

        return $units;
    }

    /**
     * @param  list<array{id: int, price: float, article: ?string}>  $units
     * @param  array<string, string>  $productMap
     * @return list<array{id: int, price: float, article: ?string}>
     */
    private function pickGifts(array $units, array $productMap, int $giftCount): array
    {
        $gifts = [];
        foreach ($units as $unit) {
            if (count($gifts) >= $giftCount) {
                break;
            }
            if ($unit['article'] !== null && isset($productMap[$unit['article']])) {
                $gifts[] = $unit;
            }
        }

        return $gifts;
    }

    /**
     * @param  list<array{id: int, price: float, article: ?string}>  $gifts
     * @param  array<string, string>  $productMap
     * @param  array<string, int>  $idMap
     * @return list<array{
     *     original_id: int,
     *     original_article: string,
     *     clone_article: string,
     *     clone_id: int|null,
     *     quantity: int,
     *     original_price: float,
     *     clone_price: float,
     * }>
     */
    private function groupSwaps(array $gifts, array $productMap, array $idMap, float $clonePrice): array
    {
        $swaps = [];

        foreach ($gifts as $unit) {
            $art = (string) $unit['article'];
            $clone = $productMap[$art];

            if (! isset($swaps[$art])) {
                $swaps[$art] = [
                    'original_id'      => $unit['id'],
                    'original_article' => $art,
                    'clone_article'    => $clone,
                    'clone_id'         => $idMap[$clone] ?? null,
                    'quantity'         => 0,
                    'original_price'   => $unit['price'],
                    'clone_price'      => $clonePrice,
                ];
            }
            $swaps[$art]['quantity']++;
        }

        return array_values($swaps);
    }

    /**
     * @param  list<string>  $allowed
     */
    private function inCategory(string $product, array $allowed): bool
    {
        foreach ($allowed as $cat) {
            if ($product === $cat || str_starts_with($product, $cat.'/')) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array{
     *     promo_active: bool,
     *     min_items: int,
     *     total_items: int,
     *     gift_count: int,
     *     swaps: list<never>,
     * }
     */
    private function emptyResult(?OnePlusOnePromo $promo): array
    {
        return [
            'promo_active' => false,
            'min_items'    => $promo === null ? 3 : $promo->min_items,
            'total_items'  => 0,
            'gift_count'   => 0,
            'swaps'        => [],
        ];
    }
}
