<?php

declare(strict_types=1);

namespace App\Services\Billing\Events;

use App\Services\Billing\ValueObjects\Money;
use App\Services\Billing\ValueObjects\ProviderTokens;

final readonly class SubscriptionActivatedEvent extends PaymentEvent
{
    public function __construct(
        string $reference,
        public ProviderTokens $tokens,
        public Money $paidAmount,
        public \DateTimeImmutable $paidAt,
        public ?string $transactionId,
    ) {
        parent::__construct($reference);
    }
}
