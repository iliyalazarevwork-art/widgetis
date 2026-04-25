<?php

declare(strict_types=1);

namespace App\Core\Services\Billing\Results;

final readonly class ChangePlanResult
{
    private function __construct(
        public bool $success,
        public ?string $newProviderSubscriptionId,
        public ?string $failureCode,
        public ?string $failureMessage,
    ) {
    }

    public static function ok(?string $newProviderSubId = null): self
    {
        return new self(true, $newProviderSubId, null, null);
    }

    public static function fail(string $code, string $message): self
    {
        return new self(false, null, $code, $message);
    }
}
