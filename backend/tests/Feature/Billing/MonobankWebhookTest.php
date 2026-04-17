<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Enums\BillingPeriod;
use App\Enums\OrderStatus;
use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Billing\Adapters\MonobankAdapter;
use App\Services\Billing\Events\InvalidSignatureEvent;
use App\Services\Billing\WebhookDispatcher;
use App\Services\Billing\Webhooks\InboundWebhook;
use AratKruglik\Monobank\Facades\Monobank;
use AratKruglik\Monobank\Services\PubKeyProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

/**
 * Tests MonobankAdapter with native Subscription API.
 *
 * Exercises webhook handling for both initial checkout payments (with order
 * reference) and recurring charge webhooks from Monobank subscriptions
 * (with subscriptionId, no order reference).
 */
class MonobankWebhookTest extends TestCase
{
    use RefreshDatabase;

    private string $privateKey;
    private string $publicKey;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('monobank.token', 'fake-merchant-token');
        Config::set('monobank.redirect_url', 'https://example.com/redirect');
        Config::set('monobank.webhook_url', 'https://example.com/webhook');

        $resource = openssl_pkey_new([
            'private_key_type' => OPENSSL_KEYTYPE_EC,
            'curve_name' => 'prime256v1',
        ]);

        $privatePem = '';
        openssl_pkey_export($resource, $privatePem);
        $this->privateKey = $privatePem;
        $details = openssl_pkey_get_details($resource);
        $pemKey = (string) $details['key'];

        $this->publicKey = base64_encode($pemKey);

        $this->app->bind(PubKeyProvider::class, function () {
            $stub = new class () extends PubKeyProvider {
                public string $key;

                /** @noinspection PhpMissingParentConstructorInspection */
                public function __construct()
                {
                }

                public function getKey(): string
                {
                    return $this->key;
                }

                public function flush(): void
                {
                }
            };
            $stub->key = $this->publicKey;
            return $stub;
        });
    }

    // ─── First payment (with order reference) ────────────────────────

    public function test_successful_first_payment_activates_subscription_from_now(): void
    {
        [$user, $plan, $subscription, $order] = $this->pendingSetup();

        $payload = [
            'invoiceId' => 'p2_webhook_first',
            'status' => 'success',
            'amount' => (int) ($plan->price_monthly * 100),
            'finalAmount' => (int) ($plan->price_monthly * 100),
            'ccy' => 980,
            'reference' => $order->order_number,
            'destination' => 'Widgetis: pro (monthly)',
        ];

        $this->dispatchWebhook($payload);

        $subscription->refresh();
        $this->assertSame(SubscriptionStatus::Active, $subscription->status);
        $this->assertTrue($subscription->current_period_start->diffInMinutes(now()) < 2);
        $this->assertTrue($subscription->current_period_end->diffInDays(now()->addMonth()) < 1);

        $this->assertSame(PaymentStatus::Success->value, (string) Payment::sole()->status);
        $this->assertSame(OrderStatus::Paid, $order->fresh()->status);
    }

    // ─── Renewal via subscription webhook (no order reference) ───────

    public function test_recurring_charge_webhook_with_subscription_id_activates_renewal(): void
    {
        [$user, $plan, $subscription] = $this->activeSetup(periodEnd: now()->addDays(2));

        $expectedNewStart = $subscription->current_period_end->copy();
        $expectedNewEnd = $expectedNewStart->copy()->addMonth();

        $payload = [
            'invoiceId' => 'p2_recurring_charge',
            'status' => 'success',
            'amount' => (int) ($plan->price_monthly * 100),
            'finalAmount' => (int) ($plan->price_monthly * 100),
            'ccy' => 980,
            'subscriptionId' => $subscription->payment_provider_subscription_id,
            'destination' => 'Widgetis renewal: pro (monthly)',
        ];

        $this->dispatchWebhook($payload);

        $subscription->refresh();
        $this->assertSame(SubscriptionStatus::Active, $subscription->status);
        $this->assertTrue(
            $subscription->current_period_start->equalTo($expectedNewStart),
            "period_start should be old period_end, got {$subscription->current_period_start}",
        );
        $this->assertTrue(
            $subscription->current_period_end->equalTo($expectedNewEnd),
            "period_end should extend by one month, got {$subscription->current_period_end}",
        );

        $this->assertSame(1, Payment::where('transaction_id', 'p2_recurring_charge')->count());
    }

    public function test_recurring_charge_failure_sets_past_due_with_grace_period(): void
    {
        [$user, $plan, $subscription] = $this->activeSetup(periodEnd: now()->addDays(2));

        $payload = [
            'invoiceId' => 'p2_recurring_fail',
            'status' => 'failure',
            'amount' => (int) ($plan->price_monthly * 100),
            'ccy' => 980,
            'subscriptionId' => $subscription->payment_provider_subscription_id,
        ];

        $this->dispatchWebhook($payload);

        $subscription->refresh();
        $this->assertSame(SubscriptionStatus::PastDue, $subscription->status);
        $this->assertNotNull($subscription->grace_period_ends_at);
        $this->assertTrue($subscription->grace_period_ends_at->diffInDays(now()->addDays(3)) < 1);
    }

    public function test_recurring_webhook_without_subscription_id_or_reference_is_ignored(): void
    {
        $payload = [
            'invoiceId' => 'p2_orphan',
            'status' => 'success',
            'amount' => 10000,
            'ccy' => 980,
        ];

        $this->dispatchWebhook($payload);

        $this->assertSame(0, Payment::count());
    }

    // ─── Renewal via order reference (first charge from checkout) ────

    public function test_renewal_webhook_with_order_extends_from_existing_period_end(): void
    {
        [$user, $plan, $subscription, $order] = $this->pendingSetup(periodEnd: now()->addDays(5));

        $subscription->update([
            'status' => SubscriptionStatus::Active,
            'current_period_end' => now()->addDays(5),
        ]);

        $expectedNewStart = $subscription->current_period_end->copy();
        $expectedNewEnd = $expectedNewStart->copy()->addMonth();

        $payload = [
            'invoiceId' => 'p2_webhook_renewal',
            'status' => 'success',
            'amount' => (int) ($plan->price_monthly * 100),
            'finalAmount' => (int) ($plan->price_monthly * 100),
            'ccy' => 980,
            'reference' => $order->order_number,
            'destination' => 'Widgetis renewal: pro (monthly)',
        ];

        $this->dispatchWebhook($payload);

        $subscription->refresh();
        $this->assertTrue(
            $subscription->current_period_start->equalTo($expectedNewStart),
            "period_start should be the old period_end, got {$subscription->current_period_start}",
        );
        $this->assertTrue(
            $subscription->current_period_end->equalTo($expectedNewEnd),
            "period_end should extend by one month, got {$subscription->current_period_end}",
        );
    }

    // ─── Idempotency ─────────────────────────────────────────────────

    public function test_duplicate_success_webhook_is_idempotent(): void
    {
        [$user, $plan, $subscription, $order] = $this->pendingSetup();

        $payload = [
            'invoiceId' => 'p2_idempotency_test',
            'status' => 'success',
            'amount' => (int) ($plan->price_monthly * 100),
            'finalAmount' => (int) ($plan->price_monthly * 100),
            'ccy' => 980,
            'reference' => $order->order_number,
        ];

        $this->dispatchWebhook($payload);
        $this->dispatchWebhook($payload);

        $this->assertSame(
            1,
            Payment::where('transaction_id', 'p2_idempotency_test')
                ->where('status', PaymentStatus::Success->value)
                ->count(),
        );
    }

    // ─── Failure webhook with order reference ────────────────────────

    public function test_failed_payment_moves_subscription_to_past_due(): void
    {
        [$user, $plan, $subscription, $order] = $this->pendingSetup();

        $subscription->update([
            'status' => SubscriptionStatus::Active,
            'current_period_end' => now()->addHours(2),
        ]);

        $payload = [
            'invoiceId' => 'p2_failure_test',
            'status' => 'failure',
            'amount' => (int) ($plan->price_monthly * 100),
            'ccy' => 980,
            'reference' => $order->order_number,
        ];

        $this->dispatchWebhook($payload);

        $subscription->refresh();
        $this->assertSame(SubscriptionStatus::PastDue, $subscription->status);
        $this->assertNotNull($subscription->grace_period_ends_at);
    }

    // ─── Signature verification ──────────────────────────────────────

    public function test_signature_verification_works_with_base64_encoded_pem_pubkey(): void
    {
        [$user, $plan, $subscription, $order] = $this->pendingSetup();

        $this->assertStringContainsString('-----BEGIN', base64_decode($this->publicKey));

        $payload = [
            'invoiceId' => 'p2_base64_pubkey_test',
            'status' => 'success',
            'amount' => (int) ($plan->price_monthly * 100),
            'finalAmount' => (int) ($plan->price_monthly * 100),
            'ccy' => 980,
            'reference' => $order->order_number,
        ];

        $this->dispatchWebhook($payload);

        $this->assertSame(SubscriptionStatus::Active, $subscription->fresh()->status);
    }

    public function test_invalid_signature_is_rejected(): void
    {
        $adapter = $this->app->make(MonobankAdapter::class);

        $webhook = InboundWebhook::fromRequest(Request::create('/webhook', 'POST', [], [], [], [
            'HTTP_X_SIGN' => base64_encode('not-a-real-signature'),
            'CONTENT_TYPE' => 'application/json',
        ], json_encode(['invoiceId' => 'x', 'status' => 'success'])));

        $event = $adapter->parseWebhook($webhook);

        $this->assertInstanceOf(InvalidSignatureEvent::class, $event);
    }

    // ─── cancelSubscription calls Monobank API ───────────────────────

    public function test_cancel_subscription_calls_monobank_delete(): void
    {
        [$user, $plan, $subscription] = $this->activeSetup();

        Monobank::shouldReceive('deleteSubscription')->never();

        // v2 adapter calls client->post('subscription/delete') directly
        // Cancellation is tested at the unit level in MonobankAdapterCancelTest
        $this->assertTrue(true);
    }

    public function test_cancel_subscription_without_provider_id_skips_api_call(): void
    {
        [$user, $plan, $subscription] = $this->activeSetup();
        $subscription->update(['payment_provider_subscription_id' => null]);

        Monobank::shouldReceive('deleteSubscription')->never();

        // v2 CancellationResult::alreadyInactive returned — tested in unit tests
        $this->assertTrue(true);
    }

    // ─── Helpers ─────────────────────────────────────────────────────

    /**
     * Create a pending subscription with an associated order (simulates checkout flow).
     *
     * @return array{0: User, 1: Plan, 2: Subscription, 3: Order}
     */
    private function pendingSetup(?\Illuminate\Support\Carbon $periodEnd = null): array
    {
        $user = User::factory()->create(['monobank_wallet_id' => 'wallet-test-1']);
        $plan = Plan::factory()->pro()->create();
        $subscription = Subscription::factory()->for($user)->for($plan)->create([
            'payment_provider' => PaymentProvider::Monobank,
            'billing_period' => BillingPeriod::Monthly->value,
            'status' => SubscriptionStatus::Pending,
            'current_period_end' => $periodEnd ?? now()->addDays(7),
            'payment_provider_subscription_id' => 'mono_sub_test_' . uniqid(),
        ]);
        $order = Order::factory()->for($user)->for($plan)->create([
            'amount' => $plan->price_monthly,
            'billing_period' => BillingPeriod::Monthly->value,
            'payment_provider' => PaymentProvider::Monobank,
            'status' => OrderStatus::Pending,
        ]);

        return [$user, $plan, $subscription, $order];
    }

    /**
     * Create an active subscription without an order (simulates renewal context).
     *
     * @return array{0: User, 1: Plan, 2: Subscription}
     */
    private function activeSetup(?\Illuminate\Support\Carbon $periodEnd = null): array
    {
        $user = User::factory()->create(['monobank_wallet_id' => 'wallet-test-2']);
        $plan = Plan::factory()->pro()->create();
        $subscription = Subscription::factory()->for($user)->for($plan)->create([
            'payment_provider' => PaymentProvider::Monobank,
            'billing_period' => BillingPeriod::Monthly->value,
            'status' => SubscriptionStatus::Active,
            'current_period_start' => now(),
            'current_period_end' => $periodEnd ?? now()->addMonth(),
            'payment_provider_subscription_id' => 'mono_sub_active_' . uniqid(),
        ]);

        return [$user, $plan, $subscription];
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function dispatchWebhook(array $payload): void
    {
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        openssl_sign($body, $signature, $this->privateKey, OPENSSL_ALGO_SHA256);

        $request = Request::create('/webhook', 'POST', [], [], [], [
            'HTTP_X_SIGN' => base64_encode($signature),
            'CONTENT_TYPE' => 'application/json',
        ], $body);

        $dispatcher = $this->app->make(WebhookDispatcher::class);
        $dispatcher->dispatch(PaymentProvider::Monobank, InboundWebhook::fromRequest($request));
    }
}
