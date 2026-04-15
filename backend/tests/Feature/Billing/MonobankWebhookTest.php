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
use App\Services\Billing\Providers\MonobankProvider;
use AratKruglik\Monobank\Services\PubKeyProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

/**
 * Exercises MonobankProvider::handleWebhook end-to-end with a real
 * ECDSA keypair. Binds a fake PubKeyProvider in the container so the
 * signature check runs against a test public key that matches fixtures
 * we sign at runtime — without this we'd have to run an integration
 * test against Monobank's live /pubkey endpoint.
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

        // Generate a throwaway ECDSA keypair. Monobank uses SHA256+ECDSA.
        $resource = openssl_pkey_new([
            'private_key_type' => OPENSSL_KEYTYPE_EC,
            'curve_name' => 'prime256v1',
        ]);

        $privatePem = '';
        openssl_pkey_export($resource, $privatePem);
        $this->privateKey = $privatePem;
        $details = openssl_pkey_get_details($resource);
        $pemKey = (string) $details['key'];

        // Monobank's /pubkey endpoint returns the key field as base64 of the
        // full PEM string (headers included). PubKeyProvider::getKey() returns
        // this raw value; verifySignature() base64-decodes it to recover the PEM.
        $this->publicKey = base64_encode($pemKey);

        // Replace the real PubKeyProvider with a stub that returns our
        // test public key so verifySignature() accepts fixtures signed
        // with $this->privateKey.
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
            'walletData' => [
                'cardToken' => 'new_card_token_123',
                'walletId' => $user->monobank_wallet_id ?? 'wallet-abc',
                'status' => 'new',
            ],
        ];

        $this->dispatchWebhook($payload);

        $subscription->refresh();
        $this->assertSame(SubscriptionStatus::Active, $subscription->status);
        $this->assertSame('new_card_token_123', $subscription->monobank_card_token);
        // First activation: period starts now
        $this->assertTrue($subscription->current_period_start->diffInMinutes(now()) < 2);
        $this->assertTrue($subscription->current_period_end->diffInDays(now()->addMonth()) < 1);

        $this->assertSame(PaymentStatus::Success->value, (string) Payment::sole()->status);
        $this->assertSame(OrderStatus::Paid, $order->fresh()->status);
    }

    public function test_renewal_webhook_extends_from_existing_period_end(): void
    {
        [$user, $plan, $subscription, $order] = $this->pendingSetup(periodEnd: now()->addDays(5));

        // Active sub with 5 days remaining → renewal should extend from
        // current_period_end, not reset the clock to now().
        $subscription->update([
            'status' => SubscriptionStatus::Active,
            'current_period_end' => now()->addDays(5),
            'monobank_card_token' => 'existing_card_token',
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

        // The DB unique index (migration 2026_04_13_000020) combined
        // with the app-level check guarantees at most one success row.
        $this->assertSame(
            1,
            Payment::where('transaction_id', 'p2_idempotency_test')
                ->where('status', PaymentStatus::Success->value)
                ->count(),
        );
    }

    public function test_failed_renewal_moves_active_subscription_to_past_due(): void
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

    /**
     * Monobank returns the public key as base64(PEM) — base64 of the full
     * PEM string including headers. verifySignature() base64-decodes it to
     * recover the PEM and passes it to openssl_verify.
     */
    public function test_signature_verification_works_with_base64_encoded_pem_pubkey(): void
    {
        [$user, $plan, $subscription, $order] = $this->pendingSetup();

        // $this->publicKey is base64(PEM) — this is what the real PubKeyProvider
        // returns from the /pubkey endpoint. Decoding it gives a valid PEM string.
        $this->assertStringContainsString('-----BEGIN', base64_decode($this->publicKey));

        $payload = [
            'invoiceId' => 'p2_base64_pubkey_test',
            'status' => 'success',
            'amount' => (int) ($plan->price_monthly * 100),
            'finalAmount' => (int) ($plan->price_monthly * 100),
            'ccy' => 980,
            'reference' => $order->order_number,
        ];

        // If verifySignature() passes raw base64 directly to openssl_verify
        // without PEM wrapping, this throws ErrorException and returns 500.
        // The test catches that failure as a non-Active subscription.
        $this->dispatchWebhook($payload);

        $this->assertSame(SubscriptionStatus::Active, $subscription->fresh()->status);
    }

    public function test_invalid_signature_is_rejected(): void
    {
        $provider = $this->app->make(MonobankProvider::class);

        $request = Request::create('/webhook', 'POST', [], [], [], [
            'HTTP_X_SIGN' => base64_encode('not-a-real-signature'),
            'CONTENT_TYPE' => 'application/json',
        ], json_encode(['invoiceId' => 'x', 'status' => 'success']));

        $result = $provider->handleWebhook($request);

        $this->assertFalse($result->signatureValid);
        $this->assertFalse($result->processed);
    }

    /**
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

        $provider = $this->app->make(MonobankProvider::class);
        $provider->handleWebhook($request);
    }
}
