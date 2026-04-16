<?php

declare(strict_types=1);

namespace App\Services\Billing\Results;

final readonly class CancellationResult
{
    private function __construct(
        public CancellationOutcome $outcome,
        public ?string $providerMessage,
    ) {
    }

    public static function cancelled(?string $msg = null): self
    {
        return new self(CancellationOutcome::Cancelled, $msg);
    }

    public static function alreadyInactive(?string $msg = null): self
    {
        return new self(CancellationOutcome::AlreadyInactive, $msg);
    }

    public static function failed(string $msg): self
    {
        return new self(CancellationOutcome::Failed, $msg);
    }
}
