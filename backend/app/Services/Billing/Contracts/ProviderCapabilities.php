<?php

declare(strict_types=1);

namespace App\Services\Billing\Contracts;

final readonly class ProviderCapabilities
{
    public function __construct(
        public bool $selfManagedRecurring,
        public bool $supportsPartialRefund,
        public bool $supportsTrial,
        public bool $supportsInPlacePlanChange,
        public int $webhookRetryWindowHours,
    ) {
    }
}
