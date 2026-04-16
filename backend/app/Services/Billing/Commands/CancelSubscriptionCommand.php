<?php

declare(strict_types=1);

namespace App\Services\Billing\Commands;

use App\Services\Billing\ValueObjects\ProviderTokens;

final readonly class CancelSubscriptionCommand
{
    public function __construct(
        public string $reference,
        public ProviderTokens $tokens,
    ) {
    }
}
