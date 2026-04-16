<?php

declare(strict_types=1);

namespace App\Services\Billing\Commands;

use App\Enums\BillingPeriod;
use App\Exceptions\Billing\InvalidBillingCommandException;
use App\Services\Billing\ValueObjects\CallbackUrls;
use App\Services\Billing\ValueObjects\CustomerProfile;
use App\Services\Billing\ValueObjects\Money;
use App\Services\Billing\ValueObjects\ProductLabel;

final readonly class StartSubscriptionCommand
{
    public function __construct(
        public string $reference,
        public Money $firstChargeAmount,
        public Money $recurringAmount,
        public BillingPeriod $period,
        public int $trialDays,
        public CustomerProfile $customer,
        public ProductLabel $label,
        public CallbackUrls $urls,
    ) {
        if ($trialDays < 0) {
            throw InvalidBillingCommandException::negativeTrialDays($trialDays);
        }

        if ($firstChargeAmount->currency !== $recurringAmount->currency) {
            throw InvalidBillingCommandException::currencyMismatch('firstChargeAmount', 'recurringAmount');
        }
    }
}
