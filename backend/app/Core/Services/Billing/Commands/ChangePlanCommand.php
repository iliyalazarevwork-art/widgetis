<?php

declare(strict_types=1);

namespace App\Core\Services\Billing\Commands;

use App\Core\Services\Billing\ValueObjects\Money;
use App\Core\Services\Billing\ValueObjects\ProviderTokens;
use App\Enums\BillingPeriod;
use App\Exceptions\Billing\InvalidBillingCommandException;

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
