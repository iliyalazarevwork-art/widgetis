<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Core\Models\Plan;
use App\Core\Models\Product;
use Illuminate\Database\Seeder;

class ProductPlanAccessSeeder extends Seeder
{
    public function run(): void
    {
        $basicSlugs = ['delivery-date', 'promo-line', 'sticky-buy-button', 'trust-badges'];
        $proSlugs = [...$basicSlugs, 'cart-goal', 'buyer-count', 'stock-left', 'photo-video-reviews'];
        $maxSlugs = [...$proSlugs, 'recently-viewed', 'video-preview', 'floating-messengers', 'cart-recommender', 'progressive-discount', 'one-plus-one', 'last-chance-popup', 'spin-the-wheel', 'sms-otp-checkout', 'phone-mask', 'minorder-goal', 'prize-banner', 'promo-auto-apply', 'smart-search'];

        $getIds = fn (array $slugs): array => Product::whereIn('slug', $slugs)->pluck('id')->toArray();

        Plan::where('slug', 'basic')->first()?->products()->sync($getIds($basicSlugs));
        Plan::where('slug', 'pro')->first()?->products()->sync($getIds($proSlugs));
        Plan::where('slug', 'max')->first()?->products()->sync($getIds($maxSlugs));
    }
}
