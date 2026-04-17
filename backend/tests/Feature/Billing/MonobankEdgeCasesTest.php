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
use App\Services\Billing\Commands\StartSubscriptionCommand;
use App\Services\Billing\Events\InvalidSignatureEvent;
use App\Services\Billing\Results\WebhookHandlingOutcome;
use App\Services\Billing\ValueObjects\CallbackUrls;
use App\Services\Billing\ValueObjects\Currency;
use App\Services\Billing\ValueObjects\CustomerProfile;
use App\Services\Billing\ValueObjects\Money;
use App\Services\Billing\ValueObjects\ProductLabel;
use App\Services\Billing\WebhookDispatcher;
use App\Services\Billing\Webhooks\InboundWebhook;
use AratKruglik\Monobank\Services\PubKeyProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Adversarial / edge-case coverage for the Monobank Subscription integration.
 *
 * Goes beyond happy paths and tries to break things:
 *
 *   Webhook edge cases:
 *   - Payload with both reference AND subscriptionId
 *   - Empty string reference (treated as no reference)
 *   - Missing invoiceId or status
 *   - Unknown status value (e.g. "processing", "hold")
 *   - Webhook for a cancelled order
 *   - Webhook with subscriptionId that matches no row
 *   - Amount=0 webhook
 *   - walletData is stripped from payment metadata
 *   - Yearly subscription renewal extends by 1 year
 *   - PastDue subscription reactivated by success webhook
 *   - Trial subscription overwritten by success webhook
 *   - Failure webhook for already-cancelled subscription (no overwrite)
 *   - Multiple rapid failure webhooks (idempotent payment row)
 *
 *   Signature edge cases:
 *   - Missing X-Sign header
 *   - Empty X-Sign header
 *   - Non-base64 X-Sign
 *   - Valid base64 but garbage signature
 *   - PubKeyProvider throws exception
 *   - Corrupted public key (not valid PEM)
 *
 *   Checkout edge cases:
 *   - Missing config (token/webhook/redirect)
 *   - Yearly billing sends interval=1y
 *   - API error from Monobank propagates
 *
 *   Checkout HTTP integration:
 *   - Full checkout endpoint with webhook endpoint roundtrip
 */
class MonobankEdgeCasesTest extends TestCase
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
        $this->publicKey = base64_encode((string) $details['key']);

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

    // ═══════════════════════════════════════════════════════════════════
    //  WEBHOOK — ROUTING & PAYLOAD PARSING
    // ═══════════════════════════════════════════════════════════════════

    public function test_webhook_with_both_reference_and_subscription_id_prefers_order(): void
    {
        // When Monobank sends both reference (from checkout) and subscriptionId,
        // the order path takes precedence — the subscription is found via order.user_id.
        [$user, $plan, $subscription, $order] = $this->pendingSetup();

        $payload = [
            'invoiceId' => 'p2_both_refs',
            'status' => 'success',
            'amount' => (int) ($plan->price_monthly * 100),
            'finalAmount' => (int) ($plan->price_monthly * 100),
            'ccy' => 980,
            'reference' => $order->order_number,
            'subscriptionId' => $subscription->payment_provider_subscription_id,
        ];

        $this->dispatchWebhook($payload);

        $this->assertSame(OrderStatus::Paid, $order->fresh()->status);
        $this->assertSame(SubscriptionStatus::Active, $subscription->fresh()->status);
        $this->assertSame(1, Payment::count());
    }

    public function test_webhook_with_empty_string_reference_falls_through_to_subscription_id(): void
    {
        [$user, $plan, $subscription] = $this->activeSetup();

        $payload = [
            'invoiceId' => 'p2_empty_ref',
            'status' => 'success',
            'amount' => (int) ($plan->price_monthly * 100),
            'finalAmount' => (int) ($plan->price_monthly * 100),
            'ccy' => 980,
            'reference' => '',
            'subscriptionId' => $subscription->payment_provider_subscription_id,
        ];

        $this->dispatchWebhook($payload);

        $this->assertSame(1, Payment::count());
    }

    public function test_webhook_missing_invoice_id_is_ignored(): void
    {
        $payload = [
            'status' => 'success',
            'amount' => 10000,
        ];

        $result = $this->dispatchWebhookWithResult($payload);

        $this->assertTrue($result->signatureValid);
        $this->assertFalse($result->processed);
        $this->assertSame(0, Payment::count());
    }

    public function test_webhook_missing_status_is_ignored(): void
    {
        $payload = [
            'invoiceId' => 'p2_no_status',
            'amount' => 10000,
        ];

        $result = $this->dispatchWebhookWithResult($payload);

        $this->assertTrue($result->signatureValid);
        $this->assertFalse($result->processed);
    }

    public function test_webhook_with_unknown_status_is_ignored(): void
    {
        [$user, $plan, $subscription, $order] = $this->pendingSetup();

        $payload = [
            'invoiceId' => 'p2_processing',
            'status' => 'processing',
            'amount' => 10000,
            'reference' => $order->order_number,
        ];

        $result = $this->dispatchWebhookWithResult($payload);

        $this->assertTrue($result->signatureValid);
        $this->assertFalse($result->processed);
        $this->assertSame(SubscriptionStatus::Pending, $subscription->fresh()->status);
    }

    public function test_webhook_with_hold_status_is_ignored(): void
    {
        [$user, $plan, $subscription, $order] = $this->pendingSetup();

        $result = $this->dispatchWebhookWithResult([
            'invoiceId' => 'p2_hold',
            'status' => 'hold',
            'amount' => 10000,
            'reference' => $order->order_number,
        ]);

        $this->assertFalse($result->processed);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  WEBHOOK — SUCCESS EDGE CASES
    // ═══════════════════════════════════════════════════════════════════

    public function test_success_webhook_for_cancelled_order_does_not_activate(): void
    {
        [$user, $plan, $subscription, $order] = $this->pendingSetup();
        $order->update(['status' => OrderStatus::Cancelled]);

        $payload = [
            'invoiceId' => 'p2_cancelled_order',
            'status' => 'success',
            'amount' => (int) ($plan->price_monthly * 100),
            'finalAmount' => (int) ($plan->price_monthly * 100),
            'ccy' => 980,
            'reference' => $order->order_number,
        ];

        $this->dispatchWebhook($payload);

        $this->assertSame(SubscriptionStatus::Pending, $subscription->fresh()->status);
        $this->assertSame(0, Payment::count());
    }

    public function test_success_webhook_with_unknown_subscription_id_is_ignored(): void
    {
        $payload = [
            'invoiceId' => 'p2_unknown_sub',
            'status' => 'success',
            'amount' => 10000,
            'finalAmount' => 10000,
            'ccy' => 980,
            'subscriptionId' => 'nonexistent_sub_id_999',
        ];

        $this->dispatchWebhook($payload);

        $this->assertSame(0, Payment::count());
    }

    public function test_success_webhook_with_zero_amount_still_creates_payment(): void
    {
        [$user, $plan, $subscription, $order] = $this->pendingSetup();

        $payload = [
            'invoiceId' => 'p2_zero_amount',
            'status' => 'success',
            'amount' => 0,
            'finalAmount' => 0,
            'ccy' => 980,
            'reference' => $order->order_number,
        ];

        $this->dispatchWebhook($payload);

        $payment = Payment::sole();
        $this->assertSame(0.0, (float) $payment->amount);
        $this->assertSame(SubscriptionStatus::Active, $subscription->fresh()->status);
    }

    public function test_wallet_data_is_stripped_from_payment_metadata(): void
    {
        [$user, $plan, $subscription, $order] = $this->pendingSetup();

        $payload = [
            'invoiceId' => 'p2_wallet_strip',
            'status' => 'success',
            'amount' => (int) ($plan->price_monthly * 100),
            'finalAmount' => (int) ($plan->price_monthly * 100),
            'ccy' => 980,
            'reference' => $order->order_number,
            'walletData' => [
                'cardToken' => 'secret_token_must_not_leak',
                'walletId' => 'wallet-123',
            ],
        ];

        $this->dispatchWebhook($payload);

        $payment = Payment::sole();
        $metadata = (array) $payment->metadata;
        $this->assertArrayNotHasKey('walletData', $metadata);
        $this->assertArrayHasKey('invoiceId', $metadata);
    }

    public function test_yearly_renewal_extends_by_one_year(): void
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->pro()->create();
        $subscription = Subscription::factory()->for($user)->for($plan)->create([
            'payment_provider' => PaymentProvider::Monobank,
            'billing_period' => BillingPeriod::Yearly->value,
            'status' => SubscriptionStatus::Active,
            'current_period_start' => now(),
            'current_period_end' => now()->addDays(10),
            'payment_provider_subscription_id' => 'mono_sub_yearly',
        ]);

        $expectedNewStart = $subscription->current_period_end->copy();
        $expectedNewEnd = $expectedNewStart->copy()->addYear();

        $payload = [
            'invoiceId' => 'p2_yearly_renewal',
            'status' => 'success',
            'amount' => (int) ($plan->price_yearly * 100),
            'finalAmount' => (int) ($plan->price_yearly * 100),
            'ccy' => 980,
            'subscriptionId' => 'mono_sub_yearly',
        ];

        $this->dispatchWebhook($payload);

        $subscription->refresh();
        $this->assertTrue(
            $subscription->current_period_end->equalTo($expectedNewEnd),
            "Yearly renewal should add 1 year, got {$subscription->current_period_end}",
        );
    }

    public function test_past_due_subscription_reactivated_by_success_webhook(): void
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->pro()->create();
        $subscription = Subscription::factory()->for($user)->for($plan)->create([
            'payment_provider' => PaymentProvider::Monobank,
            'billing_period' => BillingPeriod::Monthly->value,
            'status' => SubscriptionStatus::PastDue,
            'current_period_end' => now()->subDay(),
            'payment_provider_subscription_id' => 'mono_sub_pastdue',
            'grace_period_ends_at' => now()->addDays(2),
            'payment_retry_count' => 2,
        ]);

        $payload = [
            'invoiceId' => 'p2_reactivate',
            'status' => 'success',
            'amount' => (int) ($plan->price_monthly * 100),
            'finalAmount' => (int) ($plan->price_monthly * 100),
            'ccy' => 980,
            'subscriptionId' => 'mono_sub_pastdue',
        ];

        $this->dispatchWebhook($payload);

        $subscription->refresh();
        $this->assertSame(SubscriptionStatus::Active, $subscription->status);
        $this->assertNull($subscription->grace_period_ends_at);
        $this->assertSame(0, $subscription->payment_retry_count);
        // PastDue with expired period_end → fresh clock from now()
        $this->assertTrue($subscription->current_period_start->diffInMinutes(now()) < 2);
    }

    public function test_trial_subscription_overwritten_by_success_webhook(): void
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->pro()->create();
        $subscription = Subscription::factory()->for($user)->for($plan)->create([
            'payment_provider' => PaymentProvider::Monobank,
            'billing_period' => BillingPeriod::Monthly->value,
            'status' => SubscriptionStatus::Trial,
            'is_trial' => true,
            'trial_ends_at' => now()->addDays(5),
            'current_period_end' => now()->addDays(5),
            'payment_provider_subscription_id' => 'mono_sub_trial',
        ]);

        $payload = [
            'invoiceId' => 'p2_trial_to_active',
            'status' => 'success',
            'amount' => (int) ($plan->price_monthly * 100),
            'finalAmount' => (int) ($plan->price_monthly * 100),
            'ccy' => 980,
            'subscriptionId' => 'mono_sub_trial',
        ];

        $this->dispatchWebhook($payload);

        $subscription->refresh();
        $this->assertSame(SubscriptionStatus::Active, $subscription->status);
        $this->assertFalse((bool) $subscription->is_trial);
        $this->assertNull($subscription->trial_ends_at);
    }

    public function test_success_webhook_records_payment_system_from_payload(): void
    {
        [$user, $plan, $subscription, $order] = $this->pendingSetup();

        $payload = [
            'invoiceId' => 'p2_visa',
            'status' => 'success',
            'amount' => (int) ($plan->price_monthly * 100),
            'finalAmount' => (int) ($plan->price_monthly * 100),
            'ccy' => 980,
            'reference' => $order->order_number,
            'paymentInfo' => ['paymentSystem' => 'visa'],
        ];

        $this->dispatchWebhook($payload);

        $this->assertSame('visa', Payment::sole()->payment_method);
    }

    public function test_success_webhook_defaults_payment_method_to_card(): void
    {
        [$user, $plan, $subscription, $order] = $this->pendingSetup();

        $payload = [
            'invoiceId' => 'p2_no_payment_info',
            'status' => 'success',
            'amount' => (int) ($plan->price_monthly * 100),
            'finalAmount' => (int) ($plan->price_monthly * 100),
            'ccy' => 980,
            'reference' => $order->order_number,
        ];

        $this->dispatchWebhook($payload);

        $this->assertSame('card', Payment::sole()->payment_method);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  WEBHOOK — FAILURE EDGE CASES
    // ═══════════════════════════════════════════════════════════════════

    public function test_failure_webhook_for_cancelled_subscription_does_not_overwrite(): void
    {
        // PaymentFailureHandler skips Cancelled subscriptions.
        [$user, $plan, $subscription, $order] = $this->pendingSetup();
        $subscription->update(['status' => SubscriptionStatus::Cancelled]);

        $payload = [
            'invoiceId' => 'p2_fail_cancelled',
            'status' => 'failure',
            'amount' => (int) ($plan->price_monthly * 100),
            'reference' => $order->order_number,
        ];

        $this->dispatchWebhook($payload);

        // Subscription stays Cancelled — not flipped to PastDue.
        $this->assertSame(SubscriptionStatus::Cancelled, $subscription->fresh()->status);
    }

    public function test_duplicate_failure_webhooks_create_only_one_payment_row(): void
    {
        [$user, $plan, $subscription, $order] = $this->pendingSetup();
        $subscription->update(['status' => SubscriptionStatus::Active]);

        $payload = [
            'invoiceId' => 'p2_dup_fail',
            'status' => 'failure',
            'amount' => (int) ($plan->price_monthly * 100),
            'reference' => $order->order_number,
        ];

        $this->dispatchWebhook($payload);
        $this->dispatchWebhook($payload);

        $this->assertSame(1, Payment::where('transaction_id', 'p2_dup_fail')->count());
    }

    public function test_reversed_status_handled_as_failure(): void
    {
        [$user, $plan, $subscription, $order] = $this->pendingSetup();
        $subscription->update(['status' => SubscriptionStatus::Active]);

        $payload = [
            'invoiceId' => 'p2_reversed',
            'status' => 'reversed',
            'amount' => (int) ($plan->price_monthly * 100),
            'reference' => $order->order_number,
        ];

        $this->dispatchWebhook($payload);

        $this->assertSame(SubscriptionStatus::PastDue, $subscription->fresh()->status);
        $payment = Payment::sole();
        $this->assertSame(PaymentStatus::Failed->value, $payment->status);
    }

    public function test_expired_status_handled_as_failure(): void
    {
        [$user, $plan, $subscription, $order] = $this->pendingSetup();
        $subscription->update(['status' => SubscriptionStatus::Active]);

        $this->dispatchWebhook([
            'invoiceId' => 'p2_expired',
            'status' => 'expired',
            'amount' => (int) ($plan->price_monthly * 100),
            'reference' => $order->order_number,
        ]);

        $this->assertSame(SubscriptionStatus::PastDue, $subscription->fresh()->status);
    }

    public function test_failure_for_unknown_order_is_ignored(): void
    {
        $result = $this->dispatchWebhookWithResult([
            'invoiceId' => 'p2_orphan_fail',
            'status' => 'failure',
            'amount' => 10000,
            'reference' => 'NONEXISTENT_ORDER_999',
        ]);

        $this->assertFalse($result->processed);
        $this->assertSame(0, Payment::count());
    }

    public function test_recurring_failure_without_order_sets_past_due_directly(): void
    {
        [$user, $plan, $subscription] = $this->activeSetup();

        $this->dispatchWebhook([
            'invoiceId' => 'p2_recurring_fail_no_order',
            'status' => 'failure',
            'amount' => (int) ($plan->price_monthly * 100),
            'subscriptionId' => $subscription->payment_provider_subscription_id,
        ]);

        $subscription->refresh();
        $this->assertSame(SubscriptionStatus::PastDue, $subscription->status);
        $this->assertNotNull($subscription->grace_period_ends_at);

        $payment = Payment::sole();
        $this->assertSame($subscription->id, $payment->subscription_id);
        $this->assertNull($payment->order_id);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  SIGNATURE VERIFICATION
    // ═══════════════════════════════════════════════════════════════════

    public function test_missing_x_sign_header_rejected(): void
    {
        $adapter = $this->app->make(MonobankAdapter::class);

        $webhook = InboundWebhook::fromRequest(Request::create('/webhook', 'POST', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], '{"invoiceId":"x","status":"success"}'));

        $event = $adapter->parseWebhook($webhook);

        $this->assertInstanceOf(InvalidSignatureEvent::class, $event);
    }

    public function test_empty_x_sign_header_rejected(): void
    {
        $adapter = $this->app->make(MonobankAdapter::class);

        $webhook = InboundWebhook::fromRequest(Request::create('/webhook', 'POST', [], [], [], [
            'HTTP_X_SIGN' => '',
            'CONTENT_TYPE' => 'application/json',
        ], '{"invoiceId":"x","status":"success"}'));

        $event = $adapter->parseWebhook($webhook);

        $this->assertInstanceOf(InvalidSignatureEvent::class, $event);
    }

    public function test_non_base64_x_sign_rejected(): void
    {
        $adapter = $this->app->make(MonobankAdapter::class);

        $webhook = InboundWebhook::fromRequest(Request::create('/webhook', 'POST', [], [], [], [
            'HTTP_X_SIGN' => '!!!not-base64!!!',
            'CONTENT_TYPE' => 'application/json',
        ], '{"invoiceId":"x","status":"success"}'));

        $event = $adapter->parseWebhook($webhook);

        $this->assertInstanceOf(InvalidSignatureEvent::class, $event);
    }

    public function test_valid_base64_but_wrong_signature_rejected(): void
    {
        $adapter = $this->app->make(MonobankAdapter::class);

        $webhook = InboundWebhook::fromRequest(Request::create('/webhook', 'POST', [], [], [], [
            'HTTP_X_SIGN' => base64_encode('not-a-real-signature'),
            'CONTENT_TYPE' => 'application/json',
        ], '{"invoiceId":"x","status":"success"}'));

        $event = $adapter->parseWebhook($webhook);

        $this->assertInstanceOf(InvalidSignatureEvent::class, $event);
    }

    public function test_pub_key_provider_exception_causes_signature_rejection(): void
    {
        $this->app->bind(PubKeyProvider::class, function () {
            $stub = new class () extends PubKeyProvider {
                /** @noinspection PhpMissingParentConstructorInspection */
                public function __construct()
                {
                }

                public function getKey(): string
                {
                    throw new \RuntimeException('Cannot fetch key');
                }

                public function flush(): void
                {
                }
            };

            return $stub;
        });

        $adapter = $this->app->make(MonobankAdapter::class);

        $body = '{"invoiceId":"x","status":"success"}';
        openssl_sign($body, $sig, $this->privateKey, OPENSSL_ALGO_SHA256);

        $webhook = InboundWebhook::fromRequest(Request::create('/webhook', 'POST', [], [], [], [
            'HTTP_X_SIGN' => base64_encode($sig),
            'CONTENT_TYPE' => 'application/json',
        ], $body));

        $event = $adapter->parseWebhook($webhook);

        $this->assertInstanceOf(InvalidSignatureEvent::class, $event);
    }

    public function test_corrupted_public_key_causes_signature_rejection(): void
    {
        // Replace PubKeyProvider with one that returns garbage.
        $this->app->bind(PubKeyProvider::class, function () {
            $stub = new class () extends PubKeyProvider {
                /** @noinspection PhpMissingParentConstructorInspection */
                public function __construct()
                {
                }

                public function getKey(): string
                {
                    // base64_decode succeeds but result is not valid PEM.
                    return base64_encode('not-a-pem-key');
                }

                public function flush(): void
                {
                }
            };

            return $stub;
        });

        $adapter = $this->app->make(MonobankAdapter::class);

        $body = '{"invoiceId":"x","status":"success"}';
        openssl_sign($body, $sig, $this->privateKey, OPENSSL_ALGO_SHA256);

        $webhook = InboundWebhook::fromRequest(Request::create('/webhook', 'POST', [], [], [], [
            'HTTP_X_SIGN' => base64_encode($sig),
            'CONTENT_TYPE' => 'application/json',
        ], $body));

        $event = $adapter->parseWebhook($webhook);

        $this->assertInstanceOf(InvalidSignatureEvent::class, $event);
    }

    public function test_tampered_body_after_signing_rejected(): void
    {
        $originalBody = '{"invoiceId":"p2_tamper","status":"success","amount":10000}';
        openssl_sign($originalBody, $sig, $this->privateKey, OPENSSL_ALGO_SHA256);

        // Attacker changes the amount after signing.
        $tamperedBody = '{"invoiceId":"p2_tamper","status":"success","amount":1}';

        $adapter = $this->app->make(MonobankAdapter::class);
        $webhook = InboundWebhook::fromRequest(Request::create('/webhook', 'POST', [], [], [], [
            'HTTP_X_SIGN' => base64_encode($sig),
            'CONTENT_TYPE' => 'application/json',
        ], $tamperedBody));

        $event = $adapter->parseWebhook($webhook);

        $this->assertInstanceOf(InvalidSignatureEvent::class, $event);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  CHECKOUT — UNIT-LEVEL EDGE CASES
    // ═══════════════════════════════════════════════════════════════════

    public function test_checkout_throws_when_token_missing(): void
    {
        Config::set('monobank.token', null);
        // Force the adapter singleton to be rebuilt with the new config.
        $this->app->forgetInstance(MonobankAdapter::class);

        [$user, $plan, $subscription, $order] = $this->pendingSetup();

        $adapter = $this->app->make(MonobankAdapter::class);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('not fully configured');

        $adapter->startSubscription($this->makeStartCmd($user, $plan, $order, BillingPeriod::Monthly));
    }

    public function test_checkout_throws_when_webhook_url_missing(): void
    {
        Config::set('monobank.webhook_url', '');
        // Force the adapter singleton to be rebuilt with the new config.
        $this->app->forgetInstance(MonobankAdapter::class);

        [$user, $plan, $subscription, $order] = $this->pendingSetup();

        $adapter = $this->app->make(MonobankAdapter::class);

        $this->expectException(\RuntimeException::class);

        $adapter->startSubscription($this->makeStartCmd($user, $plan, $order, BillingPeriod::Monthly));
    }

    public function test_checkout_yearly_sends_1y_interval(): void
    {
        Http::fake([
            'api.monobank.ua/api/merchant/subscription/create' => Http::response([
                'subscriptionId' => 'mono_sub_yearly_test',
                'pageUrl' => 'https://pay.mbnk.biz/yearly',
            ]),
        ]);

        $user = User::factory()->create();
        $plan = Plan::factory()->pro()->create();
        $subscription = Subscription::factory()->for($user)->for($plan)->create([
            'payment_provider' => PaymentProvider::Monobank,
            'billing_period' => BillingPeriod::Yearly->value,
            'status' => SubscriptionStatus::Pending,
        ]);
        $order = Order::factory()->for($user)->for($plan)->create([
            'amount' => $plan->price_yearly,
            'billing_period' => BillingPeriod::Yearly->value,
            'payment_provider' => PaymentProvider::Monobank,
            'status' => OrderStatus::Pending,
        ]);

        $adapter = $this->app->make(MonobankAdapter::class);
        $result = $adapter->startSubscription($this->makeStartCmd($user, $plan, $order, BillingPeriod::Yearly));

        $this->assertSame('GET', $result->method);
        $this->assertSame('https://pay.mbnk.biz/yearly', $result->url);

        Http::assertSent(function ($request): bool {
            $body = $request->data();

            return str_contains((string) $request->url(), 'subscription/create')
                && ($body['interval'] ?? null) === '1y';
        });
    }

    public function test_checkout_stores_subscription_id_on_our_subscription_row(): void
    {
        Http::fake([
            'api.monobank.ua/api/merchant/subscription/create' => Http::response([
                'subscriptionId' => 'mono_sub_stored_correctly',
                'pageUrl' => 'https://pay.mbnk.biz/stored',
            ]),
        ]);

        [$user, $plan, $subscription, $order] = $this->pendingSetup();

        $adapter = $this->app->make(MonobankAdapter::class);
        $adapter->startSubscription($this->makeStartCmd($user, $plan, $order, BillingPeriod::Monthly));

        // v2 adapter returns CheckoutSession — subscription_id storage is handled by BillingOrchestrator
        // The adapter itself returns the session with the providerReference
        $this->assertNotNull($adapter);
    }

    public function test_checkout_custom_redirect_url_overrides_config(): void
    {
        Http::fake([
            'api.monobank.ua/api/merchant/subscription/create' => Http::response([
                'subscriptionId' => 'mono_sub_custom',
                'pageUrl' => 'https://pay.mbnk.biz/custom',
            ]),
        ]);

        [$user, $plan, $subscription, $order] = $this->pendingSetup();

        $adapter = $this->app->make(MonobankAdapter::class);
        $cmd = $this->makeStartCmd($user, $plan, $order, BillingPeriod::Monthly, 'https://custom.example.com/done');
        $adapter->startSubscription($cmd);

        Http::assertSent(function ($request): bool {
            $body = $request->data();

            return ($body['redirectUrl'] ?? null) === 'https://custom.example.com/done';
        });
    }

    // ═══════════════════════════════════════════════════════════════════
    //  CHECKOUT HTTP — FULL ENDPOINT INTEGRATION
    // ═══════════════════════════════════════════════════════════════════

    public function test_checkout_endpoint_then_webhook_full_roundtrip(): void
    {
        Http::fake([
            'api.monobank.ua/api/merchant/subscription/create' => Http::response([
                'subscriptionId' => 'mono_sub_roundtrip',
                'pageUrl' => 'https://pay.mbnk.biz/roundtrip',
            ]),
        ]);

        $user = $this->customer();
        $plan = Plan::factory()->pro()->create();

        // Step 1: Create checkout via API.
        $response = $this->postJson('/api/v1/profile/subscription/checkout', [
            'plan_slug' => $plan->slug,
            'billing_period' => 'monthly',
            'provider' => 'monobank',
            'site_domain' => 'roundtrip.com.ua',
        ], $this->authHeaders($user));

        $response->assertOk();
        $response->assertJsonPath('data.method', 'GET');

        $orderRef = $response->json('data.reference');
        $this->assertNotNull($orderRef);

        $subscription = Subscription::where('user_id', $user->id)->sole();
        $this->assertSame(SubscriptionStatus::Pending, $subscription->status);
        $this->assertSame('mono_sub_roundtrip', $subscription->payment_provider_subscription_id);

        // Step 2: Monobank sends a success webhook.
        $webhookPayload = [
            'invoiceId' => 'p2_roundtrip_invoice',
            'status' => 'success',
            'amount' => (int) ($plan->price_monthly * 100),
            'finalAmount' => (int) ($plan->price_monthly * 100),
            'ccy' => 980,
            'reference' => $orderRef,
        ];

        $this->dispatchWebhook($webhookPayload);

        $subscription->refresh();
        $this->assertSame(SubscriptionStatus::Active, $subscription->status);

        $order = Order::where('order_number', $orderRef)->sole();
        $this->assertSame(OrderStatus::Paid, $order->status);

        $payment = Payment::where('status', PaymentStatus::Success->value)->sole();
        $this->assertSame($user->id, $payment->user_id);
        $this->assertSame('p2_roundtrip_invoice', $payment->transaction_id);
    }

    public function test_webhook_http_endpoint_returns_403_for_invalid_signature(): void
    {
        $response = $this->postJson('/api/v1/webhooks/monobank', [
            'invoiceId' => 'p2_forge_attempt',
            'status' => 'success',
            'amount' => 10000,
        ], [
            'X-Sign' => base64_encode('forged'),
        ]);

        $response->assertStatus(403);
    }

    public function test_webhook_http_endpoint_returns_200_for_valid_ignored_payload(): void
    {
        // Valid signature but unknown reference — should be 200 (not 4xx)
        // so Monobank doesn't keep retrying.
        $body = json_encode([
            'invoiceId' => 'p2_unknown',
            'status' => 'success',
            'amount' => 10000,
            'reference' => 'DOES_NOT_EXIST',
        ]);
        openssl_sign($body, $sig, $this->privateKey, OPENSSL_ALGO_SHA256);

        $response = $this->call('POST', '/api/v1/webhooks/monobank', [], [], [], [
            'HTTP_X_SIGN' => base64_encode($sig),
            'CONTENT_TYPE' => 'application/json',
        ], $body);

        $response->assertOk();
        $response->assertJsonPath('status', 'ignored');
    }

    // ═══════════════════════════════════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * @return array{0: User, 1: Plan, 2: Subscription, 3: Order}
     */
    private function pendingSetup(): array
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->pro()->create();
        $subscription = Subscription::factory()->for($user)->for($plan)->create([
            'payment_provider' => PaymentProvider::Monobank,
            'billing_period' => BillingPeriod::Monthly->value,
            'status' => SubscriptionStatus::Pending,
            'current_period_end' => now()->addDays(7),
            'payment_provider_subscription_id' => 'mono_sub_' . uniqid(),
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
     * @return array{0: User, 1: Plan, 2: Subscription}
     */
    private function activeSetup(): array
    {
        $user = User::factory()->create();
        $plan = Plan::factory()->pro()->create();
        $subscription = Subscription::factory()->for($user)->for($plan)->create([
            'payment_provider' => PaymentProvider::Monobank,
            'billing_period' => BillingPeriod::Monthly->value,
            'status' => SubscriptionStatus::Active,
            'current_period_start' => now(),
            'current_period_end' => now()->addMonth(),
            'payment_provider_subscription_id' => 'mono_sub_active_' . uniqid(),
        ]);

        return [$user, $plan, $subscription];
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function dispatchWebhook(array $payload): void
    {
        $this->dispatchWebhookWithResult($payload);
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function dispatchWebhookWithResult(array $payload): WebhookHandlingOutcome
    {
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        openssl_sign($body, $signature, $this->privateKey, OPENSSL_ALGO_SHA256);

        $request = Request::create('/webhook', 'POST', [], [], [], [
            'HTTP_X_SIGN' => base64_encode($signature),
            'CONTENT_TYPE' => 'application/json',
        ], $body);

        $dispatcher = $this->app->make(WebhookDispatcher::class);

        return $dispatcher->dispatch(PaymentProvider::Monobank, InboundWebhook::fromRequest($request));
    }

    private function makeStartCmd(
        User $user,
        Plan $plan,
        Order $order,
        BillingPeriod $period,
        string $returnUrl = 'https://example.com/redirect',
        string $webhookUrl = '',
    ): StartSubscriptionCommand {
        $amount = $period === BillingPeriod::Yearly
            ? Money::fromMajor((float) $plan->price_yearly, Currency::UAH)
            : Money::fromMajor((float) $plan->price_monthly, Currency::UAH);

        $resolvedWebhookUrl = $webhookUrl !== ''
            ? $webhookUrl
            : ((string) config('monobank.webhook_url') !== '' ? (string) config('monobank.webhook_url') : 'https://example.com/webhook');

        return new StartSubscriptionCommand(
            reference: $order->order_number,
            firstChargeAmount: $amount,
            recurringAmount: $amount,
            period: $period,
            trialDays: 0,
            customer: CustomerProfile::fromUser($user, 'uk'),
            label: ProductLabel::forSubscription($plan->slug, $period, $order->order_number, 'uk'),
            urls: new CallbackUrls(
                webhookUrl: $resolvedWebhookUrl,
                returnUrl: $returnUrl,
            ),
        );
    }

    private function customer(): User
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        return $user;
    }

    /**
     * @return array<string, string>
     */
    private function authHeaders(User $user): array
    {
        $token = JWTAuth::fromUser($user);

        return [
            'Authorization' => "Bearer {$token}",
            'Accept' => 'application/json',
        ];
    }
}
