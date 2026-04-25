<?php

declare(strict_types=1);

namespace App\Core\Services\Billing\Events;

final readonly class SubscriptionCancelledEvent extends PaymentEvent
{
    public function __construct(
        string $reference,
        public \DateTimeImmutable $cancelledAt,
    ) {
        parent::__construct($reference);
    }
}
