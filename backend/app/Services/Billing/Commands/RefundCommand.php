<?php

declare(strict_types=1);

namespace App\Services\Billing\Commands;

use App\Exceptions\Billing\InvalidBillingCommandException;
use App\Services\Billing\ValueObjects\Money;

final readonly class RefundCommand
{
    public function __construct(
        public string $reference,
        public Money $amount,
        public string $reason,
    ) {
        if ($amount->isZero()) {
            throw InvalidBillingCommandException::zeroAmount('amount');
        }

        if (trim($reason) === '') {
            throw InvalidBillingCommandException::emptyReason();
        }
    }
}
