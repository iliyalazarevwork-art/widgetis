<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Core\Enums\Widget\WidgetSlug;
use App\Core\Models\Plan;
use App\Core\Models\Product;
use Illuminate\Database\Seeder;

class ProductPlanAccessSeeder extends Seeder
{
    public function run(): void
    {
        $basicSlugs = [
            WidgetSlug::PromoLine->value,
            WidgetSlug::StickyBuyButton->value,
            WidgetSlug::TrustBadges->value,
            WidgetSlug::DeliveryDate->value,
            WidgetSlug::CartGoal->value,
            WidgetSlug::MinorderGoal->value,
        ];
        $proSlugs = [
            ...$basicSlugs,
            WidgetSlug::BuyerCount->value,
            WidgetSlug::PhoneMask->value,
            WidgetSlug::PhotoVideoReviews->value,
            WidgetSlug::StockLeft->value,
            WidgetSlug::CartRecommender->value,
            WidgetSlug::VideoPreview->value,
        ];
        $maxSlugs = [
            ...$proSlugs,
            WidgetSlug::OnePlusOne->value,
            WidgetSlug::ProgressiveDiscount->value,
            WidgetSlug::SpinTheWheel->value,
            WidgetSlug::PrizeBanner->value,
            WidgetSlug::PromoAutoApply->value,
            WidgetSlug::LastChancePopup->value,
            WidgetSlug::SmsOtpCheckout->value,
        ];

        $getIds = fn (array $slugs): array => Product::whereIn('slug', $slugs)->pluck('id')->toArray();

        Plan::where('slug', 'free')->first()?->products()->sync($getIds($proSlugs));
        Plan::where('slug', 'basic')->first()?->products()->sync($getIds($basicSlugs));
        Plan::where('slug', 'pro')->first()?->products()->sync($getIds($proSlugs));
        Plan::where('slug', 'max')->first()?->products()->sync($getIds($maxSlugs));
    }
}
