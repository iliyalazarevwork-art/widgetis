<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Core\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'slug' => 'basic',
                'name' => ['en' => 'Basic', 'uk' => 'Базовий'],
                'description' => ['en' => 'For small stores', 'uk' => 'Для невеликих магазинів'],
                'price_monthly' => 799,
                'price_yearly' => 7990,
                'trial_days' => 7,
                'max_sites' => 1,
                'max_widgets' => 6,
                'features' => [],
                'is_recommended' => false,
                'sort_order' => 0,
            ],
            [
                'slug' => 'pro',
                'name' => ['en' => 'Pro', 'uk' => 'Pro'],
                'description' => ['en' => 'Optimal for growth', 'uk' => 'Оптимальний для росту'],
                'price_monthly' => 1599,
                'price_yearly' => 15990,
                'trial_days' => 14,
                'max_sites' => 3,
                'max_widgets' => 12,
                'features' => [],
                'is_recommended' => true,
                'sort_order' => 1,
            ],
            [
                'slug' => 'max',
                'name' => ['en' => 'Max', 'uk' => 'Max'],
                'description' => ['en' => 'All widgets, maximum power', 'uk' => 'Усі віджети, максимум можливостей'],
                'price_monthly' => 3990,
                'price_yearly' => 39900,
                'trial_days' => 14,
                'max_sites' => 5,
                'max_widgets' => 19,
                'features' => [],
                'is_recommended' => false,
                'sort_order' => 2,
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
