<?php

declare(strict_types=1);

namespace App\Core\Services\Billing\Commands;

use App\Core\Services\Billing\ValueObjects\ProviderTokens;

final readonly class CancelSubscriptionCommand
{
    public function __construct(
        public string $reference,
        public ProviderTokens $tokens,
    ) {
    }
}
