<?php

declare(strict_types=1);

use App\Enums\BillingPeriod;
use App\Exceptions\Billing\InvalidBillingCommandException;
use App\Services\Billing\Commands\ChangePlanCommand;
use App\Services\Billing\Commands\ChargeCommand;
use App\Services\Billing\Commands\RefundCommand;
use App\Services\Billing\Commands\StartSubscriptionCommand;
use App\Services\Billing\ValueObjects\CallbackUrls;
use App\Services\Billing\ValueObjects\Currency;
use App\Services\Billing\ValueObjects\CustomerProfile;
use App\Services\Billing\ValueObjects\Money;
use App\Services\Billing\ValueObjects\ProductLabel;
use App\Services\Billing\ValueObjects\ProviderTokens;

function makeCustomer(): CustomerProfile
{
    return CustomerProfile::of('test@test.com', '380501234567', 'Test', 'User', 'uk');
}

function makeLabel(): ProductLabel
{
    return ProductLabel::forSubscription('Pro', BillingPeriod::Monthly, 'new', 'uk');
}

function makeUrls(): CallbackUrls
{
    return new CallbackUrls('https://example.com/webhook', 'https://example.com/return');
}

// StartSubscriptionCommand
it('throws when trial days is negative', function (): void {
    expect(fn () => new StartSubscriptionCommand(
        reference: 'ref-001',
        firstChargeAmount: Money::fromMinor(100, Currency::UAH),
        recurringAmount: Money::fromMinor(79900, Currency::UAH),
        period: BillingPeriod::Monthly,
        trialDays: -1,
        customer: makeCustomer(),
        label: makeLabel(),
        urls: makeUrls(),
    ))->toThrow(InvalidBillingCommandException::class);
});

it('throws when first charge and recurring amounts have different currencies', function (): void {
    expect(fn () => new StartSubscriptionCommand(
        reference: 'ref-001',
        firstChargeAmount: Money::fromMinor(100, Currency::UAH),
        recurringAmount: Money::fromMinor(999, Currency::USD),
        period: BillingPeriod::Monthly,
        trialDays: 0,
        customer: makeCustomer(),
        label: makeLabel(),
        urls: makeUrls(),
    ))->toThrow(InvalidBillingCommandException::class);
});

it('creates start subscription command when data is valid', function (): void {
    $cmd = new StartSubscriptionCommand(
        reference: 'ref-001',
        firstChargeAmount: Money::fromMinor(100, Currency::UAH),
        recurringAmount: Money::fromMinor(79900, Currency::UAH),
        period: BillingPeriod::Monthly,
        trialDays: 7,
        customer: makeCustomer(),
        label: makeLabel(),
        urls: makeUrls(),
    );
    expect($cmd->reference)->toBe('ref-001');
    expect($cmd->trialDays)->toBe(7);
});

// RefundCommand
it('throws when refund amount is zero', function (): void {
    expect(fn () => new RefundCommand(
        reference: 'ref-001',
        amount: Money::zero(Currency::UAH),
        reason: 'Customer request',
    ))->toThrow(InvalidBillingCommandException::class);
});

it('throws when refund reason is empty', function (): void {
    expect(fn () => new RefundCommand(
        reference: 'ref-001',
        amount: Money::fromMinor(1000, Currency::UAH),
        reason: '   ',
    ))->toThrow(InvalidBillingCommandException::class);
});

// ChargeCommand
it('throws when charge amount is zero', function (): void {
    expect(fn () => new ChargeCommand(
        reference: 'ref-001',
        amount: Money::zero(Currency::UAH),
        tokens: ProviderTokens::of('sub_123', null),
        customer: makeCustomer(),
        label: makeLabel(),
    ))->toThrow(InvalidBillingCommandException::class);
});

it('throws when charge command has no tokens', function (): void {
    expect(fn () => new ChargeCommand(
        reference: 'ref-001',
        amount: Money::fromMinor(1000, Currency::UAH),
        tokens: ProviderTokens::empty(),
        customer: makeCustomer(),
        label: makeLabel(),
    ))->toThrow(InvalidBillingCommandException::class);
});

// ChangePlanCommand
it('throws when change plan command has no tokens', function (): void {
    expect(fn () => new ChangePlanCommand(
        reference: 'ref-001',
        tokens: ProviderTokens::empty(),
        newRecurringAmount: Money::fromMinor(79900, Currency::UAH),
        newPeriod: BillingPeriod::Monthly,
    ))->toThrow(InvalidBillingCommandException::class);
});

it('creates change plan command when tokens are present', function (): void {
    $cmd = new ChangePlanCommand(
        reference: 'ref-001',
        tokens: ProviderTokens::of('sub_123', null),
        newRecurringAmount: Money::fromMinor(99900, Currency::UAH),
        newPeriod: BillingPeriod::Yearly,
    );
    expect($cmd->reference)->toBe('ref-001');
    expect($cmd->newPeriod)->toBe(BillingPeriod::Yearly);
});
