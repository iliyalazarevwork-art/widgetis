<?php

declare(strict_types=1);

namespace App\Core\Services\Billing\Commands;

use App\Core\Services\Billing\ValueObjects\Money;
use App\Exceptions\Billing\InvalidBillingCommandException;

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
