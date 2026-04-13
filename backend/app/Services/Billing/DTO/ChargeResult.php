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

    public static function fail(string $code, string $message): self
    {
        return new self(false, null, $code, $message);
    }
}
