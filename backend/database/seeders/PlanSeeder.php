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
                'slug' => 'free',
                'name' => ['en' => 'Free', 'uk' => 'Free'],
                'description' => ['en' => 'For starting stores', 'uk' => 'Для магазинів-початківців'],
                'price_monthly' => 0,
                'price_yearly' => 0,
                'trial_days' => 0,
                'max_sites' => 1,
                'max_widgets' => 11,
                'features' => [],
                'is_recommended' => false,
                'sort_order' => -1,
                'languages_supported' => ['uk'],
                'widget_limits_config' => [
                    'promo-line' => [
                        'max_messages' => 2,
                        'rotation_enabled' => true,
                    ],
                    'delivery-date' => [
                        'format_mode' => 'relative_days_only',
                    ],
                    'sticky-buy-button' => [
                        'color_presets_only' => true,
                        'preset_count' => 3,
                        'custom_text_enabled' => false,
                    ],
                    'trust-badges' => [
                        'max_badges' => 3,
                        'preset_only' => true,
                    ],
                    'phone-mask' => [
                        'ua_only' => true,
                    ],
                    'minorder-goal' => [
                        'max_thresholds' => 1,
                        'animation_enabled' => false,
                    ],
                    'cart-goal' => [
                        'max_thresholds' => 1,
                        'animation_enabled' => false,
                    ],
                    'buyer-count' => [
                        'live_counter_enabled' => false,
                    ],
                    'stock-left' => [
                        'urgency_animation_enabled' => false,
                    ],
                    'photo-video-reviews' => [
                        'max_reviews_per_product' => 5,
                        'video_enabled' => false,
                    ],
                    'video-preview' => [
                        'auto_detect_only' => true,
                        'default_video_enabled' => false,
                        'autoplay_enabled' => false,
                    ],
                ],
            ],
            [
                'slug' => 'pro',
                'name' => ['en' => 'Pro', 'uk' => 'Pro'],
                'description' => ['en' => 'Optimal for growth', 'uk' => 'Оптимальний для росту'],
                'price_monthly' => 499,
                'price_yearly' => 4990,
                'trial_days' => 14,
                'max_sites' => 3,
                'max_widgets' => 11,
                'features' => [],
                'is_recommended' => true,
                'sort_order' => 0,
                'languages_supported' => ['uk', 'en'],
                'widget_limits_config' => null,
            ],
            [
                'slug' => 'max',
                'name' => ['en' => 'Max', 'uk' => 'Max'],
                'description' => ['en' => 'All widgets, maximum power', 'uk' => 'Усі віджети, максимум можливостей'],
                'price_monthly' => 699,
                'price_yearly' => 6990,
                'trial_days' => 14,
                'max_sites' => 5,
                'max_widgets' => 20,
                'features' => [],
                'is_recommended' => false,
                'sort_order' => 1,
                'languages_supported' => ['uk', 'en', 'ru'],
                'widget_limits_config' => null,
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
