<?php

declare(strict_types=1);

namespace App\Core\Services\Billing\Commands;

use App\Core\Services\Billing\ValueObjects\CustomerProfile;
use App\Core\Services\Billing\ValueObjects\Money;
use App\Core\Services\Billing\ValueObjects\ProductLabel;
use App\Core\Services\Billing\ValueObjects\ProviderTokens;
use App\Exceptions\Billing\InvalidBillingCommandException;

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
