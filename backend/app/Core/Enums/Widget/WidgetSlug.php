<?php

declare(strict_types=1);

namespace App\Core\Enums\Widget;

enum WidgetSlug: string
{
    case PromoLine = 'promo-line';
    case DeliveryDate = 'delivery-date';
    case StickyBuyButton = 'sticky-buy-button';
    case TrustBadges = 'trust-badges';
    case PhoneMask = 'phone-mask';
    case MinorderGoal = 'minorder-goal';
    case CartGoal = 'cart-goal';
    case BuyerCount = 'buyer-count';
    case StockLeft = 'stock-left';
    case PhotoVideoReviews = 'photo-video-reviews';
    case VideoPreview = 'video-preview';
    case CartRecommender = 'cart-recommender';
    case PrizeBanner = 'prize-banner';
    case PromoAutoApply = 'promo-auto-apply';
    case ProgressiveDiscount = 'progressive-discount';
    case OnePlusOne = 'one-plus-one';
    case LastChancePopup = 'last-chance-popup';
    case SpinTheWheel = 'spin-the-wheel';
    case SmsOtpCheckout = 'sms-otp-checkout';
    case SmartSearch = 'smart-search';

    public function translatedName(?string $locale = null): string
    {
        return __('widgets.'.$this->value, [], $locale ?? app()->getLocale());
    }
}
