<?php

declare(strict_types=1);

namespace App\Core\Services\Billing\Results;

final readonly class RefundResult
{
    private function __construct(
        public bool $success,
        public ?string $refundId,
        public ?string $failureCode,
        public ?string $failureMessage,
    ) {
    }

    public static function ok(string $refundId): self
    {
        return new self(true, $refundId, null, null);
    }

    public static function fail(string $code, string $message): self
    {
        return new self(false, null, $code, $message);
    }
}
