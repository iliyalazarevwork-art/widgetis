<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Services\Billing\Events\ChargeFailedEvent;
use App\Services\Billing\Events\IgnoredEvent;
use App\Services\Billing\Events\InvalidSignatureEvent;
use App\Services\Billing\Events\RefundedEvent;
use App\Services\Billing\Events\SubscriptionActivatedEvent;
use App\Services\Billing\Events\SubscriptionCancelledEvent;
use App\Services\Billing\Events\SubscriptionRenewedEvent;
use App\Services\Billing\ValueObjects\Currency;
use App\Services\Billing\ValueObjects\Money;
use App\Services\Billing\ValueObjects\ProviderTokens;
use DateTimeImmutable;
use Tests\TestCase;

final class PaymentEventTest extends TestCase
{
    public function test_invalid_signature_event_has_empty_reference(): void
    {
        $event = new InvalidSignatureEvent();
        $this->assertSame('', $event->reference);
    }

    public function test_ignored_event_exposes_reference_and_reason(): void
    {
        $event = new IgnoredEvent('ref-001', 'unknown status', 'PENDING');
        $this->assertSame('ref-001', $event->reference);
        $this->assertSame('unknown status', $event->reason);
        $this->assertSame('PENDING', $event->providerStatus);
    }

    public function test_ignored_event_allows_null_provider_status(): void
    {
        $event = new IgnoredEvent('ref-001', 'no status', null);
        $this->assertNull($event->providerStatus);
    }

    public function test_subscription_activated_event_exposes_all_properties(): void
    {
        $tokens = ProviderTokens::of('sub_123', 'tok_abc');
        $amount = Money::fromMinor(100, Currency::UAH);
        $paidAt = new DateTimeImmutable('2025-01-15 10:00:00');

        $event = new SubscriptionActivatedEvent('ref-001', $tokens, $amount, $paidAt, 'txn_001');

        $this->assertSame('ref-001', $event->reference);
        $this->assertSame($tokens, $event->tokens);
        $this->assertSame($amount, $event->paidAmount);
        $this->assertSame($paidAt, $event->paidAt);
        $this->assertSame('txn_001', $event->transactionId);
    }

    public function test_subscription_activated_event_allows_null_transaction_id(): void
    {
        $event = new SubscriptionActivatedEvent(
            'ref-001',
            ProviderTokens::empty(),
            Money::fromMinor(100, Currency::UAH),
            new DateTimeImmutable(),
            null,
        );
        $this->assertNull($event->transactionId);
    }

    public function test_subscription_renewed_event_exposes_all_properties(): void
    {
        $amount = Money::fromMinor(79900, Currency::UAH);
        $paidAt = new DateTimeImmutable('2025-02-15');

        $event = new SubscriptionRenewedEvent('ref-002', $amount, $paidAt, 'txn_002');

        $this->assertSame('ref-002', $event->reference);
        $this->assertSame($amount, $event->paidAmount);
        $this->assertSame('txn_002', $event->transactionId);
    }

    public function test_subscription_cancelled_event_exposes_reference_and_cancelled_at(): void
    {
        $cancelledAt = new DateTimeImmutable('2025-03-01');
        $event = new SubscriptionCancelledEvent('ref-003', $cancelledAt);

        $this->assertSame('ref-003', $event->reference);
        $this->assertSame($cancelledAt, $event->cancelledAt);
    }

    public function test_charge_failed_event_exposes_code_message_and_attempted_at(): void
    {
        $attemptedAt = new DateTimeImmutable('2025-04-01');
        $event = new ChargeFailedEvent('ref-004', 'INSUFFICIENT_FUNDS', 'Not enough balance', $attemptedAt);

        $this->assertSame('ref-004', $event->reference);
        $this->assertSame('INSUFFICIENT_FUNDS', $event->code);
        $this->assertSame('Not enough balance', $event->message);
        $this->assertSame($attemptedAt, $event->attemptedAt);
    }

    public function test_refunded_event_exposes_amount_and_refunded_at(): void
    {
        $amount = Money::fromMinor(5000, Currency::UAH);
        $refundedAt = new DateTimeImmutable('2025-04-05');
        $event = new RefundedEvent('ref-005', $amount, $refundedAt);

        $this->assertSame('ref-005', $event->reference);
        $this->assertSame($amount, $event->amount);
        $this->assertSame($refundedAt, $event->refundedAt);
    }
}
