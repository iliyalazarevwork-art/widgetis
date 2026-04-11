<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Plan>
 */
class PlanFactory extends Factory
{
    protected $model = Plan::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $slug = fake()->unique()->slug(2);

        return [
            'slug' => $slug,
            'name' => ['en' => ucfirst($slug), 'uk' => ucfirst($slug)],
            'description' => ['en' => 'Test plan', 'uk' => 'Тестовий план'],
            'price_monthly' => 499,
            'price_yearly' => 4990,
            'trial_days' => 7,
            'max_sites' => 1,
            'max_widgets' => 5,
            'features' => [],
            'is_recommended' => false,
            'sort_order' => 0,
            'is_active' => true,
        ];
    }

    public function free(): static
    {
        return $this->state(fn () => [
            'slug' => 'free',
            'price_monthly' => 0,
            'price_yearly' => 0,
            'trial_days' => 0,
        ]);
    }

    public function basic(): static
    {
        return $this->state(fn () => [
            'slug' => 'basic',
            'price_monthly' => 299,
            'price_yearly' => 2990,
        ]);
    }

    public function pro(): static
    {
        return $this->state(fn () => [
            'slug' => 'pro',
            'price_monthly' => 599,
            'price_yearly' => 5990,
            'max_sites' => 3,
            'max_widgets' => 20,
        ]);
    }

    public function max(): static
    {
        return $this->state(fn () => [
            'slug' => 'max',
            'price_monthly' => 1299,
            'price_yearly' => 12990,
            'max_sites' => 10,
            'max_widgets' => 100,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
