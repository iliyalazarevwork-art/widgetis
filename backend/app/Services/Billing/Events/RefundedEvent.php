<?php

declare(strict_types=1);

namespace App\Services\Billing\Events;

use App\Services\Billing\ValueObjects\Money;

final readonly class RefundedEvent extends PaymentEvent
{
    public function __construct(
        string $reference,
        public Money $amount,
        public \DateTimeImmutable $refundedAt,
    ) {
        parent::__construct($reference);
    }
}
