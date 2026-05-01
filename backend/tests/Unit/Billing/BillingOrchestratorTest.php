<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Core\Models\Order;
use App\Core\Models\Plan;
use App\Core\Models\Subscription;
use App\Core\Models\User;
use App\Core\Services\Billing\BillingOrchestrator;
use App\Core\Services\Billing\Commands\CancelSubscriptionCommand;
use App\Core\Services\Billing\Commands\ChargeCommand;
use App\Core\Services\Billing\Commands\StartSubscriptionCommand;
use App\Core\Services\Billing\Contracts\PaymentProviderInterface;
use App\Core\Services\Billing\Contracts\SupportsMerchantCharge;
use App\Core\Services\Billing\PaymentProviderRegistry;
use App\Core\Services\Billing\Results\CancellationResult;
use App\Core\Services\Billing\Results\ChargeResult;
use App\Core\Services\Billing\Results\CheckoutSession;
use App\Core\Services\Billing\SubscriptionService;
use App\Enums\BillingPeriod;
use App\Enums\PaymentProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class BillingOrchestratorTest extends TestCase
{
    use RefreshDatabase;

    public function test_start_subscription_checkout_builds_command_and_returns_checkout_session(): void
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->pro()->create(['trial_days' => 7]);
        $order = Order::factory()->for($user)->for($plan)->create([
            'billing_period' => BillingPeriod::Monthly->value,
            'payment_provider' => PaymentProvider::WayForPay,
        ]);

        $expectedSession = CheckoutSession::postForm(
            url: 'https://secure.wayforpay.com/pay',
            formFields: ['orderReference' => $order->order_number],
            providerReference: $order->order_number,
        );

        $adapter = Mockery::mock(PaymentProviderInterface::class);
        $adapter->shouldReceive('name')->andReturn(PaymentProvider::WayForPay);
        $adapter->shouldReceive('startSubscription')
            ->once()
            ->withArgs(fn (StartSubscriptionCommand $cmd) => $cmd->reference === $order->order_number
                && $cmd->trialDays === 7
                && $cmd->period === BillingPeriod::Monthly)
            ->andReturn($expectedSession);

        $registry = new PaymentProviderRegistry();
        $registry->register($adapter);

        $subscriptionService = Mockery::mock(SubscriptionService::class);
        $activation = Mockery::mock(SubscriptionActivationService::class);

        $orchestrator = new BillingOrchestrator($registry, $subscriptionService, $activation);

        config()->set('services.wayforpay.webhook_url', 'https://app.test/api/v1/payments/wayforpay/callback');
        config()->set('services.wayforpay.return_url', 'https://app.test/cabinet/plan');
        config()->set('services.wayforpay.trial_verify_amount', 1.0);

        $session = $orchestrator->startSubscriptionCheckout(
            user: $user,
            plan: $plan,
            period: BillingPeriod::Monthly,
            provider: PaymentProvider::WayForPay,
            reference: $order->order_number,
        );

        $this->assertSame($expectedSession, $session);
    }

    public function test_cancel_subscription_resolves_adapter_and_delegates_to_subscription_service(): void
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->pro()->create();
        $subscription = Subscription::factory()->for($user)->for($plan)->create([
            'payment_provider' => PaymentProvider::WayForPay,
            'wayforpay_rec_token' => 'REC-TOKEN-123',
        ]);

        $adapter = Mockery::mock(PaymentProviderInterface::class);
        $adapter->shouldReceive('name')->andReturn(PaymentProvider::WayForPay);
        $adapter->shouldReceive('cancelSubscription')
            ->once()
            ->withArgs(fn (CancelSubscriptionCommand $cmd) => $cmd->tokens->recurringToken === 'REC-TOKEN-123')
            ->andReturn(CancellationResult::cancelled());

        $registry = new PaymentProviderRegistry();
        $registry->register($adapter);

        $subscriptionService = Mockery::mock(SubscriptionService::class);
        $subscriptionService->shouldReceive('cancel')
            ->once()
            ->with($subscription, null)
            ->andReturn($subscription);

        $activation = Mockery::mock(SubscriptionActivationService::class);

        $orchestrator = new BillingOrchestrator($registry, $subscriptionService, $activation);

        $result = $orchestrator->cancelSubscription($subscription);

        $this->assertSame($subscription, $result);
    }

    public function test_charge_recurring_returns_self_managed_noop_for_non_merchant_charge_adapter(): void
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->pro()->create();
        $subscription = Subscription::factory()->for($user)->for($plan)->create([
            'payment_provider' => PaymentProvider::WayForPay,
            'billing_period' => BillingPeriod::Monthly->value,
            'wayforpay_rec_token' => 'REC-TOKEN',
        ]);

        // Adapter that does NOT implement SupportsMerchantCharge
        $adapter = Mockery::mock(PaymentProviderInterface::class);
        $adapter->shouldReceive('name')->andReturn(PaymentProvider::WayForPay);
        $adapter->shouldNotReceive('chargeSavedInstrument');

        $registry = new PaymentProviderRegistry();
        $registry->register($adapter);

        $subscriptionService = Mockery::mock(SubscriptionService::class);
        $activation = Mockery::mock(SubscriptionActivationService::class);

        $orchestrator = new BillingOrchestrator($registry, $subscriptionService, $activation);

        $result = $orchestrator->chargeRecurringIfSupported($subscription);

        $this->assertTrue($result->success);
        $this->assertSame('self-managed', $result->transactionId);
    }

    public function test_charge_recurring_calls_adapter_when_supports_merchant_charge(): void
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->pro()->create(['price_monthly' => 299]);
        $subscription = Subscription::factory()->for($user)->for($plan)->create([
            'payment_provider' => PaymentProvider::WayForPay,
            'billing_period' => BillingPeriod::Monthly->value,
            'wayforpay_rec_token' => 'REC-TOKEN-CHARGE',
        ]);

        $adapter = Mockery::mock(PaymentProviderInterface::class, SupportsMerchantCharge::class);
        $adapter->shouldReceive('name')->andReturn(PaymentProvider::WayForPay);
        $adapter->shouldReceive('chargeSavedInstrument')
            ->once()
            ->withArgs(fn (ChargeCommand $cmd) => $cmd->tokens->recurringToken === 'REC-TOKEN-CHARGE')
            ->andReturn(ChargeResult::ok('TXN-123'));

        $registry = new PaymentProviderRegistry();
        $registry->register($adapter);

        $subscriptionService = Mockery::mock(SubscriptionService::class);
        $activation = Mockery::mock(SubscriptionActivationService::class);

        $orchestrator = new BillingOrchestrator($registry, $subscriptionService, $activation);

        $result = $orchestrator->chargeRecurringIfSupported($subscription);

        $this->assertTrue($result->success);
        $this->assertSame('TXN-123', $result->transactionId);
    }
}
