<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Enums\PaymentProvider;
use App\Enums\SubscriptionStatus;
use App\Models\Order;
use App\Models\Subscription;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ChargeRecurringTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('monobank.token', 'fake-merchant-token');
    }

    public function test_liqpay_subscriptions_are_skipped(): void
    {
        Http::fake();

        Subscription::factory()->create([
            'payment_provider' => PaymentProvider::LiqPay,
            'current_period_end' => now()->addHours(12),
            'status' => SubscriptionStatus::Active,
        ]);

        $this->artisan('subscriptions:charge-recurring')
            ->expectsOutputToContain('Skipped 1')
            ->assertSuccessful();

        Http::assertNothingSent();
    }

    public function test_monobank_subscription_is_dispatched_and_retry_reset(): void
    {
        Http::fake([
            'api.monobank.ua/api/merchant/wallet/payment' => Http::response([
                'invoiceId' => 'p2_recurring_999',
                'status' => 'processing',
            ]),
        ]);

        $subscription = Subscription::factory()->create([
            'payment_provider' => PaymentProvider::Monobank,
            'monobank_card_token' => 'card_tok_abc',
            'current_period_end' => now()->addHours(12),
            'status' => SubscriptionStatus::Active,
            'payment_retry_count' => 2,
            'next_payment_retry_at' => now()->subDay(),
        ]);

        $this->artisan('subscriptions:charge-recurring')
            ->expectsOutputToContain('Processed 1')
            ->assertSuccessful();

        $subscription->refresh();
        $this->assertSame(0, $subscription->payment_retry_count);
        // Cooldown window is set (not null) so the next cron run cannot
        // re-select this subscription before the webhook arrives.
        $this->assertNotNull($subscription->next_payment_retry_at);
        $this->assertTrue($subscription->next_payment_retry_at->isAfter(now()->addHours(20)));

        Http::assertSent(function ($request): bool {
            $body = $request->data();
            return str_contains((string) $request->url(), 'wallet/payment')
                && ($body['cardToken'] ?? null) === 'card_tok_abc'
                && ($body['initiationKind'] ?? null) === 'merchant';
        });
    }

    public function test_monobank_failure_increments_retry_and_eventually_goes_past_due(): void
    {
        Http::fake([
            'api.monobank.ua/api/merchant/wallet/payment' => Http::response(
                ['errCode' => 'CARD_EXPIRED', 'errText' => 'Card is expired'],
                400,
            ),
        ]);

        $subscription = Subscription::factory()->create([
            'payment_provider' => PaymentProvider::Monobank,
            'monobank_card_token' => 'card_tok_abc',
            'current_period_end' => now()->addHours(12),
            'status' => SubscriptionStatus::Active,
            'payment_retry_count' => 2,
        ]);

        $this->artisan('subscriptions:charge-recurring')
            ->assertSuccessful();

        $subscription->refresh();
        $this->assertSame(3, $subscription->payment_retry_count);
        $this->assertSame(SubscriptionStatus::PastDue, $subscription->status);
        $this->assertNotNull($subscription->grace_period_ends_at);
        $this->assertNull($subscription->next_payment_retry_at);
    }

    public function test_subscription_without_card_token_reports_failure(): void
    {
        Http::fake();

        Subscription::factory()->create([
            'payment_provider' => PaymentProvider::Monobank,
            'monobank_card_token' => null,
            'current_period_end' => now()->addHours(12),
            'status' => SubscriptionStatus::Active,
        ]);

        $this->artisan('subscriptions:charge-recurring')
            ->assertSuccessful();

        Http::assertNothingSent();
    }

    public function test_recurring_charge_creates_order_with_matching_reference(): void
    {
        Http::fake([
            'api.monobank.ua/api/merchant/wallet/payment' => Http::response([
                'invoiceId' => 'p2_recurring_order_check',
                'status' => 'processing',
            ]),
        ]);

        $subscription = Subscription::factory()->create([
            'payment_provider' => PaymentProvider::Monobank,
            'monobank_card_token' => 'card_tok_abc',
            'current_period_end' => now()->addHours(12),
            'status' => SubscriptionStatus::Active,
        ]);

        $this->assertSame(0, Order::where('user_id', $subscription->user_id)->count());

        $this->artisan('subscriptions:charge-recurring')->assertSuccessful();

        // The cron creates a fresh Order row so the webhook can later
        // match it by order_number — without this, recurring webhooks
        // would drop as "order_not_found".
        $order = Order::where('user_id', $subscription->user_id)->sole();
        $this->assertSame(PaymentProvider::Monobank, $order->payment_provider);

        Http::assertSent(function ($request) use ($order): bool {
            $body = $request->data();
            return isset($body['merchantPaymInfo']['reference'])
                && $body['merchantPaymInfo']['reference'] === $order->order_number;
        });
    }

    public function test_monobank_sync_failure_status_is_treated_as_failure(): void
    {
        // Monobank can return HTTP 200 with a terminal failure status —
        // the cron must NOT park the subscription in cooldown in that case.
        Http::fake([
            'api.monobank.ua/api/merchant/wallet/payment' => Http::response([
                'invoiceId' => 'p2_sync_fail',
                'status' => 'failure',
            ]),
        ]);

        $subscription = Subscription::factory()->create([
            'payment_provider' => PaymentProvider::Monobank,
            'monobank_card_token' => 'card_tok_abc',
            'current_period_end' => now()->addHours(12),
            'status' => SubscriptionStatus::Active,
            'payment_retry_count' => 0,
        ]);

        $this->artisan('subscriptions:charge-recurring')->assertSuccessful();

        $subscription->refresh();
        // Retry counter bumped (not reset) — sync failure is treated as
        // a real failure, not a successful dispatch.
        $this->assertSame(1, $subscription->payment_retry_count);
    }

    public function test_subscriptions_with_future_period_are_not_touched(): void
    {
        Http::fake();

        $subscription = Subscription::factory()->create([
            'payment_provider' => PaymentProvider::Monobank,
            'monobank_card_token' => 'card_tok_abc',
            'current_period_end' => now()->addDays(10),
            'status' => SubscriptionStatus::Active,
        ]);

        $this->artisan('subscriptions:charge-recurring')
            ->assertSuccessful();

        Http::assertNothingSent();
        $this->assertSame(0, $subscription->fresh()->payment_retry_count);
    }
}
