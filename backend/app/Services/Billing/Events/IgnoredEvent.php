<?php

declare(strict_types=1);

namespace App\Services\Billing\Events;

final readonly class IgnoredEvent extends PaymentEvent
{
    public function __construct(
        string $reference,
        public string $reason,
        public ?string $providerStatus,
    ) {
        parent::__construct($reference);
    }
}
