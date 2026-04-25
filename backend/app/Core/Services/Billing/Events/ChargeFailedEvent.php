<?php

declare(strict_types=1);

namespace App\Core\Services\Billing\Events;

final readonly class ChargeFailedEvent extends PaymentEvent
{
    public function __construct(
        string $reference,
        public string $code,
        public string $message,
        public \DateTimeImmutable $attemptedAt,
        public ?string $transactionId = null,
        public ?string $providerSubscriptionId = null,
    ) {
        parent::__construct($reference);
    }
}
