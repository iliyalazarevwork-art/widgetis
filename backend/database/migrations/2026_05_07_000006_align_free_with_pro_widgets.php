<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    private const PRO_SLUGS = [
        'promo-line', 'sticky-buy-button', 'trust-badges', 'delivery-date',
        'cart-goal', 'minorder-goal',
        'buyer-count', 'phone-mask', 'photo-video-reviews', 'stock-left',
        'cart-recommender', 'video-preview',
    ];

    public function up(): void
    {
        $freePlan = DB::table('plans')->where('slug', 'free')->first();
        if (! $freePlan) {
            return;
        }

        $productIds = DB::table('products')
            ->whereIn('slug', self::PRO_SLUGS)
            ->pluck('id')
            ->all();

        DB::table('product_plan_access')->where('plan_id', $freePlan->id)->delete();
        foreach ($productIds as $productId) {
            DB::table('product_plan_access')->insert([
                'plan_id' => $freePlan->id,
                'product_id' => $productId,
            ]);
        }

        $limits = json_decode((string) $freePlan->widget_limits_config, true) ?: [];
        if (! array_key_exists('cart-recommender', $limits)) {
            $limits['cart-recommender'] = [
                'max_recommendations' => 2,
                'manual_picks_only' => true,
            ];
        }

        DB::table('plans')->where('id', $freePlan->id)->update([
            'max_widgets' => 12,
            'widget_limits_config' => json_encode($limits),
        ]);
    }

    public function down(): void
    {
        // Irreversible alignment.
    }
};
