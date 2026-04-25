<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Core\Models\Plan;
use App\Core\Models\PlanFeature;
use App\Core\Models\PlanFeatureValue;
use Illuminate\Database\Seeder;

class PlanFeaturesSeeder extends Seeder
{
    public function run(): void
    {
        // Define features
        $features = [
            ['feature_key' => 'delivery_date', 'name' => ['uk' => 'Дата доставки', 'en' => 'Delivery date'], 'category' => 'widgets', 'sort_order' => 1],
            ['feature_key' => 'free_delivery', 'name' => ['uk' => 'Безкоштовна доставка', 'en' => 'Free delivery'], 'category' => 'widgets', 'sort_order' => 2],
            ['feature_key' => 'ticker', 'name' => ['uk' => 'Бігуча стрічка', 'en' => 'Ticker marquee'], 'category' => 'widgets', 'sort_order' => 3],
            ['feature_key' => 'who_watching', 'name' => ['uk' => 'Хто зараз дивиться', 'en' => 'Who is watching'], 'category' => 'widgets', 'sort_order' => 4],
            ['feature_key' => 'stock_counter', 'name' => ['uk' => 'Лічильник залишків', 'en' => 'Stock counter'], 'category' => 'widgets', 'sort_order' => 5],
            ['feature_key' => 'cart_progress', 'name' => ['uk' => 'Прогрес кошика', 'en' => 'Cart progress'], 'category' => 'widgets', 'sort_order' => 6],
            ['feature_key' => 'photo_reviews', 'name' => ['uk' => 'Фотовідгуки', 'en' => 'Photo reviews'], 'category' => 'widgets', 'sort_order' => 7],
            ['feature_key' => 'cashback', 'name' => ['uk' => 'Кешбек-калькулятор', 'en' => 'Cashback calculator'], 'category' => 'widgets', 'sort_order' => 8],
            ['feature_key' => 'urgency_timer', 'name' => ['uk' => 'Таймер терміновості', 'en' => 'Urgency timer'], 'category' => 'widgets', 'sort_order' => 9],
            ['feature_key' => 'customization', 'name' => ['uk' => 'Кастомізація', 'en' => 'Customization'], 'category' => 'service', 'sort_order' => 10],
            ['feature_key' => 'support', 'name' => ['uk' => 'Підтримка', 'en' => 'Support'], 'category' => 'service', 'sort_order' => 11],
        ];

        foreach ($features as $f) {
            PlanFeature::updateOrCreate(
                ['feature_key' => $f['feature_key']],
                $f,
            );
        }

        // Define values per plan: feature_key => value
        // true = included, false = not included, string = custom text
        $planValues = [
            'basic' => [
                'delivery_date' => true,
                'free_delivery' => true,
                'ticker' => true,
                'who_watching' => true,
                'stock_counter' => false,
                'cart_progress' => false,
                'photo_reviews' => false,
                'cashback' => false,
                'urgency_timer' => false,
                'customization' => ['uk' => 'Базова', 'en' => 'Basic'],
                'support' => ['uk' => 'Email + Telegram', 'en' => 'Email + Telegram'],
            ],
            'pro' => [
                'delivery_date' => true,
                'free_delivery' => true,
                'ticker' => true,
                'who_watching' => true,
                'stock_counter' => true,
                'cart_progress' => true,
                'photo_reviews' => true,
                'cashback' => false,
                'urgency_timer' => false,
                'customization' => ['uk' => 'Self-service', 'en' => 'Self-service'],
                'support' => ['uk' => 'Email + Telegram', 'en' => 'Email + Telegram'],
            ],
            'max' => [
                'delivery_date' => true,
                'free_delivery' => true,
                'ticker' => true,
                'who_watching' => true,
                'stock_counter' => true,
                'cart_progress' => true,
                'photo_reviews' => true,
                'cashback' => true,
                'urgency_timer' => true,
                'customization' => ['uk' => 'Повна', 'en' => 'Full'],
                'support' => ['uk' => 'VIP', 'en' => 'VIP'],
            ],
        ];

        foreach ($planValues as $planSlug => $featureValues) {
            $plan = Plan::where('slug', $planSlug)->firstOrFail();

            foreach ($featureValues as $featureKey => $value) {
                $feature = PlanFeature::where('feature_key', $featureKey)->firstOrFail();

                PlanFeatureValue::updateOrCreate(
                    ['plan_id' => $plan->id, 'plan_feature_id' => $feature->id],
                    ['value' => $value],
                );
            }
        }

        // Update plans.features JSON + icon/pitch
        Plan::where('slug', 'basic')->update([
            'features' => json_encode([
                'icon' => 'sprout',
                'pitch' => ['uk' => 'Для початку', 'en' => 'Getting started'],
            ]),
        ]);
        Plan::where('slug', 'pro')->update([
            'features' => json_encode([
                'icon' => 'zap',
                'pitch' => ['uk' => 'Оптимально', 'en' => 'Optimal'],
                'badge' => ['uk' => 'Обирає 73% клієнтів', 'en' => 'Chosen by 73%'],
            ]),
        ]);
        Plan::where('slug', 'max')->update([
            'features' => json_encode([
                'icon' => 'crown',
                'pitch' => ['uk' => 'Все включено', 'en' => 'All-inclusive'],
            ]),
        ]);
    }
}
