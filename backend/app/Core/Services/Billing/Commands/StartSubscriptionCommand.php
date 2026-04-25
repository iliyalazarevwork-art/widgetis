<?php

declare(strict_types=1);

namespace App\Core\Services\Billing\Commands;

use App\Core\Services\Billing\ValueObjects\CallbackUrls;
use App\Core\Services\Billing\ValueObjects\CustomerProfile;
use App\Core\Services\Billing\ValueObjects\Money;
use App\Core\Services\Billing\ValueObjects\ProductLabel;
use App\Enums\BillingPeriod;
use App\Exceptions\Billing\InvalidBillingCommandException;

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
