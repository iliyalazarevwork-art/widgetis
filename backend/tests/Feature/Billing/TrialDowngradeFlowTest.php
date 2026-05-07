<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Core\Models\Plan;
use App\Core\Models\Subscription;
use App\Core\Models\User;
use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use App\Shared\Events\Subscription\PlanChanged;
use App\WidgetRuntime\Models\Site;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class TrialDowngradeFlowTest extends TestCase
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

    public function test_it_downgrades_a_pro_trial_to_free_after_trial_ends_at_passes(): void
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
            'status' => SubscriptionStatus::Trial,
            'is_trial' => true,
            'trial_ends_at' => now()->addHour(),
            'current_period_end' => now()->addHour(),
        ]);

        // Time-travel: 2 hours later — trial is now expired
        Carbon::setTestNow(now()->addHours(2));

        $this->artisan('subscriptions:expire-trials')->assertExitCode(0);

        $subscription = $user->fresh()->subscription;
        $this->assertNotNull($subscription);
        $this->assertSame(SubscriptionStatus::Active, $subscription->status);
        $this->assertSame($freePlan->id, $subscription->plan_id);
        $this->assertFalse($subscription->is_trial);
        $this->assertNull($subscription->trial_ends_at);
    }

    public function test_it_downgrades_a_max_trial_to_free_after_trial_ends_at_passes(): void
    {
        $freePlan = $this->freePlan();
        $maxPlan = Plan::factory()->create([
            'slug' => 'max',
            'price_monthly' => 699,
            'price_yearly' => 6990,
            'trial_days' => 14,
        ]);

        $user = $this->customer();

        Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $maxPlan->id,
            'status' => SubscriptionStatus::Trial,
            'is_trial' => true,
            'trial_ends_at' => now()->addHour(),
            'current_period_end' => now()->addHour(),
        ]);

        Carbon::setTestNow(now()->addHours(2));

        $this->artisan('subscriptions:expire-trials')->assertExitCode(0);

        $subscription = $user->fresh()->subscription;
        $this->assertNotNull($subscription);
        $this->assertSame(SubscriptionStatus::Active, $subscription->status);
        $this->assertSame($freePlan->id, $subscription->plan_id);
        $this->assertFalse($subscription->is_trial);
        $this->assertNull($subscription->trial_ends_at);
    }

    public function test_it_does_not_downgrade_an_active_paid_subscription(): void
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
            'is_trial' => false,
            'trial_ends_at' => now()->subDay(), // past trial_ends_at but NOT a trial sub
            'current_period_end' => now()->addMonth(),
        ]);

        Carbon::setTestNow(now()->addHours(2));

        $this->artisan('subscriptions:expire-trials')->assertExitCode(0);

        // The command targets status=Trial only — this Active sub must be untouched
        $fresh = $subscription->fresh();
        $this->assertSame(SubscriptionStatus::Active, $fresh->status);
        $this->assertSame($proPlan->id, $fresh->plan_id);
    }

    public function test_it_dispatches_plan_changed_event_with_new_slug_free(): void
    {
        Event::fake([PlanChanged::class]);

        $this->freePlan();
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
            'status' => SubscriptionStatus::Trial,
            'is_trial' => true,
            'trial_ends_at' => now()->addHour(),
            'current_period_end' => now()->addHour(),
        ]);

        Carbon::setTestNow(now()->addHours(2));

        $this->artisan('subscriptions:expire-trials')->assertExitCode(0);

        Event::assertDispatched(PlanChanged::class, function (PlanChanged $event): bool {
            return $event->newPlanSlug === 'free';
        });
    }

    public function test_it_preserves_user_sites_and_widgets_after_trial_downgrade(): void
    {
        $this->freePlan();
        $proPlan = Plan::factory()->create([
            'slug' => 'pro',
            'price_monthly' => 499,
            'price_yearly' => 4990,
            'trial_days' => 14,
        ]);

        $user = $this->customer();

        // Create multiple sites for the user
        Site::factory()->count(3)->create(['user_id' => $user->id]);

        Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $proPlan->id,
            'status' => SubscriptionStatus::Trial,
            'is_trial' => true,
            'trial_ends_at' => now()->addHour(),
            'current_period_end' => now()->addHour(),
        ]);

        Carbon::setTestNow(now()->addHours(2));

        $this->artisan('subscriptions:expire-trials')->assertExitCode(0);

        // Sites still exist after downgrade (limits enforced on read, not destructive)
        $siteCount = Site::where('user_id', $user->id)->count();
        $this->assertSame(3, $siteCount, 'sites must be preserved after downgrade-to-free');
    }
}
