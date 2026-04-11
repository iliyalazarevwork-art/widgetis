<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Enums\BillingPeriod;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Plan;
use App\Services\Billing\LiqPayService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

/**
 * Full-stack checkout payload tests — verifies the DB-backed portion of
 * LiqPayService::createSubscriptionCheckout.
 */
class LiqPayCheckoutTest extends TestCase
{
    use RefreshDatabase;

    private const PUBLIC_KEY = 'sandbox_i12345678901';
    private const PRIVATE_KEY = 'sandbox_PrivateKeyXXX';

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('services.liqpay.public_key', self::PUBLIC_KEY);
        Config::set('services.liqpay.private_key', self::PRIVATE_KEY);
        Config::set('services.liqpay.sandbox', true);
    }

    public function test_monthly_checkout_payload_is_signed_with_sandbox_flag(): void
    {
        $plan = Plan::factory()->pro()->create();
        $order = Order::factory()->for($plan)->create([
            'amount' => $plan->price_monthly,
            'billing_period' => BillingPeriod::Monthly->value,
            'status' => OrderStatus::Pending,
        ]);

        $checkout = (new LiqPayService())->createSubscriptionCheckout(
            order: $order,
            plan: $plan,
            billingPeriod: BillingPeriod::Monthly,
            serverUrl: 'https://app.test/api/v1/payments/liqpay/callback',
            resultUrl: 'https://app.test/liqpay/return',
            withTrial: false,
        );

        $this->assertSame('https://www.liqpay.ua/api/3/checkout', $checkout['checkout_url']);
        $this->assertSame($order->order_number, $checkout['order_id']);

        $decoded = json_decode((string) base64_decode($checkout['data'], true), true);
        $this->assertIsArray($decoded);
        $this->assertSame('subscribe', $decoded['action']);
        $this->assertSame((float) $plan->price_monthly, (float) $decoded['amount']);
        $this->assertSame('UAH', $decoded['currency']);
        $this->assertSame($order->order_number, $decoded['order_id']);
        $this->assertSame('month', $decoded['subscribe_periodicity']);
        $this->assertSame(1, $decoded['sandbox']);

        $expectedSig = base64_encode(sha1(self::PRIVATE_KEY.$checkout['data'].self::PRIVATE_KEY, true));
        $this->assertSame($expectedSig, $checkout['signature']);
    }

    public function test_yearly_checkout_uses_year_periodicity_and_yearly_price(): void
    {
        $plan = Plan::factory()->pro()->create();
        $order = Order::factory()->for($plan)->yearly()->create([
            'amount' => $plan->price_yearly,
        ]);

        $checkout = (new LiqPayService())->createSubscriptionCheckout(
            order: $order,
            plan: $plan,
            billingPeriod: BillingPeriod::Yearly,
            serverUrl: 'https://app.test/api/v1/payments/liqpay/callback',
            resultUrl: 'https://app.test/liqpay/return',
        );

        $decoded = json_decode((string) base64_decode($checkout['data'], true), true);
        $this->assertSame('year', $decoded['subscribe_periodicity']);
        $this->assertSame((float) $plan->price_yearly, (float) $decoded['amount']);
    }

    public function test_checkout_with_trial_defers_first_charge(): void
    {
        $plan = Plan::factory()->pro()->create(['trial_days' => 14]);
        $order = Order::factory()->for($plan)->create(['amount' => $plan->price_monthly]);

        $checkout = (new LiqPayService())->createSubscriptionCheckout(
            order: $order,
            plan: $plan,
            billingPeriod: BillingPeriod::Monthly,
            serverUrl: 'x',
            resultUrl: 'y',
            withTrial: true,
            trialDays: 14,
        );

        $decoded = json_decode((string) base64_decode($checkout['data'], true), true);
        $this->assertArrayHasKey('subscribe_date_start', $decoded);
        $this->assertGreaterThan(
            now()->addDays(13)->timestamp,
            strtotime((string) $decoded['subscribe_date_start']),
        );
    }

    public function test_checkout_without_sandbox_flag_when_disabled(): void
    {
        Config::set('services.liqpay.sandbox', false);

        $plan = Plan::factory()->pro()->create();
        $order = Order::factory()->for($plan)->create(['amount' => $plan->price_monthly]);

        $checkout = (new LiqPayService())->createSubscriptionCheckout(
            order: $order,
            plan: $plan,
            billingPeriod: BillingPeriod::Monthly,
            serverUrl: 'x',
            resultUrl: 'y',
        );

        $decoded = json_decode((string) base64_decode($checkout['data'], true), true);
        $this->assertArrayNotHasKey('sandbox', $decoded);
    }
}
