<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'slug' => 'free',
                'name' => ['en' => 'Free', 'uk' => 'Безкоштовний'],
                'description' => ['en' => 'Get started for free', 'uk' => 'Почніть безкоштовно'],
                'price_monthly' => 0,
                'price_yearly' => 0,
                'max_sites' => 1,
                'max_widgets' => 2,
                'features' => [],
                'is_recommended' => false,
                'sort_order' => 0,
            ],
            [
                'slug' => 'basic',
                'name' => ['en' => 'Basic', 'uk' => 'Базовий'],
                'description' => ['en' => 'For small stores', 'uk' => 'Для невеликих магазинів'],
                'price_monthly' => 799,
                'price_yearly' => 7990,
                'max_sites' => 1,
                'max_widgets' => 4,
                'features' => [],
                'is_recommended' => false,
                'sort_order' => 1,
            ],
            [
                'slug' => 'pro',
                'name' => ['en' => 'Pro', 'uk' => 'Pro'],
                'description' => ['en' => 'Optimal for growth', 'uk' => 'Оптимальний для росту'],
                'price_monthly' => 1599,
                'price_yearly' => 15990,
                'max_sites' => 3,
                'max_widgets' => 12,
                'features' => [],
                'is_recommended' => true,
                'sort_order' => 2,
            ],
            [
                'slug' => 'max',
                'name' => ['en' => 'Max', 'uk' => 'Max'],
                'description' => ['en' => 'All widgets, maximum power', 'uk' => 'Усі віджети, максимум можливостей'],
                'price_monthly' => 2899,
                'price_yearly' => 28990,
                'max_sites' => 5,
                'max_widgets' => 17,
                'features' => [],
                'is_recommended' => false,
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(
                ['slug' => $plan['slug']],
                $plan,
            );
        }
    }
}
