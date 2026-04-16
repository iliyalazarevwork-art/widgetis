<?php

declare(strict_types=1);

namespace App\Exceptions\Billing;

final class InvalidBillingCommandException extends \DomainException
{
    public static function negativeTrialDays(int $days): self
    {
        return new self("Trial days must be >= 0, got {$days}.");
    }

    public static function currencyMismatch(string $fieldA, string $fieldB): self
    {
        return new self("Currency of {$fieldA} and {$fieldB} must match.");
    }

    public static function zeroAmount(string $field): self
    {
        return new self("Amount for {$field} must be non-zero.");
    }

    public static function emptyReason(): self
    {
        return new self('Refund reason must not be empty.');
    }

    public static function missingTokens(): self
    {
        return new self('ProviderTokens must have at least one non-empty token for this command.');
    }
}
