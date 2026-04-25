<?php

declare(strict_types=1);

namespace App\Core\Services\Bridge;

use App\Core\Models\Plan;
use App\Core\Models\Product;
use App\Shared\Contracts\WidgetCatalogInterface;

final class EloquentWidgetCatalog implements WidgetCatalogInterface
{
    public function widgetExistsBySlug(string $slug): bool
    {
        return Product::where('slug', $slug)->exists();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getConfigSchemaBySlug(string $slug): ?array
    {
        $product = Product::where('slug', $slug)->active()->first(['config_schema']);

        if ($product === null) {
            return null;
        }

        $schema = $product->config_schema;

        return is_array($schema) ? $schema : null;
    }

    /** @return list<string> */
    public function availableSlugsForPlan(string $planSlug): array
    {
        $plan = Plan::where('slug', $planSlug)->first();

        if ($plan === null) {
            return [];
        }

        return $plan->products()
            ->active()
            ->pluck('products.slug')
            ->all();
    }
}
