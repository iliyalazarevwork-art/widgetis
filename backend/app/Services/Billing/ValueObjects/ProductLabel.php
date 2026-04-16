<?php

declare(strict_types=1);

namespace App\Services\Billing\ValueObjects;

use App\Enums\BillingPeriod;

final readonly class ProductLabel
{
    private function __construct(
        public string $text,
    ) {
    }

    public static function forSubscription(
        string $planName,
        BillingPeriod $period,
        string $suffix,
        string $locale,
    ): self {
        $periodLabel = match ($locale) {
            'uk' => match ($period) {
                BillingPeriod::Monthly => 'щомісячна підписка',
                BillingPeriod::Yearly  => 'річна підписка',
            },
            default => match ($period) {
                BillingPeriod::Monthly => 'monthly subscription',
                BillingPeriod::Yearly  => 'yearly subscription',
            },
        };

        $text = match ($locale) {
            'uk' => "Widgetis: {$planName} — {$periodLabel} ({$suffix})",
            default => "Widgetis: {$planName} — {$periodLabel} ({$suffix})",
        };

        return new self($text);
    }
}
