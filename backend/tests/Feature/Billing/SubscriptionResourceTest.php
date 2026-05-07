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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class SubscriptionResourceTest extends TestCase
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

    // ─── Tests ─────────────────────────────────────────────────────────────────

    public function test_it_returns_founding_price_as_effective_monthly_price_for_founding_users(): void
    {
        $proPlan = Plan::factory()->create([
            'slug' => 'pro',
            'price_monthly' => 499,
            'price_yearly' => 4990,
            'trial_days' => 14,
            'is_active' => true,
        ]);

        $user = $this->customer();

        // Mark user as founding with locked price
        DB::table('users')->where('id', $user->id)->update([
            'is_founding' => true,
            'founding_locked_price_monthly' => 299,
        ]);

        Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $proPlan->id,
            'status' => SubscriptionStatus::Active,
            'is_trial' => false,
            'current_period_end' => now()->addMonth(),
        ]);

        $response = $this->getJson('/api/v1/profile/subscription', $this->authHeaders($user->fresh()));

        $response->assertOk();
        $this->assertEquals(299, $response->json('data.effective_monthly_price'));
    }

    public function test_it_returns_plan_price_as_effective_monthly_price_for_non_founding_users(): void
    {
        $proPlan = Plan::factory()->create([
            'slug' => 'pro',
            'price_monthly' => 499,
            'price_yearly' => 4990,
            'trial_days' => 14,
            'is_active' => true,
        ]);

        $user = $this->customer();
        // is_founding defaults to false

        Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $proPlan->id,
            'status' => SubscriptionStatus::Active,
            'is_trial' => false,
            'current_period_end' => now()->addMonth(),
        ]);

        $response = $this->getJson('/api/v1/profile/subscription', $this->authHeaders($user));

        $response->assertOk();
        $this->assertEquals(499, $response->json('data.effective_monthly_price'));
    }

    public function test_it_returns_zero_as_effective_monthly_price_for_free_users(): void
    {
        $freePlan = Plan::factory()->create([
            'slug' => 'free',
            'price_monthly' => 0,
            'price_yearly' => 0,
            'trial_days' => 0,
            'max_sites' => 1,
            'is_active' => true,
        ]);

        $user = $this->customer();

        Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $freePlan->id,
            'status' => SubscriptionStatus::Active,
            'is_trial' => false,
            'current_period_end' => now()->addYears(100),
        ]);

        $response = $this->getJson('/api/v1/profile/subscription', $this->authHeaders($user));

        $response->assertOk();
        $this->assertEquals(0, $response->json('data.effective_monthly_price'));
    }
}
