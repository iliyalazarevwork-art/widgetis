<?php

declare(strict_types=1);

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

it('invalid signature event has empty reference', function (): void {
    $event = new InvalidSignatureEvent();
    expect($event->reference)->toBe('');
});

it('ignored event exposes reference and reason', function (): void {
    $event = new IgnoredEvent('ref-001', 'unknown status', 'PENDING');
    expect($event->reference)->toBe('ref-001');
    expect($event->reason)->toBe('unknown status');
    expect($event->providerStatus)->toBe('PENDING');
});

it('ignored event allows null provider status', function (): void {
    $event = new IgnoredEvent('ref-001', 'no status', null);
    expect($event->providerStatus)->toBeNull();
});

it('subscription activated event exposes all properties', function (): void {
    $tokens = ProviderTokens::of('sub_123', 'tok_abc');
    $amount = Money::fromMinor(100, Currency::UAH);
    $paidAt = new DateTimeImmutable('2025-01-15 10:00:00');

    $event = new SubscriptionActivatedEvent('ref-001', $tokens, $amount, $paidAt, 'txn_001');

    expect($event->reference)->toBe('ref-001');
    expect($event->tokens)->toBe($tokens);
    expect($event->paidAmount)->toBe($amount);
    expect($event->paidAt)->toBe($paidAt);
    expect($event->transactionId)->toBe('txn_001');
});

it('subscription activated event allows null transaction id', function (): void {
    $event = new SubscriptionActivatedEvent(
        'ref-001',
        ProviderTokens::empty(),
        Money::fromMinor(100, Currency::UAH),
        new DateTimeImmutable(),
        null,
    );
    expect($event->transactionId)->toBeNull();
});

it('subscription renewed event exposes all properties', function (): void {
    $amount = Money::fromMinor(79900, Currency::UAH);
    $paidAt = new DateTimeImmutable('2025-02-15');

    $event = new SubscriptionRenewedEvent('ref-002', $amount, $paidAt, 'txn_002');

    expect($event->reference)->toBe('ref-002');
    expect($event->paidAmount)->toBe($amount);
    expect($event->transactionId)->toBe('txn_002');
});

it('subscription cancelled event exposes reference and cancelled at', function (): void {
    $cancelledAt = new DateTimeImmutable('2025-03-01');
    $event = new SubscriptionCancelledEvent('ref-003', $cancelledAt);

    expect($event->reference)->toBe('ref-003');
    expect($event->cancelledAt)->toBe($cancelledAt);
});

it('charge failed event exposes code, message and attempted at', function (): void {
    $attemptedAt = new DateTimeImmutable('2025-04-01');
    $event = new ChargeFailedEvent('ref-004', 'INSUFFICIENT_FUNDS', 'Not enough balance', $attemptedAt);

    expect($event->reference)->toBe('ref-004');
    expect($event->code)->toBe('INSUFFICIENT_FUNDS');
    expect($event->message)->toBe('Not enough balance');
    expect($event->attemptedAt)->toBe($attemptedAt);
});

it('refunded event exposes amount and refunded at', function (): void {
    $amount = Money::fromMinor(5000, Currency::UAH);
    $refundedAt = new DateTimeImmutable('2025-04-05');
    $event = new RefundedEvent('ref-005', $amount, $refundedAt);

    expect($event->reference)->toBe('ref-005');
    expect($event->amount)->toBe($amount);
    expect($event->refundedAt)->toBe($refundedAt);
});
