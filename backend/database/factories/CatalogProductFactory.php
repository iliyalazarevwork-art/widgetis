<?php

declare(strict_types=1);

namespace Database\Factories;

use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Models\Site;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CatalogProduct>
 */
class CatalogProductFactory extends Factory
{
    protected $model = CatalogProduct::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'site_id' => Site::factory(),
            'sku' => $this->faker->unique()->bothify('SKU-####'),
            'title_ua' => $this->faker->sentence(4),
            'price' => $this->faker->randomFloat(2, 100, 5000),
            'in_stock' => true,
            'currency' => 'UAH',
        ];
    }
}
