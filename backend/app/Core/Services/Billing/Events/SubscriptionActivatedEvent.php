<?php

declare(strict_types=1);

namespace App\Core\Services\Billing\Events;

use App\Core\Services\Billing\ValueObjects\Money;
use App\Core\Services\Billing\ValueObjects\ProviderTokens;

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
