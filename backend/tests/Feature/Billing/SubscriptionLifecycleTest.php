<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Core\Models\Plan;
use App\Core\Models\Product;
use App\Core\Models\Subscription;
use App\Core\Models\User;
use App\Enums\ProductAvailability;
use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use App\Shared\ValueObjects\UserId;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Models\SiteWidget;
use App\WidgetRuntime\Services\Widget\WidgetAccessService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Real-time integration tests for the subscription lifecycle: no
 * Carbon::setTestNow, no clock mocking. We actually create a trial whose
 * trial_ends_at is `now()->addSeconds(3)`, `sleep(3)` the PHPUnit process,
 * run the same artisan command the scheduler runs at 04:00, and then
 * assert that the subscription flipped to Expired and widget access is
 * gone — end to end, closer to production than any time-frozen test.
 *
 * Slow by design: every test here pays a few real seconds of wall-clock
 * so we can catch regressions that only manifest on real durations
 * (Carbon timezone bugs, scheduler query drift, etc.).
 */
class SubscriptionLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Prevent RebuildSiteScriptJob from running curl against widget-builder
        // inside the test runner.
        Queue::fake();
    }

    private function customer(): User
    {
        $user = User::factory()->create();
        $user->assignRole(UserRole::Customer->value);

        return $user;
    }

    public function test_trial_subscription_really_expires_after_three_real_seconds(): void
    {
        $user = $this->customer();
        $plan = Plan::factory()->create();

        $subscription = Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Trial,
            'is_trial' => true,
            'trial_ends_at' => now()->addSeconds(3),
            'current_period_start' => now(),
            'current_period_end' => now()->addSeconds(3),
        ]);

        // Sanity: the trial is still active right now.
        $this->assertSame(SubscriptionStatus::Trial, $subscription->fresh()->status);

        // Wall-clock wait — a real 3.5 seconds. This is not a mock.
        sleep(4);

        $exit = $this->artisan('subscriptions:expire-trials')
            ->expectsOutputToContain('Expired 1 trial')
            ->run();

        $this->assertSame(0, $exit);

        $fresh = $subscription->fresh();
        $this->assertNotNull($fresh);
        $this->assertSame(
            SubscriptionStatus::Expired,
            $fresh->status,
            'trial_ends_at in the past should flip status to Expired after running subscriptions:expire-trials',
        );
    }

    public function test_expiration_disables_all_site_widgets_of_the_user(): void
    {
        $user = $this->customer();
        $plan = Plan::factory()->create();
        $product = Product::factory()->create();
        $plan->products()->attach($product->id);

        $site = Site::create([
            'user_id' => $user->id,
            'domain' => 'sleepy.example',
            'url' => 'https://sleepy.example',
            'name' => 'Sleepy',
            'platform' => 'horoshop',
            'status' => 'active',
        ]);
        $widget = SiteWidget::create([
            'site_id' => $site->id,
            'product_id' => $product->id,
            'is_enabled' => true,
            'config' => ['enabled' => true],
        ]);

        Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Trial,
            'is_trial' => true,
            'trial_ends_at' => now()->addSeconds(3),
            'current_period_end' => now()->addSeconds(3),
        ]);

        sleep(4);

        $this->artisan('subscriptions:expire-trials')->assertExitCode(0);

        $widget->refresh();
        $this->assertFalse(
            (bool) $widget->is_enabled,
            'widgets must be disabled once the owning subscription expired',
        );
        $this->assertNotNull($widget->disabled_at);
    }

    public function test_widget_access_service_locks_access_once_subscription_expired(): void
    {
        $user = $this->customer();
        $plan = Plan::factory()->create();
        $product = Product::factory()->create();
        $plan->products()->attach($product->id);

        $subscription = Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Trial,
            'is_trial' => true,
            'trial_ends_at' => now()->addSeconds(3),
            'current_period_end' => now()->addSeconds(3),
        ]);

        /** @var WidgetAccessService $access */
        $access = app(WidgetAccessService::class);

        $userId = UserId::fromString((string) $user->id);

        // While the trial is still live, the plan grants access.
        $this->assertTrue(
            $access->canAccessBySlug($userId, $product->slug, ProductAvailability::Available->value, $product->id),
            'active trial should grant access to plan products',
        );

        sleep(4);

        $this->artisan('subscriptions:expire-trials')->assertExitCode(0);

        // Eloquent relationships inside WidgetAccessService are not cached
        // across test phases once we reload the user from DB.
        $this->assertFalse(
            $access->canAccessBySlug($userId, $product->slug, ProductAvailability::Available->value, $product->id),
            'expired subscription must revoke access to plan products',
        );

        $this->assertSame(SubscriptionStatus::Expired, $subscription->fresh()->status);
    }

    public function test_http_dashboard_reflects_expiration_immediately(): void
    {
        $user = $this->customer();
        $plan = Plan::factory()->create();

        Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Trial,
            'is_trial' => true,
            'trial_ends_at' => now()->addSeconds(3),
            'current_period_end' => now()->addSeconds(3),
        ]);

        // Before expiration, /api/v1/auth/user reports trial.
        $pre = $this->actingAs($user, 'core')->getJson('/api/v1/auth/user');
        $pre->assertStatus(200);
        $this->assertSame('trial', $pre->json('data.subscription_status'));

        sleep(4);

        $this->artisan('subscriptions:expire-trials')->assertExitCode(0);

        $post = $this->actingAs($user->fresh(), 'core')->getJson('/api/v1/auth/user');
        $post->assertStatus(200);
        $this->assertNotSame(
            'trial',
            $post->json('data.subscription_status'),
            'user endpoint must report the new subscription status after expiration',
        );
    }
}
