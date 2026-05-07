<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Core\Models\Plan;
use App\Core\Models\Subscription;
use App\Core\Models\User;
use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class CancelDowngradeFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();
        Carbon::setTestNow('2026-05-07 10:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private function customer(): User
    {
        $user = User::factory()->create();
        $user->assignRole(UserRole::Customer->value);

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

    private function freePlan(): Plan
    {
        return Plan::firstOrCreate(
            ['slug' => 'free'],
            [
                'name' => ['en' => 'Free', 'uk' => 'Безкоштовний'],
                'description' => ['en' => 'Free plan', 'uk' => 'Безкоштовний план'],
                'price_monthly' => 0,
                'price_yearly' => 0,
                'trial_days' => 0,
                'max_sites' => 1,
                'max_widgets' => 11,
                'languages_supported' => ['uk'],
                'widget_limits_config' => null,
                'is_active' => true,
                'sort_order' => -1,
            ],
        );
    }

    // ─── Tests ─────────────────────────────────────────────────────────────────

    public function test_it_marks_subscription_as_cancelled_but_keeps_user_on_pro_until_period_end(): void
    {
        $this->freePlan();
        $proPlan = Plan::factory()->create([
            'slug' => 'pro',
            'price_monthly' => 499,
            'price_yearly' => 4990,
            'trial_days' => 14,
            'is_active' => true,
        ]);

        $user = $this->customer();
        $periodEnd = now()->addDays(10);

        Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $proPlan->id,
            'status' => SubscriptionStatus::Active,
            'is_trial' => false,
            'current_period_end' => $periodEnd,
            'payment_provider' => null, // no provider — cancel is purely local
        ]);

        $response = $this->postJson('/api/v1/profile/subscription/cancel', [], $this->authHeaders($user));

        $response->assertOk();

        $subscription = $user->fresh()->subscription;
        $this->assertNotNull($subscription);
        $this->assertSame(SubscriptionStatus::Cancelled, $subscription->status);
        $this->assertNotNull($subscription->cancelled_at);
        $this->assertSame($proPlan->id, $subscription->plan_id, 'plan must still be Pro until period end');
        $this->assertTrue(
            $subscription->current_period_end->equalTo($periodEnd),
            'current_period_end must not change on cancellation',
        );
    }

    public function test_it_downgrades_cancelled_sub_to_free_after_current_period_end(): void
    {
        $freePlan = $this->freePlan();
        $proPlan = Plan::factory()->create([
            'slug' => 'pro',
            'price_monthly' => 499,
            'price_yearly' => 4990,
            'trial_days' => 14,
        ]);

        $user = $this->customer();

        Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $proPlan->id,
            'status' => SubscriptionStatus::Cancelled,
            'cancelled_at' => now()->subDays(5),
            'current_period_end' => now()->subHour(), // already past
        ]);

        $this->artisan('subscriptions:downgrade-cancelled')->assertExitCode(0);

        $subscription = $user->fresh()->subscription;
        $this->assertNotNull($subscription);
        $this->assertSame(SubscriptionStatus::Active, $subscription->status);
        $this->assertSame($freePlan->id, $subscription->plan_id);
    }

    public function test_it_does_not_touch_a_cancelled_sub_whose_period_has_not_ended(): void
    {
        $this->freePlan();
        $proPlan = Plan::factory()->create([
            'slug' => 'pro',
            'price_monthly' => 499,
            'price_yearly' => 4990,
            'trial_days' => 14,
        ]);

        $user = $this->customer();

        $subscription = Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $proPlan->id,
            'status' => SubscriptionStatus::Cancelled,
            'cancelled_at' => now()->subHour(),
            'current_period_end' => now()->addHour(), // not yet past
        ]);

        $this->artisan('subscriptions:downgrade-cancelled')->assertExitCode(0);

        $fresh = $subscription->fresh();
        $this->assertSame(SubscriptionStatus::Cancelled, $fresh->status);
        $this->assertSame($proPlan->id, $fresh->plan_id);
    }

    public function test_it_does_not_touch_active_subs(): void
    {
        $this->freePlan();
        $proPlan = Plan::factory()->create([
            'slug' => 'pro',
            'price_monthly' => 499,
            'price_yearly' => 4990,
            'trial_days' => 14,
        ]);

        $user = $this->customer();

        $subscription = Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $proPlan->id,
            'status' => SubscriptionStatus::Active,
            'current_period_end' => now()->addMonth(),
        ]);

        $this->artisan('subscriptions:downgrade-cancelled')->assertExitCode(0);

        $fresh = $subscription->fresh();
        $this->assertSame(SubscriptionStatus::Active, $fresh->status);
        $this->assertSame($proPlan->id, $fresh->plan_id);
    }
}
