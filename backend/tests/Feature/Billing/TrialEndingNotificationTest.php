<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Core\Models\AppNotification;
use App\Core\Models\Plan;
use App\Core\Models\Subscription;
use App\Core\Models\User;
use App\Enums\NotificationType;
use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Tests for the `notifications:trial-ending` command.
 *
 * Note: SendTrialEndingReminders uses NotificationService (in-app DB notifications),
 * not Mail — so we assert against AppNotification rows, not Mail::fake().
 */
class TrialEndingNotificationTest extends TestCase
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

    private function proPlan(): Plan
    {
        return Plan::factory()->create([
            'slug' => 'pro',
            'price_monthly' => 499,
            'price_yearly' => 4990,
            'trial_days' => 14,
            'is_active' => true,
        ]);
    }

    // ─── Tests ─────────────────────────────────────────────────────────────────

    public function test_it_sends_trial_ending_notification_3_days_before_trial_ends_at(): void
    {
        $plan = $this->proPlan();
        $user = $this->customer();

        // trial_ends_at = today + 3 days (command checks whereDate matches now+3)
        Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Trial,
            'is_trial' => true,
            'trial_ends_at' => now()->addDays(3)->startOfDay(),
            'current_period_end' => now()->addDays(3)->startOfDay(),
        ]);

        $this->artisan('notifications:trial-ending')->assertExitCode(0);

        $notification = AppNotification::where('user_id', $user->id)
            ->where('type', NotificationType::TrialWarning->value)
            ->first();

        $this->assertNotNull($notification, 'trial-ending notification must be created 3 days before trial end');
    }

    public function test_it_does_not_send_if_trial_ends_at_is_more_than_3_days_away(): void
    {
        $plan = $this->proPlan();
        $user = $this->customer();

        // trial_ends_at = 10 days from now — should NOT trigger the command
        Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Trial,
            'is_trial' => true,
            'trial_ends_at' => now()->addDays(10),
            'current_period_end' => now()->addDays(10),
        ]);

        $this->artisan('notifications:trial-ending')->assertExitCode(0);

        $notificationCount = AppNotification::where('user_id', $user->id)
            ->where('type', NotificationType::TrialWarning->value)
            ->count();

        $this->assertSame(0, $notificationCount);
    }

    public function test_it_does_not_send_if_trial_already_expired(): void
    {
        $plan = $this->proPlan();
        $user = $this->customer();

        // trial_ends_at already in the past — status should not be Trial, but let's
        // also test with a "stale" trial row to confirm the command ignores it
        Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Active, // already downgraded
            'is_trial' => false,
            'trial_ends_at' => now()->subDays(2),
            'current_period_end' => now()->addMonth(),
        ]);

        $this->artisan('notifications:trial-ending')->assertExitCode(0);

        $notificationCount = AppNotification::where('user_id', $user->id)
            ->where('type', NotificationType::TrialWarning->value)
            ->count();

        // Command only queries status=Trial — expired/downgraded subs are excluded
        $this->assertSame(0, $notificationCount);
    }

    public function test_it_sends_notification_1_day_before_trial_ends_at(): void
    {
        $plan = $this->proPlan();
        $user = $this->customer();

        // trial_ends_at = today + 1 day
        Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Trial,
            'is_trial' => true,
            'trial_ends_at' => now()->addDay()->startOfDay(),
            'current_period_end' => now()->addDay()->startOfDay(),
        ]);

        $this->artisan('notifications:trial-ending')->assertExitCode(0);

        $notification = AppNotification::where('user_id', $user->id)
            ->where('type', NotificationType::TrialWarning->value)
            ->first();

        $this->assertNotNull($notification, 'trial-ending notification must be created 1 day before trial end');
    }
}
