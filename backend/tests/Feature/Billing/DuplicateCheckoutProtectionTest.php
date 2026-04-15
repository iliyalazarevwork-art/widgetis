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
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Guards against double-payment and plan-switch blocking bugs.
 *
 * Covers two layers of protection:
 *
 * 1. Checkout side — when the user starts a new checkout while an
 *    unfinished one exists (e.g. they left the payment page), the old
 *    pending order is cancelled automatically. No CHECKOUT_IN_PROGRESS
 *    error is ever returned; the user can switch plans freely.
 *
 * 2. Webhook side — if a success webhook arrives for a cancelled order
 *    (the payment page was completed after the user had already started
 *    a second checkout), the subscription must NOT be activated and the
 *    event must be logged for manual review.
 *
 * The intent: a user can NEVER be charged twice for the same period and
 * can NEVER be stuck in a state where they cannot switch to a cheaper plan.
 */
class DuplicateCheckoutProtectionTest extends TestCase
{
    use RefreshDatabase;

    private const LIQPAY_PRIVATE_KEY = 'sandbox_PrivateKeyXXX';
    private const LIQPAY_WEBHOOK_URL = '/api/v1/payments/liqpay/callback';
    private const CHECKOUT_URL = '/api/v1/profile/subscription/checkout';

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('services.liqpay.public_key', 'sandbox_ipub');
        Config::set('services.liqpay.private_key', self::LIQPAY_PRIVATE_KEY);
        Config::set('services.liqpay.sandbox', true);
        Config::set('app.url', 'https://app.test');
        Config::set('monobank.token', 'fake-merchant-token');
        Config::set('monobank.webhook_url', 'https://app.test/api/v1/webhooks/monobank');
        Config::set('monobank.redirect_url', 'https://app.test/cabinet/billing');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Checkout-side: old pending order is cancelled, never blocks the user
    // ─────────────────────────────────────────────────────────────────────────

    public function test_second_checkout_cancels_the_first_pending_order(): void
    {
        $user = $this->customer();
        $plan = Plan::factory()->pro()->create();

        // First checkout — user gets a payment URL, then closes the browser.
        $first = $this->postJson(self::CHECKOUT_URL, [
            'plan_slug'      => $plan->slug,
            'billing_period' => 'yearly',
            'provider'       => 'liqpay',
            'site_domain'    => 'mystore.com.ua',
        ], $this->authHeaders($user));

        $first->assertOk();
        $firstOrder = Order::where('user_id', $user->id)->sole();
        $this->assertSame(OrderStatus::Pending, $firstOrder->status);

        // Second checkout — user returns and chooses a monthly plan instead.
        $second = $this->postJson(self::CHECKOUT_URL, [
            'plan_slug'      => $plan->slug,
            'billing_period' => 'monthly',
            'provider'       => 'liqpay',
            'site_domain'    => 'mystore.com.ua',
        ], $this->authHeaders($user));

        $second->assertOk();

        // First order must be cancelled so its payment page cannot activate anything.
        $this->assertSame(OrderStatus::Cancelled, $firstOrder->fresh()->status);

        // A new pending order was created for the monthly plan.
        $this->assertSame(2, Order::where('user_id', $user->id)->count());
        $newOrder = Order::where('user_id', $user->id)
            ->where('status', OrderStatus::Pending)
            ->sole();
        $this->assertSame('monthly', $newOrder->billing_period);
    }

    public function test_second_checkout_cancels_pending_payment_of_the_first_order(): void
    {
        $user = $this->customer();
        $plan = Plan::factory()->pro()->create();

        $this->postJson(self::CHECKOUT_URL, [
            'plan_slug'      => $plan->slug,
            'billing_period' => 'monthly',
            'provider'       => 'liqpay',
            'site_domain'    => 'mystore.com.ua',
        ], $this->authHeaders($user))->assertOk();

        $firstOrder = Order::where('user_id', $user->id)->sole();
        $firstPayment = Payment::where('order_id', $firstOrder->id)->sole();
        $this->assertSame(PaymentStatus::Pending->value, $firstPayment->status);

        // Start a second checkout.
        $this->postJson(self::CHECKOUT_URL, [
            'plan_slug'      => $plan->slug,
            'billing_period' => 'monthly',
            'provider'       => 'liqpay',
            'site_domain'    => 'mystore.com.ua',
        ], $this->authHeaders($user))->assertOk();

        // First payment must be marked failed so the webhook guard can ignore it.
        $this->assertSame(PaymentStatus::Failed->value, $firstPayment->fresh()->status);
    }

    public function test_second_checkout_resets_stuck_pending_subscription(): void
    {
        $user = $this->customer();
        $plan = Plan::factory()->pro()->create();

        // Simulate state left by an abandoned yearly checkout.
        Subscription::factory()->for($user)->for($plan)->pending()->yearly()->create();

        $this->postJson(self::CHECKOUT_URL, [
            'plan_slug'      => $plan->slug,
            'billing_period' => 'monthly',
            'provider'       => 'liqpay',
            'site_domain'    => 'mystore.com.ua',
        ], $this->authHeaders($user))->assertOk();

        $subscription = Subscription::where('user_id', $user->id)->sole();

        // A fresh Pending subscription was created for the new monthly plan.
        $this->assertSame(SubscriptionStatus::Pending, $subscription->status);
        $this->assertSame('monthly', $subscription->billing_period);
    }

    public function test_user_can_switch_to_cheaper_plan_when_pending_yearly_checkout_exists(): void
    {
        // This is the exact user-facing bug: "не могу вибрати інший тариф".
        $user = $this->customer();
        $yearlyPlan = Plan::factory()->pro()->create();
        $monthlyPlan = Plan::factory()->basic()->create();

        // User attempts yearly plan but has no money — leaves the payment page.
        $this->postJson(self::CHECKOUT_URL, [
            'plan_slug'      => $yearlyPlan->slug,
            'billing_period' => 'yearly',
            'provider'       => 'liqpay',
            'site_domain'    => 'mystore.com.ua',
        ], $this->authHeaders($user))->assertOk();

        // User returns and picks a cheaper monthly plan.
        $response = $this->postJson(self::CHECKOUT_URL, [
            'plan_slug'      => $monthlyPlan->slug,
            'billing_period' => 'monthly',
            'provider'       => 'liqpay',
            'site_domain'    => 'mystore.com.ua',
        ], $this->authHeaders($user));

        $response->assertOk();
        $response->assertJsonPath('data.provider', 'liqpay');

        // Subscription now points at the new plan.
        $subscription = Subscription::where('user_id', $user->id)->sole();
        $this->assertSame($monthlyPlan->id, $subscription->plan_id);
        $this->assertSame('monthly', $subscription->billing_period);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Webhook side: cancelled-order webhook must never activate subscription
    // ─────────────────────────────────────────────────────────────────────────

    public function test_liqpay_success_webhook_for_cancelled_order_does_not_activate_subscription(): void
    {
        // Simulate the race: user abandoned checkout #1, then started checkout #2.
        // We already cancelled Order #1 at checkout time. Now the success
        // webhook for Order #1 arrives anyway (e.g., user paid on the old tab).
        $user = $this->customer();
        $plan = Plan::factory()->pro()->create();

        $cancelledOrder = Order::factory()->for($user)->for($plan)->create([
            'status'         => OrderStatus::Cancelled,
            'billing_period' => 'monthly',
        ]);

        // Subscription currently belongs to the NEW checkout — Pending.
        $subscription = Subscription::factory()->for($user)->for($plan)->pending()->create();

        // LiqPay fires success for the old (cancelled) order.
        $this->postJson(self::LIQPAY_WEBHOOK_URL, $this->liqpayPayload($cancelledOrder->order_number, 'success'))
            ->assertOk();

        // Subscription must remain Pending — not activated by the stale webhook.
        $this->assertSame(
            SubscriptionStatus::Pending,
            $subscription->fresh()->status,
            'A cancelled order\'s success webhook must not activate the subscription.',
        );
        // Cancelled order status must not change.
        $this->assertSame(OrderStatus::Cancelled, $cancelledOrder->fresh()->status);
    }

    public function test_liqpay_success_webhook_for_cancelled_order_does_not_create_payment(): void
    {
        $user = $this->customer();
        $plan = Plan::factory()->pro()->create();

        $cancelledOrder = Order::factory()->for($user)->for($plan)->create([
            'status' => OrderStatus::Cancelled,
        ]);

        $this->postJson(self::LIQPAY_WEBHOOK_URL, $this->liqpayPayload($cancelledOrder->order_number, 'success'))
            ->assertOk();

        // No success payment record must be created for a cancelled order.
        $this->assertSame(
            0,
            Payment::where('order_id', $cancelledOrder->id)
                ->where('status', PaymentStatus::Success->value)
                ->count(),
        );
    }

    public function test_both_webhooks_arrive_only_the_valid_order_activates_subscription(): void
    {
        // Simulates the full double-payment race:
        //   1. User starts checkout → Order #1
        //   2. User switches plan   → Order #1 cancelled, Order #2 created
        //   3. Both payment pages happen to complete (very rare)
        //   4. Webhook for Order #2 arrives first → subscription activated
        //   5. Webhook for Order #1 arrives second → must be ignored
        $user = $this->customer();
        $plan = Plan::factory()->pro()->create();

        // Order #1 — cancelled because user switched plans.
        $cancelledOrder = Order::factory()->for($user)->for($plan)->create([
            'status'         => OrderStatus::Cancelled,
            'billing_period' => 'yearly',
            'amount'         => 4990,
        ]);
        Payment::factory()->for($user)->for($cancelledOrder)->create([
            'status' => PaymentStatus::Failed->value,
        ]);

        // Order #2 — the one the user actually intended to pay.
        $validOrder = Order::factory()->for($user)->for($plan)->create([
            'status'         => OrderStatus::Pending,
            'billing_period' => 'monthly',
            'amount'         => 499,
        ]);
        $subscription = Subscription::factory()->for($user)->for($plan)->pending()->create();
        Payment::factory()->for($user)->for($validOrder)->for($subscription)->create([
            'status' => PaymentStatus::Pending->value,
        ]);

        // Webhook for Order #2 arrives first → activates subscription.
        $this->postJson(self::LIQPAY_WEBHOOK_URL, $this->liqpayPayload($validOrder->order_number, 'success'))
            ->assertOk();

        $this->assertSame(SubscriptionStatus::Active, $subscription->fresh()->status);
        $this->assertSame(OrderStatus::Paid, $validOrder->fresh()->status);

        // Webhook for Order #1 arrives second → subscription must stay Active,
        // not be overwritten or double-counted.
        $this->postJson(self::LIQPAY_WEBHOOK_URL, $this->liqpayPayload($cancelledOrder->order_number, 'success'))
            ->assertOk();

        // Still Active — not reset, not duplicated.
        $this->assertSame(SubscriptionStatus::Active, $subscription->fresh()->status);
        $this->assertSame(OrderStatus::Cancelled, $cancelledOrder->fresh()->status);

        // Exactly one success payment in total (for Order #2 only).
        $successCount = Payment::where('user_id', $user->id)
            ->where('status', PaymentStatus::Success->value)
            ->count();
        $this->assertSame(1, $successCount, 'Exactly one success payment must exist after both webhooks.');
    }

    public function test_duplicate_checkout_requests_produce_one_active_subscription(): void
    {
        // Simulates a user double-clicking "Pay" on the frontend.
        // Two checkout requests fire in rapid succession. The second cancels
        // the first order. Then the webhook for the surviving order arrives
        // and exactly one Active subscription must exist.
        $user = $this->customer();
        $plan = Plan::factory()->pro()->create();

        $this->postJson(self::CHECKOUT_URL, [
            'plan_slug'      => $plan->slug,
            'billing_period' => 'monthly',
            'provider'       => 'liqpay',
            'site_domain'    => 'mystore.com.ua',
        ], $this->authHeaders($user))->assertOk();

        $this->postJson(self::CHECKOUT_URL, [
            'plan_slug'      => $plan->slug,
            'billing_period' => 'monthly',
            'provider'       => 'liqpay',
            'site_domain'    => 'mystore.com.ua',
        ], $this->authHeaders($user))->assertOk();

        // The only Pending order is the second one — first was cancelled.
        $pendingOrder = Order::where('user_id', $user->id)
            ->where('status', OrderStatus::Pending)
            ->sole();

        // Webhook fires for the surviving order.
        $this->postJson(self::LIQPAY_WEBHOOK_URL, $this->liqpayPayload($pendingOrder->order_number, 'success'))
            ->assertOk();

        // One subscription, Active.
        $this->assertSame(1, Subscription::where('user_id', $user->id)->count());
        $this->assertSame(
            SubscriptionStatus::Active,
            Subscription::where('user_id', $user->id)->sole()->status,
        );

        // One success payment.
        $this->assertSame(
            1,
            Payment::where('user_id', $user->id)
                ->where('status', PaymentStatus::Success->value)
                ->count(),
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

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
        return [
            'Authorization' => 'Bearer ' . JWTAuth::fromUser($user),
            'Accept'        => 'application/json',
        ];
    }

    /**
     * Build a valid signed LiqPay webhook payload.
     *
     * @param array<string, mixed> $overrides
     * @return array{data: string, signature: string}
     */
    private function liqpayPayload(string $orderNumber, string $status, array $overrides = []): array
    {
        $raw = array_merge([
            'order_id'       => $orderNumber,
            'status'         => $status,
            'action'         => 'subscribe',
            'amount'         => 499,
            'currency'       => 'UAH',
            'transaction_id' => 'TXN-' . fake()->unique()->numerify('########'),
            'subscrId'       => 'EMULATED-SUBSCR-' . fake()->unique()->numerify('######'),
            'paytype'        => 'card',
            'description'    => 'Widgetis test',
        ], $overrides);

        $data      = base64_encode((string) json_encode($raw));
        $signature = base64_encode(sha1(self::LIQPAY_PRIVATE_KEY . $data . self::LIQPAY_PRIVATE_KEY, true));

        return ['data' => $data, 'signature' => $signature];
    }
}
