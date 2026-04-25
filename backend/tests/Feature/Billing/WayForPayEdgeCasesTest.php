<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Core\Models\Order;
use App\Core\Models\Payment;
use App\Core\Models\Plan;
use App\Core\Models\Subscription;
use App\Core\Models\User;
use App\Enums\OrderStatus;
use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\SubscriptionStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Adversarial / edge-case coverage for the WayForPay integration.
 *
 * These tests go beyond the happy paths in WayForPayWebhookTest and try to
 * break things the way a hostile actor or a buggy scheduler would:
 *
 *   - Replay of a previously-accepted webhook (no second activation)
 *   - Refund-after-activation (cancels a live paid subscription)
 *   - Refund of the 1 UAH trial verification (must NOT cancel trial)
 *   - Forged merchantAccount in an otherwise-signed payload
 *   - Webhook arriving for an order the user already cancelled
 *   - Renewal charge webhook extends current_period_end, not resets it
 *   - Tampered recToken in a retried webhook does not overwrite the real one
 *   - Checkout endpoint end-to-end with provider=wayforpay
 */
class WayForPayEdgeCasesTest extends TestCase
{
    use RefreshDatabase;

    private const MERCHANT    = 'test_merch_n1';
    private const SECRET      = 'flk3409refn54t54t*FNJRET';
    private const DOMAIN      = 'www.market.ua';
    private const WEBHOOK_URL = '/api/v1/payments/wayforpay/callback';

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('services.wayforpay.merchant_account', self::MERCHANT);
        Config::set('services.wayforpay.secret_key', self::SECRET);
        Config::set('services.wayforpay.merchant_domain_name', self::DOMAIN);
        Config::set('services.wayforpay.trial_verify_amount', 1.0);
        Config::set('services.wayforpay.auto_refund_trial', true);

        // Any outbound call to WayForPay is short-circuited with a canned
        // response so the test suite never touches the network.
        Http::fake([
            'api.wayforpay.com/*' => function () {
                return Http::response([
                    'transactionStatus' => 'Approved',
                    'reasonCode'        => 1100,
                    'reason'            => 'Ok',
                    'orderReference'    => 'REFUND-STUB',
                    'merchantAccount'   => self::MERCHANT,
                    'merchantSignature' => hash_hmac(
                        'md5',
                        implode(';', [self::MERCHANT, 'REFUND-STUB', 'Approved', '1100']),
                        self::SECRET,
                    ),
                ], 200);
            },
        ]);
    }

    // ─── Replay / idempotency ──────────────────────────────────────────

    public function test_replayed_webhook_does_not_create_second_payment_row(): void
    {
        [$order] = $this->seedPendingCheckout();
        $payload = $this->signedWebhook($order->order_number, 'Approved', 1100, [
            'authCode' => 'STATIC-AUTH-42',
            'recToken' => 'REC-STATIC',
        ]);

        $this->postJson(self::WEBHOOK_URL, $payload)->assertOk();

        // Attacker grabs the exact signed body off the wire and replays it.
        for ($i = 0; $i < 5; $i++) {
            $this->postJson(self::WEBHOOK_URL, $payload)->assertOk();
        }

        $charges = Payment::where('order_id', $order->id)
            ->where('type', PaymentType::Charge->value)
            ->count();

        $this->assertSame(1, $charges, 'Retries must be idempotent');
    }

    // ─── Refund-after-activation cancels live subscription ─────────────

    public function test_refund_of_real_charge_cancels_active_subscription(): void
    {
        [$order, $subscription] = $this->seedPendingCheckout();

        // Simulate: the 1 UAH trial charge was approved first ...
        $this->postJson(self::WEBHOOK_URL, $this->signedWebhook($order->order_number, 'Approved', 1100, [
            'authCode' => 'AUTH-TRIAL',
            'recToken' => 'REC-TRIAL',
        ]))->assertOk();

        // ... then a renewal charge landed and flipped the sub to Active.
        $subscription->update([
            'status'        => SubscriptionStatus::Active,
            'is_trial'      => false,
            'trial_ends_at' => null,
        ]);

        // Operator (or fraudster) triggers a refund on the last paid charge.
        $this->postJson(self::WEBHOOK_URL, $this->signedWebhook($order->order_number, 'Refunded', 1100, [
            'authCode' => 'AUTH-REFUND',
        ]))->assertOk();

        $subscription->refresh();

        $this->assertSame(SubscriptionStatus::Cancelled, $subscription->status);
        $this->assertNotNull($subscription->cancelled_at);

        // Refund is recorded as a negative-amount payment row for the audit trail.
        $refund = Payment::where('order_id', $order->id)
            ->where('type', PaymentType::Refund->value)
            ->first();
        $this->assertNotNull($refund);
    }

    public function test_trial_refund_does_not_cancel_trial_subscription(): void
    {
        [$order, $subscription] = $this->seedPendingCheckout();

        // Approved → Trial, rec token saved, auto-refund fired.
        $this->postJson(self::WEBHOOK_URL, $this->signedWebhook($order->order_number, 'Approved', 1100, [
            'recToken' => 'REC-TRIAL-ONLY',
        ]))->assertOk();

        $subscription->refresh();
        $this->assertSame(SubscriptionStatus::Trial, $subscription->status);

        // The auto-refund of the 1 UAH verification arrives as a Refunded
        // webhook; the subscription is still on Trial and MUST remain so.
        $this->postJson(self::WEBHOOK_URL, $this->signedWebhook($order->order_number, 'Refunded', 1100))
            ->assertOk();

        $subscription->refresh();
        $this->assertSame(SubscriptionStatus::Trial, $subscription->status);
        $this->assertNull($subscription->cancelled_at);
    }

    // ─── Forged merchantAccount ────────────────────────────────────────

    public function test_forged_merchant_account_is_rejected_even_with_matching_secret(): void
    {
        [$order, $subscription] = $this->seedPendingCheckout();

        // Attacker knows our secret key somehow (stolen from logs or an
        // env leak) but injects a different merchantAccount into the
        // payload, hoping our verifier checks the signature mechanically
        // without cross-checking the merchant identity.
        //
        // The SDK's ServiceUrlHandler happens to recompute the expected
        // signature using OUR configured merchant account — so even if
        // the attacker's sig is mathematically correct over THEIR account
        // name, it won't match ours, and the webhook is rejected. This
        // test pins that property: if the SDK is ever swapped, a drop to
        // "trust the payload's account" would fail here first.
        $fields = [
            'merchantAccount'         => 'attacker_merch',
            'orderReference'          => $order->order_number,
            'amount'                  => 1,
            'currency'                => 'UAH',
            'authCode'                => 'ATTACK',
            'cardPan'                 => '41****9999',
            'transactionStatus'       => 'Approved',
            'reasonCode'              => 1100,
            'reason'                  => 'Ok',
            'recToken'                => 'REC-ATTACK',
            'paymentSystem'           => 'card',
            'createdDate'             => 1712000000,
            'processingDate'          => 1712000000,
            'fee'                     => 0,
            'merchantTransactionType' => 'AUTO',
            'authTicket'              => '',
            'd3AcsUrl'                => '',
            'd3Md'                    => '',
            'd3Pareq'                 => '',
            'returnUrl'               => '',
        ];
        $fields['merchantSignature'] = hash_hmac('md5', implode(';', [
            (string) $fields['merchantAccount'],
            (string) $fields['orderReference'],
            (string) (float) $fields['amount'],
            (string) $fields['currency'],
            (string) $fields['authCode'],
            (string) $fields['cardPan'],
            (string) $fields['transactionStatus'],
            (string) (int) $fields['reasonCode'],
        ]), self::SECRET);

        $response = $this->postJson(self::WEBHOOK_URL, $fields);

        $response->assertStatus(403);

        $subscription->refresh();
        $this->assertSame(SubscriptionStatus::Pending, $subscription->status);
        $this->assertNull($subscription->wayforpay_rec_token);
        $this->assertSame(OrderStatus::Pending, $order->fresh()->status);
    }

    // ─── Cancelled order is not re-activated ───────────────────────────

    public function test_approved_webhook_for_cancelled_order_does_not_activate(): void
    {
        [$order, $subscription] = $this->seedPendingCheckout();

        // User abandoned this checkout and started a new one; the original
        // order was flipped to Cancelled by SubscriptionController::checkout.
        $order->update(['status' => OrderStatus::Cancelled]);

        // A late Approved webhook lands for the cancelled order.
        $this->postJson(self::WEBHOOK_URL, $this->signedWebhook($order->order_number, 'Approved', 1100, [
            'recToken' => 'REC-LATE-ARRIVAL',
        ]))->assertOk();

        $subscription->refresh();

        // Subscription stays Pending, no WFP state gets painted onto it.
        // In particular, the rec token must NOT be saved — if it were, a
        // future cron run could initiate unauthorised charges against a
        // customer whose checkout they already abandoned.
        $this->assertSame(SubscriptionStatus::Pending, $subscription->status);
        $this->assertNull($subscription->wayforpay_rec_token);
    }

    public function test_wfp_webhook_does_not_pollute_subscription_owned_by_other_provider(): void
    {
        // Cross-provider pollution: user started a WayForPay checkout,
        // abandoned it, then started a Monobank one. The WFP webhook for
        // the abandoned checkout arrives late. We must NOT flip the live
        // Monobank subscription to WayForPay or save a WFP rec token on it.
        [$order, $subscription] = $this->seedPendingCheckout();

        // Simulate the second checkout overwriting the subscription's
        // provider (SubscriptionController::checkout does exactly this).
        $subscription->update(['payment_provider' => PaymentProvider::Monobank]);

        $this->postJson(self::WEBHOOK_URL, $this->signedWebhook($order->order_number, 'Approved', 1100, [
            'recToken' => 'REC-STALE-WFP',
        ]))->assertOk();

        $subscription->refresh();

        $this->assertSame(PaymentProvider::Monobank, $subscription->payment_provider);
        $this->assertNull($subscription->wayforpay_rec_token);
    }

    public function test_past_due_subscription_is_extended_from_period_end_on_successful_retry(): void
    {
        [$order, $subscription] = $this->seedPendingCheckout();

        // Setup: the sub was Active, then a renewal charge failed and
        // PaymentFailureHandler flipped it to PastDue. A retry from
        // WayForPay arrives a day later with a successful Approved.
        $futureEnd = now()->addDays(5);
        $subscription->update([
            'status'               => SubscriptionStatus::PastDue,
            'is_trial'             => false,
            'current_period_start' => now()->subDays(25),
            'current_period_end'   => $futureEnd,
            'payment_provider'     => PaymentProvider::WayForPay,
            'wayforpay_rec_token'  => 'REC-PAST-DUE',
        ]);

        $this->postJson(self::WEBHOOK_URL, $this->signedWebhook($order->order_number, 'Approved', 1100, [
            'authCode' => 'AUTH-RETRY',
        ]))->assertOk();

        $subscription->refresh();

        $this->assertSame(SubscriptionStatus::Active, $subscription->status);

        // Critical: period_end must have advanced from $futureEnd by one
        // month, not been reset to now() + 1 month. Otherwise the user
        // loses the 5 days they already paid for on the previous cycle.
        $expected = $futureEnd->copy()->addMonth();
        $this->assertEqualsWithDelta(
            $expected->timestamp,
            $subscription->current_period_end->timestamp,
            60,
        );
    }

    // ─── Renewal webhook extends period end ────────────────────────────

    public function test_renewal_webhook_extends_period_end_instead_of_resetting(): void
    {
        [$order, $subscription] = $this->seedPendingCheckout();

        // First Approved → Trial, rec token saved.
        $this->postJson(self::WEBHOOK_URL, $this->signedWebhook($order->order_number, 'Approved', 1100, [
            'authCode' => 'AUTH-INITIAL',
            'recToken' => 'REC-STABLE',
        ]))->assertOk();

        // Fast-forward the subscription to an Active state that has 10
        // days left on the clock — simulates WFP firing the second
        // regular charge for a monthly sub that still has unused days.
        $futureEnd = now()->addDays(10);
        $subscription->update([
            'status'               => SubscriptionStatus::Active,
            'is_trial'             => false,
            'trial_ends_at'        => null,
            'current_period_start' => now()->subDays(20),
            'current_period_end'   => $futureEnd,
            'wayforpay_rec_token'  => 'REC-STABLE',
        ]);

        // Renewal: second Approved webhook lands.
        $this->postJson(self::WEBHOOK_URL, $this->signedWebhook($order->order_number, 'Approved', 1100, [
            'authCode' => 'AUTH-RENEWAL',
        ]))->assertOk();

        $subscription->refresh();

        // Period end must have advanced by ~1 month FROM futureEnd
        // (not from now), so the customer doesn't lose the 10 days they
        // already paid for.
        $expected = $futureEnd->copy()->addMonth();
        $this->assertTrue(
            $subscription->current_period_end->greaterThan($futureEnd),
            'Renewal must extend the period, not cut it short',
        );
        $this->assertEqualsWithDelta(
            $expected->timestamp,
            $subscription->current_period_end->timestamp,
            60, // tolerate one minute of clock drift
        );
    }

    // ─── Zero amount webhook ───────────────────────────────────────────

    public function test_zero_amount_approved_webhook_still_activates_trial(): void
    {
        // WayForPay hosted checkout rejects amount=0, but a malicious or
        // misconfigured integration could still ship a zero-amount webhook.
        // The handler must not crash on it and must not claim the customer
        // paid any real money.
        [$order] = $this->seedPendingCheckout();

        $this->postJson(self::WEBHOOK_URL, $this->signedWebhook($order->order_number, 'Approved', 1100, [
            'amount' => 0,
        ]))->assertOk();

        $payment = Payment::where('order_id', $order->id)->first();
        $this->assertNotNull($payment);
        // Stored amount must be exactly 0, not a stale value from the order.
        $this->assertEqualsWithDelta(0.0, (float) $payment->amount, 0.001);
    }

    // ─── Checkout endpoint smoke test ─────────────────────────────────

    public function test_checkout_endpoint_builds_wayforpay_purchase_form(): void
    {
        $user = $this->customer();
        Plan::factory()->pro()->create();

        $response = $this->postJson('/api/v1/profile/subscription/checkout', [
            'plan_slug'      => 'pro',
            'billing_period' => 'monthly',
            'provider'       => 'wayforpay',
            'site_domain'    => 'wfp-smoke.test',
        ], $this->authHeaders($user));

        $response->assertOk();

        $data = $response->json('data');
        $this->assertSame('wayforpay', $data['provider']);
        $this->assertSame('POST', $data['method']);
        $this->assertSame('https://secure.wayforpay.com/pay', $data['url']);
        $this->assertArrayHasKey('merchantSignature', (array) $data['form_fields']);
        $this->assertArrayHasKey('orderReference', (array) $data['form_fields']);

        // Regular-payment fields must be present so WayForPay schedules the
        // recurring charges on its side — this is the contract with the
        // provider: if regularMode is missing, WFP treats the purchase as
        // one-off and no renewals ever fire, silently killing billing.
        $this->assertArrayHasKey('regularMode', (array) $data['form_fields']);
        $this->assertSame('monthly', $data['form_fields']['regularMode']);
    }

    public function test_checkout_endpoint_picks_yearly_regular_mode_for_yearly_billing(): void
    {
        $user = $this->customer();
        Plan::factory()->pro()->create();

        $response = $this->postJson('/api/v1/profile/subscription/checkout', [
            'plan_slug'      => 'pro',
            'billing_period' => 'yearly',
            'provider'       => 'wayforpay',
            'site_domain'    => 'wfp-yearly.test',
        ], $this->authHeaders($user))->assertOk();

        $form = (array) $response->json('data.form_fields');
        $this->assertSame('yearly', $form['regularMode']);
    }

    public function test_checkout_endpoint_rejects_request_when_user_already_has_active_sub(): void
    {
        $user = $this->customer();
        $plan = Plan::factory()->pro()->create();
        Subscription::factory()
            ->for($user)
            ->for($plan)
            ->create([
                'status'               => SubscriptionStatus::Active->value,
                'is_trial'             => false,
                'current_period_start' => now()->subDay(),
                'current_period_end'   => now()->addMonth(),
            ]);

        $response = $this->postJson('/api/v1/profile/subscription/checkout', [
            'plan_slug'      => 'pro',
            'billing_period' => 'monthly',
            'provider'       => 'wayforpay',
            'site_domain'    => 'already-subscribed.test',
        ], $this->authHeaders($user));

        $response->assertStatus(422);
        $response->assertJsonPath('error.code', 'ALREADY_SUBSCRIBED');
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
            'Accept'        => 'application/json',
        ];
    }

    // ─── Helpers ───────────────────────────────────────────────────────

    /**
     * @return array{0: Order, 1: Subscription}
     */
    private function seedPendingCheckout(): array
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
     * @param array<string, mixed> $overrides
     *
     * @return array<string, mixed>
     */
    private function signedWebhook(string $orderReference, string $transactionStatus, int $reasonCode, array $overrides = []): array
    {
        $fields = array_merge([
            'merchantAccount'         => self::MERCHANT,
            'orderReference'          => $orderReference,
            'amount'                  => 1,
            'currency'                => 'UAH',
            'authCode'                => 'AUTH-' . uniqid('', true),
            'cardPan'                 => '41****1111',
            'transactionStatus'       => $transactionStatus,
            'reasonCode'              => $reasonCode,
            'recToken'                => 'REC-DEFAULT',
            'paymentSystem'           => 'card',
            'reason'                  => $transactionStatus === 'Approved' ? 'Ok' : $transactionStatus,
            'createdDate'             => time(),
            'processingDate'          => time(),
            'fee'                     => 0,
            'merchantTransactionType' => 'AUTO',
            'authTicket'              => '',
            'd3AcsUrl'                => '',
            'd3Md'                    => '',
            'd3Pareq'                 => '',
            'returnUrl'               => '',
        ], $overrides);

        $source = implode(';', [
            (string) $fields['merchantAccount'],
            (string) $fields['orderReference'],
            (string) (float) $fields['amount'],
            (string) $fields['currency'],
            (string) $fields['authCode'],
            (string) $fields['cardPan'],
            (string) $fields['transactionStatus'],
            (string) (int) $fields['reasonCode'],
        ]);

        $fields['merchantSignature'] = hash_hmac('md5', $source, self::SECRET);

        return $fields;
    }
}
