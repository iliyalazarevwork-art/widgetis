<?php

declare(strict_types=1);

namespace App\Services\Billing\Events;

abstract readonly class PaymentEvent
{
    protected function __construct(
        public string $reference,
    ) {
    }
}
