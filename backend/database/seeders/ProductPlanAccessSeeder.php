<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductPlanAccessSeeder extends Seeder
{
    public function run(): void
    {
        $basicSlugs = ['promo-line', 'freeship-goal', 'minorder-goal', 'buyer-count', 'sticky-buy-button'];
        $proSlugs = ['promo-line', 'freeship-goal', 'minorder-goal', 'buyer-count', 'sticky-buy-button', 'delivery-date', 'one-plus-one-deal', 'video-preview'];
        $maxSlugs = $proSlugs;

        $getIds = fn (array $slugs): array => Product::whereIn('slug', $slugs)->pluck('id')->toArray();

        Plan::where('slug', 'basic')->first()?->products()->sync($getIds($basicSlugs));
        Plan::where('slug', 'pro')->first()?->products()->sync($getIds($proSlugs));
        Plan::where('slug', 'max')->first()?->products()->sync($getIds($maxSlugs));
    }
}
