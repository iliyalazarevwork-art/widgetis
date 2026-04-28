<?php

declare(strict_types=1);

namespace Database\Factories;

use App\WidgetRuntime\Enums\CartRecommenderRelationSource;
use App\WidgetRuntime\Models\CartRecommenderRelation;
use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Models\Site;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CartRecommenderRelation>
 */
class CartRecommenderRelationFactory extends Factory
{
    protected $model = CartRecommenderRelation::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'site_id' => Site::factory(),
            'source_product_id' => CatalogProduct::factory(),
            'related_product_id' => CatalogProduct::factory(),
            'score' => 0.5,
            'source' => CartRecommenderRelationSource::LazyAi,
        ];
    }
}
