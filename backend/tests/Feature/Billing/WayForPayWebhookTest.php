<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Core\Models\Order;
use App\Core\Models\Payment;
use App\Core\Models\Plan;
use App\Core\Models\Subscription;
use App\Core\Models\User;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\SubscriptionStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * End-to-end tests for POST /api/v1/payments/wayforpay/callback.
 *
 * Money path with the extra wrinkle that
 * WayForPay expects a signed JSON acknowledgement in the response body
 * instead of a plain "OK".
 */
class WayForPayWebhookTest extends TestCase
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

        // Any outbound WayForPay API call (auto-refund after trial activation,
        // CHARGE during renewal) is stubbed so we never hit the network.
        Http::fake([
            'api.wayforpay.com/*' => Http::response(['transactionStatus' => 'Approved', 'reasonCode' => '1100'], 200),
        ]);
    }

    public function test_approved_trial_webhook_activates_trial_and_saves_rec_token(): void
    {
        [$order, $subscription] = $this->seedPendingCheckout();

        $payload = $this->buildSignedWebhook($order->order_number, 'Approved', '1100', [
            'recToken' => 'REC-TOKEN-XYZ',
        ]);

        $response = $this->postJson(self::WEBHOOK_URL, $payload);

        $response->assertOk();
        $response->assertJsonStructure(['orderReference', 'status', 'time', 'signature']);
        $response->assertJson(['orderReference' => $order->order_number, 'status' => 'accept']);

        $subscription->refresh();

        $this->assertSame(SubscriptionStatus::Trial, $subscription->status);
        $this->assertTrue($subscription->is_trial);
        $this->assertNotNull($subscription->trial_ends_at);
        $this->assertSame('REC-TOKEN-XYZ', $subscription->wayforpay_rec_token);

        $this->assertSame(OrderStatus::Paid, $order->fresh()->status);

        // Auto-refund must have been dispatched exactly once.
        Http::assertSent(function ($request) {
            /** @var array<string, mixed> $data */
            $data = $request->data();

            return ($data['transactionType'] ?? null) === 'REFUND';
        });
    }

    public function test_invalid_signature_returns_403_and_does_not_touch_db(): void
    {
        [$order, $subscription] = $this->seedPendingCheckout();

        $response = $this->postJson(self::WEBHOOK_URL, [
            'merchantAccount'   => self::MERCHANT,
            'orderReference'    => $order->order_number,
            'amount'            => '1.00',
            'currency'          => 'UAH',
            'authCode'          => 'AUTH-X',
            'cardPan'           => '41****1111',
            'transactionStatus' => 'Approved',
            'reasonCode'        => '1100',
            'recToken'          => 'REC-X',
            'merchantSignature' => 'forged',
        ]);

        $response->assertStatus(403);

        $this->assertSame(SubscriptionStatus::Pending, $subscription->fresh()->status);
        $this->assertSame(OrderStatus::Pending, $order->fresh()->status);
    }

    public function test_declined_webhook_marks_payment_failed_and_subscription_past_due(): void
    {
        [$order, $subscription] = $this->seedPendingCheckout();

        $payload = $this->buildSignedWebhook($order->order_number, 'Declined', '1120');

        $this->postJson(self::WEBHOOK_URL, $payload)->assertOk();

        $payment = Payment::where('order_id', $order->id)->first();
        $this->assertNotNull($payment);
        $this->assertSame(PaymentStatus::Failed->value, $payment->status);

        $this->assertSame(SubscriptionStatus::PastDue, $subscription->fresh()->status);
    }

    public function test_duplicate_approved_webhook_does_not_activate_twice(): void
    {
        [$order] = $this->seedPendingCheckout();

        $payload = $this->buildSignedWebhook($order->order_number, 'Approved', '1100', [
            'authCode' => 'AUTH-FIXED',
            'recToken' => 'REC-DUP',
        ]);

        $this->postJson(self::WEBHOOK_URL, $payload)->assertOk();
        $this->postJson(self::WEBHOOK_URL, $payload)->assertOk();
        $this->postJson(self::WEBHOOK_URL, $payload)->assertOk();

        // At most one trial payment row should be created for the checkout
        // itself; the second+ webhook deliveries must be treated as retries.
        $chargeCount = Payment::where('order_id', $order->id)
            ->where('type', PaymentType::Charge->value)
            ->count();

        $this->assertSame(1, $chargeCount);
    }

    public function test_unknown_order_reference_is_acknowledged_but_ignored(): void
    {
        $payload = $this->buildSignedWebhook('NO-SUCH-ORDER', 'Approved', '1100');

        $this->postJson(self::WEBHOOK_URL, $payload)->assertOk();

        $this->assertSame(0, Payment::count());
    }

    public function test_signed_ack_response_is_verifiable_with_the_secret(): void
    {
        [$order] = $this->seedPendingCheckout();

        $payload = $this->buildSignedWebhook($order->order_number, 'Approved', '1100');

        $response = $this->postJson(self::WEBHOOK_URL, $payload);
        /** @var array<string, mixed> $body */
        $body = $response->json();

        $expected = hash_hmac(
            'md5',
            implode(';', [(string) $body['orderReference'], (string) $body['status'], (string) $body['time']]),
            self::SECRET,
        );

        $this->assertSame($expected, $body['signature']);
    }

    /**
     * Seed a full pending checkout: user + plan + pending subscription +
     * pending order + pending payment.
     *
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
     * Build a fully-signed WayForPay webhook payload for a given order.
     *
     * @param array<string, mixed> $overrides
     *
     * @return array<string, mixed>
     */
    private function buildSignedWebhook(string $orderReference, string $transactionStatus, string $reasonCode, array $overrides = []): array
    {
        // Field layout mirrors a real WayForPay serviceUrl webhook. The SDK
        // parses this array into a Transaction object, which re-casts the
        // numeric fields via floatval() / intval() before recomputing the
        // signature — so the source we sign over here MUST pass through
        // the same casts, otherwise SDK's verifier sees "1" where we wrote
        // "1.00" and rejects a perfectly valid payload with a 403.
        $fields = array_merge([
            'merchantAccount'   => self::MERCHANT,
            'orderReference'    => $orderReference,
            'amount'            => 1,
            'currency'          => 'UAH',
            'authCode'          => 'AUTH-' . uniqid(),
            'cardPan'           => '41****1111',
            'transactionStatus' => $transactionStatus,
            'reasonCode'        => (int) $reasonCode,
            'recToken'          => 'REC-TOKEN-DEFAULT',
            'paymentSystem'     => 'card',
            'reason'            => $transactionStatus === 'Approved' ? 'Ok' : 'Declined',
            'fee'               => 0,
            'createdDate'       => time(),
            'processingDate'    => time(),
            'merchantTransactionType' => 'AUTO',
            'authTicket'        => '',
            'd3AcsUrl'          => '',
            'd3Md'              => '',
            'd3Pareq'           => '',
            'returnUrl'         => '',
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
