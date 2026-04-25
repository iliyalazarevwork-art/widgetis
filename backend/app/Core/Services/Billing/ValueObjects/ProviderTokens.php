<?php

declare(strict_types=1);

namespace App\Core\Services\Billing\ValueObjects;

final readonly class ProviderTokens
{
    private function __construct(
        public ?string $providerSubscriptionId,
        public ?string $recurringToken,
    ) {
    }

    public static function empty(): self
    {
        return new self(null, null);
    }

    public static function of(?string $providerSubscriptionId, ?string $recurringToken): self
    {
        return new self($providerSubscriptionId, $recurringToken);
    }

    public function hasAny(): bool
    {
        return ($this->providerSubscriptionId !== null && $this->providerSubscriptionId !== '')
            || ($this->recurringToken !== null && $this->recurringToken !== '');
    }
}
