<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Enums\BillingPeriod;
use App\Enums\OrderStatus;
use App\Enums\PaymentProvider;
use App\Enums\SubscriptionStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Billing\Contracts\PaymentProviderInterfaceV2;
use App\Services\Billing\Events\ChargeFailedEvent;
use App\Services\Billing\Events\IgnoredEvent;
use App\Services\Billing\Events\InvalidSignatureEvent;
use App\Services\Billing\Events\RefundedEvent;
use App\Services\Billing\Events\SubscriptionActivatedEvent;
use App\Services\Billing\Events\SubscriptionCancelledEvent;
use App\Services\Billing\Events\SubscriptionRenewedEvent;
use App\Services\Billing\PaymentFailureHandler;
use App\Services\Billing\PaymentProviderRegistryV2;
use App\Services\Billing\SubscriptionActivationService;
use App\Services\Billing\SubscriptionService;
use App\Services\Billing\ValueObjects\Currency;
use App\Services\Billing\ValueObjects\Money;
use App\Services\Billing\ValueObjects\ProviderTokens;
use App\Services\Billing\WayForPayService;
use App\Services\Billing\WebhookDispatcher;
use App\Services\Billing\Webhooks\InboundWebhook;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class WebhookDispatcherTest extends TestCase
{
    use RefreshDatabase;

    // ─── Helpers ────────────────────────────────────────────────────────

    private function makeInbound(): InboundWebhook
    {
        return InboundWebhook::fromRaw('{}', [], '127.0.0.1');
    }

    private function makeDispatcher(
        PaymentProviderInterfaceV2 $adapter,
        ?SubscriptionService $subscriptionService = null,
        ?SubscriptionActivationService $activationService = null,
        ?PaymentFailureHandler $failureHandler = null,
    ): WebhookDispatcher {
        $registry = new PaymentProviderRegistryV2();
        $registry->register($adapter);

        return new WebhookDispatcher(
            registry: $registry,
            subscriptionService: $subscriptionService ?? $this->app->make(SubscriptionService::class),
            activationService: $activationService ?? $this->app->make(SubscriptionActivationService::class),
            failureHandler: $failureHandler ?? $this->app->make(PaymentFailureHandler::class),
            wayForPayService: $this->app->make(WayForPayService::class),
        );
    }

    private function adapterReturning(PaymentProviderInterfaceV2 $adapter, mixed $event): void
    {
        $adapter->allows('parseWebhook')->andReturn($event);
    }

    // ─── InvalidSignatureEvent ──────────────────────────────────────────

    public function test_invalid_signature_event_returns_outcome_with_signature_valid_false(): void
    {
        $adapter = Mockery::mock(PaymentProviderInterfaceV2::class);
        $adapter->allows('name')->andReturn(PaymentProvider::WayForPay);
        $this->adapterReturning($adapter, new InvalidSignatureEvent());

        $dispatcher = $this->makeDispatcher($adapter);
        $outcome = $dispatcher->dispatch(PaymentProvider::WayForPay, $this->makeInbound());

        $this->assertFalse($outcome->signatureValid);
        $this->assertFalse($outcome->processed);
        $this->assertNull($outcome->reference);
        $this->assertSame('invalid_signature', $outcome->event);
    }

    // ─── IgnoredEvent ───────────────────────────────────────────────────

    public function test_ignored_event_returns_valid_signature_not_processed(): void
    {
        $adapter = Mockery::mock(PaymentProviderInterfaceV2::class);
        $adapter->allows('name')->andReturn(PaymentProvider::WayForPay);
        $this->adapterReturning($adapter, new IgnoredEvent('REF-123', 'InProcessing', 'InProcessing'));

        $dispatcher = $this->makeDispatcher($adapter);
        $outcome = $dispatcher->dispatch(PaymentProvider::WayForPay, $this->makeInbound());

        $this->assertTrue($outcome->signatureValid);
        $this->assertFalse($outcome->processed);
        $this->assertSame('REF-123', $outcome->reference);
        $this->assertSame('ignored', $outcome->event);
    }

    // ─── SubscriptionActivatedEvent ─────────────────────────────────────

    public function test_subscription_activated_event_activates_wfp_trial(): void
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->pro()->create(['trial_days' => 7]);
        $subscription = Subscription::factory()->for($user)->for($plan)->create([
            'payment_provider' => PaymentProvider::WayForPay,
            'billing_period' => BillingPeriod::Monthly->value,
            'status' => SubscriptionStatus::Pending,
            'wayforpay_rec_token' => null,
        ]);
        $order = Order::factory()->for($user)->for($plan)->create([
            'payment_provider' => PaymentProvider::WayForPay,
            'status' => OrderStatus::Pending,
        ]);
        Payment::factory()->for($user)->for($order)->for($subscription)->create([
            'status' => 'pending',
        ]);

        $event = new SubscriptionActivatedEvent(
            reference: $order->order_number,
            tokens: ProviderTokens::of('AUTH-123', 'REC-TOKEN-XYZ'),
            paidAmount: Money::fromMajor(1.0, Currency::UAH),
            paidAt: new \DateTimeImmutable(),
            transactionId: 'AUTH-123',
        );

        $adapter = Mockery::mock(PaymentProviderInterfaceV2::class);
        $adapter->allows('name')->andReturn(PaymentProvider::WayForPay);
        $this->adapterReturning($adapter, $event);

        $dispatcher = $this->makeDispatcher($adapter);
        $outcome = $dispatcher->dispatch(PaymentProvider::WayForPay, $this->makeInbound());

        $this->assertTrue($outcome->signatureValid);
        $this->assertTrue($outcome->processed);
        $this->assertSame($order->order_number, $outcome->reference);
        $this->assertSame('activated', $outcome->event);

        $subscription->refresh();
        $this->assertSame(SubscriptionStatus::Trial, $subscription->status);
        $this->assertSame('REC-TOKEN-XYZ', $subscription->wayforpay_rec_token);
    }

    public function test_subscription_activated_event_for_unknown_order_returns_not_processed(): void
    {
        $event = new SubscriptionActivatedEvent(
            reference: 'UNKNOWN-REF',
            tokens: ProviderTokens::of('SUB-ID', null),
            paidAmount: Money::fromMajor(100.0, Currency::UAH),
            paidAt: new \DateTimeImmutable(),
            transactionId: 'TXN-999',
        );

        $adapter = Mockery::mock(PaymentProviderInterfaceV2::class);
        $adapter->allows('name')->andReturn(PaymentProvider::Monobank);
        $this->adapterReturning($adapter, $event);

        $dispatcher = $this->makeDispatcher($adapter);
        $outcome = $dispatcher->dispatch(PaymentProvider::Monobank, $this->makeInbound());

        $this->assertTrue($outcome->signatureValid);
        $this->assertFalse($outcome->processed);
        $this->assertSame('activation_order_not_found', $outcome->event);
    }

    // ─── SubscriptionRenewedEvent ────────────────────────────────────────

    public function test_subscription_renewed_event_extends_period(): void
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->pro()->create();
        $subscription = Subscription::factory()->for($user)->for($plan)->create([
            'payment_provider' => PaymentProvider::WayForPay,
            'billing_period' => BillingPeriod::Monthly->value,
            'status' => SubscriptionStatus::Active,
        ]);
        $order = Order::factory()->for($user)->for($plan)->create([
            'payment_provider' => PaymentProvider::WayForPay,
            'status' => OrderStatus::Pending,
        ]);
        Payment::factory()->for($user)->for($order)->for($subscription)->create([
            'status' => 'pending',
        ]);

        $event = new SubscriptionRenewedEvent(
            reference: $order->order_number,
            paidAmount: Money::fromMajor(299.0, Currency::UAH),
            paidAt: new \DateTimeImmutable(),
            transactionId: 'TXN-RENEWAL',
        );

        $adapter = Mockery::mock(PaymentProviderInterfaceV2::class);
        $adapter->allows('name')->andReturn(PaymentProvider::WayForPay);
        $this->adapterReturning($adapter, $event);

        $dispatcher = $this->makeDispatcher($adapter);
        $outcome = $dispatcher->dispatch(PaymentProvider::WayForPay, $this->makeInbound());

        $this->assertTrue($outcome->signatureValid);
        $this->assertTrue($outcome->processed);
        $this->assertSame('renewed', $outcome->event);

        $subscription->refresh();
        $this->assertSame(SubscriptionStatus::Active, $subscription->status);
    }

    // ─── SubscriptionCancelledEvent ──────────────────────────────────────

    public function test_subscription_cancelled_event_cancels_subscription(): void
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->pro()->create();
        $subscription = Subscription::factory()->for($user)->for($plan)->create([
            'payment_provider' => PaymentProvider::WayForPay,
            'billing_period' => BillingPeriod::Monthly->value,
            'status' => SubscriptionStatus::Active,
        ]);
        $order = Order::factory()->for($user)->for($plan)->create([
            'payment_provider' => PaymentProvider::WayForPay,
            'status' => OrderStatus::Paid,
        ]);

        $event = new SubscriptionCancelledEvent(
            reference: $order->order_number,
            cancelledAt: new \DateTimeImmutable(),
        );

        $adapter = Mockery::mock(PaymentProviderInterfaceV2::class);
        $adapter->allows('name')->andReturn(PaymentProvider::WayForPay);
        $this->adapterReturning($adapter, $event);

        $dispatcher = $this->makeDispatcher($adapter);
        $outcome = $dispatcher->dispatch(PaymentProvider::WayForPay, $this->makeInbound());

        $this->assertTrue($outcome->signatureValid);
        $this->assertTrue($outcome->processed);
        $this->assertSame('cancelled', $outcome->event);

        $subscription->refresh();
        $this->assertSame(SubscriptionStatus::Cancelled, $subscription->status);
    }

    // ─── ChargeFailedEvent ───────────────────────────────────────────────

    public function test_charge_failed_event_marks_order_failed_and_subscription_past_due(): void
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->pro()->create();
        $subscription = Subscription::factory()->for($user)->for($plan)->create([
            'payment_provider' => PaymentProvider::WayForPay,
            'billing_period' => BillingPeriod::Monthly->value,
            'status' => SubscriptionStatus::Active,
        ]);
        $order = Order::factory()->for($user)->for($plan)->create([
            'payment_provider' => PaymentProvider::WayForPay,
            'status' => OrderStatus::Pending,
        ]);

        $event = new ChargeFailedEvent(
            reference: $order->order_number,
            code: '1120',
            message: 'Declined',
            attemptedAt: new \DateTimeImmutable(),
        );

        $adapter = Mockery::mock(PaymentProviderInterfaceV2::class);
        $adapter->allows('name')->andReturn(PaymentProvider::WayForPay);
        $this->adapterReturning($adapter, $event);

        $dispatcher = $this->makeDispatcher($adapter);
        $outcome = $dispatcher->dispatch(PaymentProvider::WayForPay, $this->makeInbound());

        $this->assertTrue($outcome->signatureValid);
        $this->assertTrue($outcome->processed);
        $this->assertSame('charge_failed', $outcome->event);

        $order->refresh();
        $this->assertSame(OrderStatus::Failed, $order->status);

        $subscription->refresh();
        $this->assertSame(SubscriptionStatus::PastDue, $subscription->status);
    }

    // ─── RefundedEvent ───────────────────────────────────────────────────

    public function test_refunded_event_marks_order_refunded_and_creates_payment(): void
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->pro()->create();
        $subscription = Subscription::factory()->for($user)->for($plan)->create([
            'payment_provider' => PaymentProvider::WayForPay,
            'billing_period' => BillingPeriod::Monthly->value,
            'status' => SubscriptionStatus::Active,
        ]);
        $order = Order::factory()->for($user)->for($plan)->create([
            'payment_provider' => PaymentProvider::WayForPay,
            'status' => OrderStatus::Paid,
        ]);

        $event = new RefundedEvent(
            reference: $order->order_number,
            amount: Money::fromMajor(299.0, Currency::UAH),
            refundedAt: new \DateTimeImmutable(),
        );

        $adapter = Mockery::mock(PaymentProviderInterfaceV2::class);
        $adapter->allows('name')->andReturn(PaymentProvider::WayForPay);
        $this->adapterReturning($adapter, $event);

        $dispatcher = $this->makeDispatcher($adapter);
        $outcome = $dispatcher->dispatch(PaymentProvider::WayForPay, $this->makeInbound());

        $this->assertTrue($outcome->signatureValid);
        $this->assertTrue($outcome->processed);
        $this->assertSame('refunded', $outcome->event);

        $order->refresh();
        $this->assertSame(OrderStatus::Refunded, $order->status);

        $refundPayment = Payment::where('order_id', $order->id)
            ->where('type', 'refund')
            ->first();
        $this->assertNotNull($refundPayment);
        $this->assertTrue((float) $refundPayment->amount < 0);

        $subscription->refresh();
        $this->assertSame(SubscriptionStatus::Cancelled, $subscription->status);
    }

    public function test_refunded_event_does_not_cancel_trial_subscription(): void
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->pro()->create();
        $subscription = Subscription::factory()->for($user)->for($plan)->create([
            'payment_provider' => PaymentProvider::WayForPay,
            'billing_period' => BillingPeriod::Monthly->value,
            'status' => SubscriptionStatus::Trial,
        ]);
        $order = Order::factory()->for($user)->for($plan)->create([
            'payment_provider' => PaymentProvider::WayForPay,
            'status' => OrderStatus::Paid,
        ]);

        $event = new RefundedEvent(
            reference: $order->order_number,
            amount: Money::fromMajor(1.0, Currency::UAH),
            refundedAt: new \DateTimeImmutable(),
        );

        $adapter = Mockery::mock(PaymentProviderInterfaceV2::class);
        $adapter->allows('name')->andReturn(PaymentProvider::WayForPay);
        $this->adapterReturning($adapter, $event);

        $dispatcher = $this->makeDispatcher($adapter);
        $dispatcher->dispatch(PaymentProvider::WayForPay, $this->makeInbound());

        $subscription->refresh();
        // Trial subscription must NOT be cancelled by a refund
        $this->assertSame(SubscriptionStatus::Trial, $subscription->status);
        $this->assertNull($subscription->cancelled_at);
    }
}
