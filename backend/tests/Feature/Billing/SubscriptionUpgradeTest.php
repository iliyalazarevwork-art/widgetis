<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Enums\BillingPeriod;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use App\Exceptions\UpgradeNotAllowedException;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Billing\SubscriptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class SubscriptionUpgradeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();
        // Freeze on a mid-month day so subDays(15)+addMonth() lands on a
        // stable 30-day period regardless of when the test runs.
        Carbon::setTestNow('2026-04-17 12:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function customer(): User
    {
        $user = User::factory()->create();
        $user->assignRole(UserRole::Customer->value);

        return $user;
    }

    private function seedSubscription(User $user, Plan $plan, BillingPeriod $period, int $daysIntoPeriod): Subscription
    {
        $start = now()->subDays($daysIntoPeriod);
        $end = $period === BillingPeriod::Yearly ? $start->copy()->addYear() : $start->copy()->addMonth();

        $subscription = Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'billing_period' => $period->value,
            'status' => SubscriptionStatus::Active,
            'is_trial' => false,
            'current_period_start' => $start,
            'current_period_end' => $end,
        ]);

        $amount = $period === BillingPeriod::Yearly ? $plan->price_yearly : $plan->price_monthly;

        Order::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'billing_period' => $period->value,
            'amount' => $amount,
            'status' => OrderStatus::Paid,
            'paid_at' => $start,
        ]);

        return $subscription;
    }

    public function test_calculate_upgrade_credits_unused_portion_and_floors_down(): void
    {
        $user = $this->customer();
        $basic = Plan::factory()->basic()->create(['price_monthly' => 300]);
        $pro = Plan::factory()->pro()->create(['price_monthly' => 1000]);

        // Halfway through a monthly period → 50% credit of the 300 UAH paid.
        $subscription = $this->seedSubscription($user, $basic, BillingPeriod::Monthly, 15);

        $quote = app(SubscriptionService::class)->calculateUpgrade(
            $subscription->load('plan'),
            $pro,
            BillingPeriod::Monthly,
        );

        $this->assertSame(1000, $quote->targetAmount);
        // 15 days remaining / 30 total * 300 = 150 → floored stays 150.
        $this->assertSame(150, $quote->creditApplied);
        $this->assertSame(850, $quote->amountDue);
    }

    public function test_downgrade_is_blocked(): void
    {
        $user = $this->customer();
        $pro = Plan::factory()->pro()->create();
        $basic = Plan::factory()->basic()->create();

        $subscription = $this->seedSubscription($user, $pro, BillingPeriod::Monthly, 10);

        $this->expectException(UpgradeNotAllowedException::class);
        app(SubscriptionService::class)->calculateUpgrade(
            $subscription->load('plan'),
            $basic,
            BillingPeriod::Monthly,
        );
    }

    public function test_same_plan_same_period_is_blocked(): void
    {
        $user = $this->customer();
        $basic = Plan::factory()->basic()->create();

        $subscription = $this->seedSubscription($user, $basic, BillingPeriod::Monthly, 5);

        $this->expectException(UpgradeNotAllowedException::class);
        app(SubscriptionService::class)->calculateUpgrade(
            $subscription->load('plan'),
            $basic,
            BillingPeriod::Monthly,
        );
    }

    public function test_trial_cannot_upgrade_through_service(): void
    {
        $user = $this->customer();
        $basic = Plan::factory()->basic()->create();
        $pro = Plan::factory()->pro()->create();

        $subscription = Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $basic->id,
            'billing_period' => BillingPeriod::Monthly->value,
            'status' => SubscriptionStatus::Trial,
            'is_trial' => true,
            'trial_ends_at' => now()->addDays(3),
            'current_period_start' => now()->subDays(4),
            'current_period_end' => now()->addDays(3),
        ]);

        $this->expectException(UpgradeNotAllowedException::class);
        app(SubscriptionService::class)->calculateUpgrade(
            $subscription->load('plan'),
            $pro,
            BillingPeriod::Monthly,
        );
    }

    public function test_upgrade_endpoint_rejects_downgrade(): void
    {
        $user = $this->customer();
        $pro = Plan::factory()->pro()->create();
        $basic = Plan::factory()->basic()->create();

        $this->seedSubscription($user, $pro, BillingPeriod::Monthly, 5);

        $response = $this->actingAs($user, 'api')->postJson('/api/v1/profile/subscription/upgrade', [
            'plan_slug' => $basic->slug,
            'billing_period' => 'monthly',
            'provider' => 'monobank',
        ]);

        $response->assertStatus(422);
        $this->assertSame('DOWNGRADE_NOT_ALLOWED', $response->json('error.code'));
    }

    public function test_upgrade_preview_returns_quote(): void
    {
        $user = $this->customer();
        $basic = Plan::factory()->basic()->create(['price_monthly' => 300]);
        $pro = Plan::factory()->pro()->create(['price_monthly' => 1000]);

        $this->seedSubscription($user, $basic, BillingPeriod::Monthly, 10);

        $response = $this->actingAs($user, 'api')->getJson(
            "/api/v1/profile/subscription/upgrade-preview?plan_slug={$pro->slug}&billing_period=monthly",
        );

        $response->assertOk();
        $response->assertJsonPath('data.to_plan_slug', $pro->slug);
        $response->assertJsonPath('data.target_amount', 1000);
        $this->assertGreaterThan(0, $response->json('data.credit_applied'));
    }

    public function test_public_change_and_prorate_routes_are_removed(): void
    {
        $user = $this->customer();

        $change = $this->actingAs($user, 'api')->postJson('/api/v1/profile/subscription/change', [
            'plan_slug' => 'pro',
        ]);
        $this->assertContains($change->status(), [404, 405]);

        $prorate = $this->actingAs($user, 'api')->getJson(
            '/api/v1/profile/subscription/prorate?target_plan_slug=pro',
        );
        $this->assertContains($prorate->status(), [404, 405]);
    }

    public function test_apply_upgrade_via_activation_service_swaps_plan_and_resets_period(): void
    {
        $user = $this->customer();
        $basic = Plan::factory()->basic()->create(['price_monthly' => 300]);
        $pro = Plan::factory()->pro()->create(['price_monthly' => 1000]);

        $subscription = $this->seedSubscription($user, $basic, BillingPeriod::Monthly, 10);

        $order = Order::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $pro->id,
            'billing_period' => BillingPeriod::Monthly->value,
            'amount' => 800,
            'status' => OrderStatus::Pending,
            'notes' => [
                'upgrade' => true,
                'from_plan_slug' => $basic->slug,
                'to_plan_slug' => $pro->slug,
                'old_payment_provider' => null,
                'old_payment_provider_subscription_id' => null,
            ],
        ]);

        Payment::factory()->create([
            'user_id' => $user->id,
            'order_id' => $order->id,
            'subscription_id' => $subscription->id,
            'type' => PaymentType::Upgrade->value,
            'amount' => 800,
            'status' => PaymentStatus::Pending->value,
        ]);

        $activation = app(\App\Services\Billing\SubscriptionActivationService::class);
        $this->assertTrue($activation->isUpgradeOrder($order));

        $result = $activation->applyUpgrade(
            order: $order,
            transactionId: 'tx-upgrade-1',
            amountUah: 800.0,
            provider: \App\Enums\PaymentProvider::Monobank,
            paymentMethod: 'card',
            metadata: [],
        );

        $this->assertNotNull($result);
        $this->assertSame($pro->id, $result->plan_id);
        $this->assertTrue($result->current_period_end->isAfter(now()->addDays(25)));
        $this->assertSame(OrderStatus::Paid, $order->fresh()?->status);
    }
}
