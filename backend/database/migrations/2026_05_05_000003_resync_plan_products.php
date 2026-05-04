<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    private const PLAN_SLUGS = [
        'basic' => [
            'slugs' => [
                'promo-line', 'sticky-buy-button', 'trust-badges', 'delivery-date',
                'cart-goal', 'minorder-goal',
            ],
            'max_widgets' => 6,
        ],
        'pro' => [
            'slugs' => [
                'promo-line', 'sticky-buy-button', 'trust-badges', 'delivery-date',
                'cart-goal', 'minorder-goal',
                'buyer-count', 'phone-mask', 'photo-video-reviews', 'stock-left',
                'cart-recommender', 'video-preview',
            ],
            'max_widgets' => 12,
        ],
        'max' => [
            'slugs' => [
                'promo-line', 'sticky-buy-button', 'trust-badges', 'delivery-date',
                'cart-goal', 'minorder-goal',
                'buyer-count', 'phone-mask', 'photo-video-reviews', 'stock-left',
                'cart-recommender', 'video-preview',
                'one-plus-one', 'progressive-discount',
                'spin-the-wheel', 'prize-banner', 'promo-auto-apply',
                'last-chance-popup', 'sms-otp-checkout',
            ],
            'max_widgets' => 19,
        ],
    ];

    public function up(): void
    {
        foreach (self::PLAN_SLUGS as $planSlug => $config) {
            $plan = DB::table('plans')->where('slug', $planSlug)->first();
            if (! $plan) {
                continue;
            }

            $productIds = DB::table('products')
                ->whereIn('slug', $config['slugs'])
                ->pluck('id')
                ->all();

            DB::table('product_plan_access')->where('plan_id', $plan->id)->delete();

            foreach ($productIds as $productId) {
                DB::table('product_plan_access')->insert([
                    'plan_id' => $plan->id,
                    'product_id' => $productId,
                ]);
            }

            DB::table('plans')
                ->where('id', $plan->id)
                ->update(['max_widgets' => $config['max_widgets']]);
        }
    }

    public function down(): void
    {
        // No-op: previous distribution is reproducible by re-running ProductPlanAccessSeeder.
    }
};
