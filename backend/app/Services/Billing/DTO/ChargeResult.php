<?php

declare(strict_types=1);

namespace App\Services\Billing\DTO;

/**
 * Result of a recurring charge attempt on a saved payment instrument.
 */
final readonly class ChargeResult
{
    public function __construct(
        public bool $success,
        public ?string $transactionId = null,
        public ?string $failureCode = null,
        public ?string $failureMessage = null,
    ) {
    }

    public static function ok(string $transactionId): self
    {
        return new self(true, $transactionId);
    }

    /**
     * Success result for providers that schedule recurring charges on
     * their own and therefore never return a transaction id
     * to the caller at charge-time.
     */
    public static function noop(): self
    {
        return new self(true);
    }

    public static function fail(string $code, string $message): self
    {
        return new self(false, null, $code, $message);
    }
}
