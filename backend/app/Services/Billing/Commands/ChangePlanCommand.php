<?php

declare(strict_types=1);

namespace App\Services\Billing\Commands;

use App\Enums\BillingPeriod;
use App\Exceptions\Billing\InvalidBillingCommandException;
use App\Services\Billing\ValueObjects\Money;
use App\Services\Billing\ValueObjects\ProviderTokens;

final readonly class ChangePlanCommand
{
    public function __construct(
        public string $reference,
        public ProviderTokens $tokens,
        public Money $newRecurringAmount,
        public BillingPeriod $newPeriod,
    ) {
        if (! $tokens->hasAny()) {
            throw InvalidBillingCommandException::missingTokens();
        }
    }
}
