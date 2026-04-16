<?php

declare(strict_types=1);

namespace App\Services\Billing\Results;

final readonly class ChargeResult
{
    private function __construct(
        public bool $success,
        public ?string $transactionId,
        public ?string $failureCode,
        public ?string $failureMessage,
    ) {
    }

    public static function ok(string $transactionId): self
    {
        return new self(true, $transactionId, null, null);
    }

    public static function fail(string $code, string $message): self
    {
        return new self(false, null, $code, $message);
    }
}
