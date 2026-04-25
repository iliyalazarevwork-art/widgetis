<?php

declare(strict_types=1);

namespace App\Core\Services\Billing\Adapters;

final readonly class MonobankAdapterConfig
{
    public function __construct(
        public bool $hasToken,
        public string $webhookUrl,
        public string $redirectUrl,
    ) {
    }
}
