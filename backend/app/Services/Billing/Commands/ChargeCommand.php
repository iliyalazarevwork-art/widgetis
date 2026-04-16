<?php

declare(strict_types=1);

namespace App\Services\Billing\Commands;

use App\Exceptions\Billing\InvalidBillingCommandException;
use App\Services\Billing\ValueObjects\CustomerProfile;
use App\Services\Billing\ValueObjects\Money;
use App\Services\Billing\ValueObjects\ProductLabel;
use App\Services\Billing\ValueObjects\ProviderTokens;

final readonly class ChargeCommand
{
    public function __construct(
        public string $reference,
        public Money $amount,
        public ProviderTokens $tokens,
        public CustomerProfile $customer,
        public ProductLabel $label,
    ) {
        if ($amount->isZero()) {
            throw InvalidBillingCommandException::zeroAmount('amount');
        }

        if (! $tokens->hasAny()) {
            throw InvalidBillingCommandException::missingTokens();
        }
    }
}
