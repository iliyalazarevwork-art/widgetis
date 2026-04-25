<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Core\Models\Subscription;
use App\Enums\PaymentProvider;
use App\Enums\SubscriptionStatus;
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

    public function test_monobank_subscriptions_are_skipped(): void
    {
        Http::fake();

        Subscription::factory()->create([
            'payment_provider' => PaymentProvider::Monobank,
            'current_period_end' => now()->addHours(12),
            'status' => SubscriptionStatus::Active,
            'payment_provider_subscription_id' => 'mono_sub_123',
        ]);

        $this->artisan('subscriptions:charge-recurring')
            ->expectsOutputToContain('Skipped 1')
            ->assertSuccessful();

        Http::assertNothingSent();
    }

    public function test_wayforpay_subscriptions_are_skipped(): void
    {
        Http::fake();

        Subscription::factory()->create([
            'payment_provider' => PaymentProvider::WayForPay,
            'current_period_end' => now()->addHours(12),
            'status' => SubscriptionStatus::Active,
        ]);

        $this->artisan('subscriptions:charge-recurring')
            ->expectsOutputToContain('Skipped 1')
            ->assertSuccessful();

        Http::assertNothingSent();
    }

    public function test_subscriptions_with_future_period_are_not_touched(): void
    {
        Http::fake();

        $subscription = Subscription::factory()->create([
            'payment_provider' => PaymentProvider::Monobank,
            'current_period_end' => now()->addDays(10),
            'status' => SubscriptionStatus::Active,
        ]);

        $this->artisan('subscriptions:charge-recurring')
            ->assertSuccessful();

        Http::assertNothingSent();
        $this->assertSame(0, $subscription->fresh()->payment_retry_count);
    }
}
