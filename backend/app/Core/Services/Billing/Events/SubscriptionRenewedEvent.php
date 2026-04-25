<?php

declare(strict_types=1);

namespace App\Core\Services\Billing\Events;

use App\Core\Services\Billing\ValueObjects\Money;

final readonly class SubscriptionRenewedEvent extends PaymentEvent
{
    public function __construct(
        string $reference,
        public Money $paidAmount,
        public \DateTimeImmutable $paidAt,
        public string $transactionId,
    ) {
        parent::__construct($reference);
    }
}
