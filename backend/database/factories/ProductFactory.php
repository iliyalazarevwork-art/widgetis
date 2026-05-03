<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Core\Models\Product;
use App\Enums\ProductAvailability;
use App\Enums\ProductStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $slug = fake()->unique()->slug(2);

        return [
            'slug' => $slug,
            'name' => ['en' => ucfirst($slug), 'uk' => ucfirst($slug)],
            'description' => ['en' => 'Test widget', 'uk' => 'Тестовий віджет'],
            'long_description' => ['en' => 'Long', 'uk' => 'Довгий'],
            'features' => ['en' => [], 'uk' => []],
            'icon' => 'box',
            'tag_slug' => null,
            'platform' => 'horoshop',
            'status' => ProductStatus::Active->value,
            'is_popular' => false,
            'is_new' => false,
            'preview_before' => null,
            'preview_after' => null,
            'config_schema' => null,
            'sort_order' => 0,
            'availability' => ProductAvailability::Available,
        ];
    }

    public function archived(): static
    {
        return $this->state(fn () => ['status' => ProductStatus::Archived->value]);
    }

    public function comingSoon(): static
    {
        return $this->state(fn () => ['availability' => ProductAvailability::ComingSoon]);
    }
}
