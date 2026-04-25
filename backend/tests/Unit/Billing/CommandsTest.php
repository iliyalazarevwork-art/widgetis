<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Core\Services\Billing\Commands\ChangePlanCommand;
use App\Core\Services\Billing\Commands\ChargeCommand;
use App\Core\Services\Billing\Commands\RefundCommand;
use App\Core\Services\Billing\Commands\StartSubscriptionCommand;
use App\Core\Services\Billing\ValueObjects\CallbackUrls;
use App\Core\Services\Billing\ValueObjects\Currency;
use App\Core\Services\Billing\ValueObjects\CustomerProfile;
use App\Core\Services\Billing\ValueObjects\Money;
use App\Core\Services\Billing\ValueObjects\ProductLabel;
use App\Core\Services\Billing\ValueObjects\ProviderTokens;
use App\Enums\BillingPeriod;
use App\Exceptions\Billing\InvalidBillingCommandException;
use Tests\TestCase;

final class CommandsTest extends TestCase
{
    private function makeCustomer(): CustomerProfile
    {
        return CustomerProfile::of('test@test.com', '380501234567', 'Test', 'User', 'uk');
    }

    private function makeLabel(): ProductLabel
    {
        return ProductLabel::forSubscription('Pro', BillingPeriod::Monthly, 'new', 'uk');
    }

    private function makeUrls(): CallbackUrls
    {
        return new CallbackUrls('https://example.com/webhook', 'https://example.com/return');
    }

    // StartSubscriptionCommand

    public function test_throws_when_trial_days_is_negative(): void
    {
        $this->expectException(InvalidBillingCommandException::class);
        new StartSubscriptionCommand(
            reference: 'ref-001',
            firstChargeAmount: Money::fromMinor(100, Currency::UAH),
            recurringAmount: Money::fromMinor(79900, Currency::UAH),
            period: BillingPeriod::Monthly,
            trialDays: -1,
            customer: $this->makeCustomer(),
            label: $this->makeLabel(),
            urls: $this->makeUrls(),
        );
    }

    public function test_throws_when_first_charge_and_recurring_amounts_have_different_currencies(): void
    {
        $this->expectException(InvalidBillingCommandException::class);
        new StartSubscriptionCommand(
            reference: 'ref-001',
            firstChargeAmount: Money::fromMinor(100, Currency::UAH),
            recurringAmount: Money::fromMinor(999, Currency::USD),
            period: BillingPeriod::Monthly,
            trialDays: 0,
            customer: $this->makeCustomer(),
            label: $this->makeLabel(),
            urls: $this->makeUrls(),
        );
    }

    public function test_creates_start_subscription_command_when_data_is_valid(): void
    {
        $cmd = new StartSubscriptionCommand(
            reference: 'ref-001',
            firstChargeAmount: Money::fromMinor(100, Currency::UAH),
            recurringAmount: Money::fromMinor(79900, Currency::UAH),
            period: BillingPeriod::Monthly,
            trialDays: 7,
            customer: $this->makeCustomer(),
            label: $this->makeLabel(),
            urls: $this->makeUrls(),
        );
        $this->assertSame('ref-001', $cmd->reference);
        $this->assertSame(7, $cmd->trialDays);
    }

    // RefundCommand

    public function test_throws_when_refund_amount_is_zero(): void
    {
        $this->expectException(InvalidBillingCommandException::class);
        new RefundCommand(
            reference: 'ref-001',
            amount: Money::zero(Currency::UAH),
            reason: 'Customer request',
        );
    }

    public function test_throws_when_refund_reason_is_empty(): void
    {
        $this->expectException(InvalidBillingCommandException::class);
        new RefundCommand(
            reference: 'ref-001',
            amount: Money::fromMinor(1000, Currency::UAH),
            reason: '   ',
        );
    }

    // ChargeCommand

    public function test_throws_when_charge_amount_is_zero(): void
    {
        $this->expectException(InvalidBillingCommandException::class);
        new ChargeCommand(
            reference: 'ref-001',
            amount: Money::zero(Currency::UAH),
            tokens: ProviderTokens::of('sub_123', null),
            customer: $this->makeCustomer(),
            label: $this->makeLabel(),
        );
    }

    public function test_throws_when_charge_command_has_no_tokens(): void
    {
        $this->expectException(InvalidBillingCommandException::class);
        new ChargeCommand(
            reference: 'ref-001',
            amount: Money::fromMinor(1000, Currency::UAH),
            tokens: ProviderTokens::empty(),
            customer: $this->makeCustomer(),
            label: $this->makeLabel(),
        );
    }

    // ChangePlanCommand

    public function test_throws_when_change_plan_command_has_no_tokens(): void
    {
        $this->expectException(InvalidBillingCommandException::class);
        new ChangePlanCommand(
            reference: 'ref-001',
            tokens: ProviderTokens::empty(),
            newRecurringAmount: Money::fromMinor(79900, Currency::UAH),
            newPeriod: BillingPeriod::Monthly,
        );
    }

    public function test_creates_change_plan_command_when_tokens_are_present(): void
    {
        $cmd = new ChangePlanCommand(
            reference: 'ref-001',
            tokens: ProviderTokens::of('sub_123', null),
            newRecurringAmount: Money::fromMinor(99900, Currency::UAH),
            newPeriod: BillingPeriod::Yearly,
        );
        $this->assertSame('ref-001', $cmd->reference);
        $this->assertSame(BillingPeriod::Yearly, $cmd->newPeriod);
    }
}
