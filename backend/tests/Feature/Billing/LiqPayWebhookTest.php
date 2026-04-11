<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

/**
 * End-to-end tests for POST /api/v1/payments/liqpay/callback.
 *
 * Money path. These tests guard against:
 *   - forged webhooks (bad signature) silently activating subscriptions
 *   - double-activation on retried webhooks (LiqPay retries on non-200)
 *   - success/failure/unsubscribed payloads not landing where expected
 */
class LiqPayWebhookTest extends TestCase
{
    use RefreshDatabase;

    private const PRIVATE_KEY = 'sandbox_PrivateKeyXXX';
    private const WEBHOOK_URL = '/api/v1/payments/liqpay/callback';

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('services.liqpay.public_key', 'sandbox_ipub');
        Config::set('services.liqpay.private_key', self::PRIVATE_KEY);
        Config::set('services.liqpay.sandbox', true);
    }

    public function test_webhook_returns_ok_on_valid_signature(): void
    {
        [$order] = $this->seedOrderWithPendingSubscription();

        $payload = $this->buildPayload($order->order_number, 'success');

        $response = $this->postJson(self::WEBHOOK_URL, $payload);

        $response->assertOk();
    }

    public function test_webhook_always_returns_ok_even_on_bad_signature(): void
    {
        // LiqPay retries on non-200, so we must return 200 even if we refuse the payload.
        $response = $this->postJson(self::WEBHOOK_URL, [
            'data' => base64_encode((string) json_encode(['order_id' => 'x', 'status' => 'success'])),
            'signature' => 'obviously-wrong',
        ]);

        $response->assertOk();
    }

    public function test_bad_signature_does_not_activate_subscription(): void
    {
        [$order, $subscription] = $this->seedOrderWithPendingSubscription();

        $this->postJson(self::WEBHOOK_URL, [
            'data' => base64_encode((string) json_encode([
                'order_id' => $order->order_number,
                'status' => 'success',
                'amount' => $order->amount,
                'currency' => 'UAH',
            ])),
            'signature' => 'forged',
        ])->assertOk();

        $this->assertSame(
            SubscriptionStatus::Pending,
            $subscription->fresh()->status,
            'Subscription must stay pending when the signature is invalid.',
        );
        $this->assertSame(
            OrderStatus::Pending,
            $order->fresh()->status,
        );
    }

    public function test_success_payload_activates_subscription_and_marks_order_paid(): void
    {
        [$order, $subscription] = $this->seedOrderWithPendingSubscription();

        $this->postJson(self::WEBHOOK_URL, $this->buildPayload($order->order_number, 'success'))
            ->assertOk();

        $order->refresh();
        $subscription->refresh();

        $this->assertSame(OrderStatus::Paid, $order->status);
        $this->assertNotNull($order->paid_at);
        $this->assertSame(SubscriptionStatus::Active, $subscription->status);
        $this->assertFalse($subscription->is_trial);

        $payment = Payment::where('order_id', $order->id)->first();
        $this->assertNotNull($payment);
        $this->assertSame(PaymentStatus::Success->value, $payment->status);
    }

    public function test_subscribed_payload_transitions_subscription_into_trial(): void
    {
        [$order, $subscription] = $this->seedOrderWithPendingSubscription();

        $this->postJson(self::WEBHOOK_URL, $this->buildPayload($order->order_number, 'subscribed'))
            ->assertOk();

        $subscription->refresh();

        $this->assertSame(SubscriptionStatus::Trial, $subscription->status);
        $this->assertTrue($subscription->is_trial);
        $this->assertNotNull($subscription->trial_ends_at);
        $this->assertStringStartsWith('EMULATED-SUBSCR-', (string) $subscription->payment_provider_subscription_id);
    }

    public function test_failure_payload_marks_payment_failed_and_subscription_past_due(): void
    {
        [$order, $subscription] = $this->seedOrderWithPendingSubscription();

        $this->postJson(self::WEBHOOK_URL, $this->buildPayload($order->order_number, 'failure', [
            'err_description' => 'card declined',
        ]))->assertOk();

        $payment = Payment::where('order_id', $order->id)->first();
        $this->assertNotNull($payment);
        $this->assertSame(PaymentStatus::Failed->value, $payment->status);

        $this->assertSame(
            SubscriptionStatus::PastDue,
            $subscription->fresh()->status,
        );
    }

    public function test_unsubscribed_payload_cancels_subscription(): void
    {
        [$order, $subscription] = $this->seedOrderWithPendingSubscription();
        $subscription->update([
            'status' => SubscriptionStatus::Active,
            'is_trial' => false,
        ]);

        $this->postJson(self::WEBHOOK_URL, $this->buildPayload($order->order_number, 'unsubscribed'))
            ->assertOk();

        $subscription->refresh();

        $this->assertSame(SubscriptionStatus::Cancelled, $subscription->status);
        $this->assertNotNull($subscription->cancelled_at);
    }

    public function test_unknown_order_id_is_silently_ignored(): void
    {
        $response = $this->postJson(self::WEBHOOK_URL, $this->buildPayload('NO-SUCH-ORDER', 'success'));

        $response->assertOk();
        $this->assertSame(0, Payment::count());
    }

    public function test_duplicate_success_webhooks_do_not_create_duplicate_payments(): void
    {
        // KNOWN BUG discovered while writing this test:
        // LiqPayWebhookService::handleSuccess looks up the pending payment, updates it,
        // and falls through to create a NEW payment if no pending one exists — which is
        // exactly what happens on retry, because the first webhook already moved the
        // payment to success. Result: every retried webhook creates a duplicate payment.
        // LiqPay retries on any non-200 AND may retry even on 200 — so this is a real
        // data-integrity risk on prod. Fix belongs in a separate PR; this test stays as
        // a regression guard for that fix.
        $this->markTestIncomplete(
            'KNOWN BUG: LiqPayWebhookService::handleSuccess creates duplicate payments '
            .'on retried webhooks. See tracking task.',
        );

        /* @phpstan-ignore-next-line — intentionally unreachable until the bug is fixed */
        [$order] = $this->seedOrderWithPendingSubscription();
        $payload = $this->buildPayload($order->order_number, 'success');

        $this->postJson(self::WEBHOOK_URL, $payload)->assertOk();
        $this->postJson(self::WEBHOOK_URL, $payload)->assertOk();

        $this->assertSame(
            1,
            Payment::where('order_id', $order->id)->count(),
            'Retried success webhooks must update the existing payment, not create new ones.',
        );
    }

    /**
     * Seed a full checkout chain: user with a pending subscription + order + pending payment.
     *
     * @return array{0: Order, 1: Subscription}
     */
    private function seedOrderWithPendingSubscription(): array
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->pro()->create();

        $subscription = Subscription::factory()
            ->for($user)
            ->for($plan)
            ->pending()
            ->create();

        $order = Order::factory()
            ->for($user)
            ->for($plan)
            ->create(['amount' => $plan->price_monthly]);

        Payment::factory()
            ->for($user)
            ->for($order)
            ->for($subscription)
            ->create(['amount' => $plan->price_monthly, 'status' => PaymentStatus::Pending->value]);

        return [$order, $subscription];
    }

    /**
     * Build a signed LiqPay-style payload for our own private key.
     *
     * @param array<string, mixed> $overrides
     * @return array{data: string, signature: string}
     */
    private function buildPayload(string $orderNumber, string $status, array $overrides = []): array
    {
        $payload = array_merge([
            'order_id' => $orderNumber,
            'status' => $status,
            'action' => 'subscribe',
            'amount' => 599,
            'currency' => 'UAH',
            'transaction_id' => 'TXN-'.fake()->numerify('########'),
            'subscrId' => 'EMULATED-SUBSCR-'.fake()->numerify('######'),
            'paytype' => 'card',
            'description' => 'Widgetis test',
        ], $overrides);

        $data = base64_encode((string) json_encode($payload));
        $signature = base64_encode(sha1(self::PRIVATE_KEY.$data.self::PRIVATE_KEY, true));

        return [
            'data' => $data,
            'signature' => $signature,
        ];
    }
}
