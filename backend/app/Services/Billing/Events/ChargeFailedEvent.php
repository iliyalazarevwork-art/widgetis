<?php

declare(strict_types=1);

namespace App\Services\Billing\Events;

final readonly class ChargeFailedEvent extends PaymentEvent
{
    public function __construct(
        string $reference,
        public string $code,
        public string $message,
        public \DateTimeImmutable $attemptedAt,
    ) {
        parent::__construct($reference);
    }
}
