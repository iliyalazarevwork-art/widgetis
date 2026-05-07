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
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class FreeUpgradeFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();
        Carbon::setTestNow('2026-05-07 10:00:00');

        config([
            'app.url' => 'https://app.test',
            'monobank.token' => 'fake-token',
            'monobank.webhook_url' => 'https://app.test/webhook',
            'monobank.redirect_url' => 'https://app.test/billing',
        ]);
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
        return Plan::factory()->create([
            'slug' => 'free',
            'price_monthly' => 0,
            'price_yearly' => 0,
            'trial_days' => 0,
            'max_sites' => 1,
            'max_widgets' => 11,
            'languages_supported' => ['uk'],
            'widget_limits_config' => null,
            'is_active' => true,
        ]);
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

    public function test_it_lets_a_free_user_start_a_trial_on_pro(): void
    {
        $freePlan = $this->freePlan();
        $proPlan = $this->proPlan();

        $user = $this->customer();

        // User is already on Free plan (Active)
        Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $freePlan->id,
            'status' => SubscriptionStatus::Active,
            'is_trial' => false,
            'current_period_end' => now()->addYears(100),
            'payment_provider' => null,
        ]);

        $response = $this->postJson('/api/v1/profile/subscription/start-trial', [
            'plan_slug' => 'pro',
            'site_domain' => 'mystore.com.ua',
        ], $this->authHeaders($user));

        $response->assertStatus(201);

        $subscription = $user->fresh()->subscription;
        $this->assertNotNull($subscription);
        $this->assertSame(SubscriptionStatus::Trial, $subscription->status);
        $this->assertSame($proPlan->id, $subscription->plan_id);
        $this->assertTrue($subscription->is_trial);
        $this->assertNotNull($subscription->trial_ends_at);
        // trial_ends_at should be ~14 days from now
        $this->assertTrue($subscription->trial_ends_at->isAfter(now()->addDays(13)));
        $this->assertTrue($subscription->trial_ends_at->isBefore(now()->addDays(15)));
    }

    public function test_it_lets_a_user_with_no_subscription_checkout_pro_via_monobank(): void
    {
        $this->freePlan(); // Free plan must exist for downgrade fallback
        $proPlan = $this->proPlan();

        Http::fake([
            'api.monobank.ua/*' => Http::response([
                'subscriptionId' => 'mono_sub_free_upgrade_test',
                'pageUrl' => 'https://pay.mbnk.biz/mono_sub_free_upgrade_test',
            ]),
        ]);

        $user = $this->customer();
        // No subscription — user is fresh

        $response = $this->postJson('/api/v1/profile/subscription/checkout', [
            'plan_slug' => 'pro',
            'billing_period' => 'monthly',
            'provider' => 'monobank',
            'site_domain' => 'mystore.com.ua',
        ], $this->authHeaders($user));

        $response->assertOk();
        $response->assertJsonPath('data.provider', 'monobank');

        $this->assertDatabaseHas('orders', [
            'user_id' => $user->id,
            'plan_id' => $proPlan->id,
        ]);
    }

    public function test_it_blocks_a_free_user_from_starting_another_free(): void
    {
        $freePlan = $this->freePlan();
        $user = $this->customer();

        Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $freePlan->id,
            'status' => SubscriptionStatus::Active,
            'payment_provider' => null,
        ]);

        $response = $this->postJson('/api/v1/profile/subscription/start-free', [
            'site_domain' => 'mystore.com.ua',
        ], $this->authHeaders($user));

        $response->assertStatus(409);
        $response->assertJsonPath('error.code', 'ALREADY_SUBSCRIBED');
    }

    public function test_it_409s_a_paid_pro_user_who_tries_to_start_trial(): void
    {
        $this->freePlan();
        $proPlan = $this->proPlan();

        $user = $this->customer();

        // User already has an active paid Pro subscription
        Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $proPlan->id,
            'status' => SubscriptionStatus::Active,
            'is_trial' => false,
            'current_period_end' => now()->addMonth(),
        ]);

        $response = $this->postJson('/api/v1/profile/subscription/start-trial', [
            'plan_slug' => 'pro',
            'site_domain' => 'mystore.com.ua',
        ], $this->authHeaders($user));

        $response->assertStatus(409);
        $response->assertJsonPath('error.code', 'ALREADY_SUBSCRIBED');
    }
}
