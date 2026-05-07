<?php

declare(strict_types=1);

namespace Tests\Feature\Plan;

use App\Core\Models\Plan;
use App\Core\Models\Subscription;
use App\Core\Models\User;
use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use App\WidgetRuntime\Models\Site;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class SiteLimitEnforcementTest extends TestCase
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

    private function subscribeToPlan(User $user, Plan $plan): void
    {
        Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Active,
            'is_trial' => false,
            'current_period_end' => now()->addMonth(),
        ]);
    }

    private function createSites(User $user, int $count): void
    {
        Site::factory()->count($count)->create(['user_id' => $user->id]);
    }

    /** @return \Illuminate\Testing\TestResponse<\Illuminate\Http\JsonResponse> */
    private function postSite(User $user): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/v1/profile/sites', [
            'url' => 'https://newsite-' . uniqid() . '.com.ua',
            'platform' => 'horoshop',
            'name' => 'Test Store',
        ], $this->authHeaders($user));
    }

    // ─── Tests ─────────────────────────────────────────────────────────────────

    public function test_it_403s_when_free_user_tries_to_add_a_2nd_site(): void
    {
        $freePlan = Plan::factory()->create([
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

        $user = $this->customer();
        $this->subscribeToPlan($user, $freePlan);
        $this->createSites($user, 1); // already at the limit

        $response = $this->postSite($user);

        $response->assertStatus(403);
        $response->assertJsonPath('error.code', 'PLAN_LIMIT_EXCEEDED');
    }

    public function test_it_201s_when_free_user_adds_the_first_site(): void
    {
        $freePlan = Plan::factory()->create([
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

        $user = $this->customer();
        $this->subscribeToPlan($user, $freePlan);
        // No existing sites

        $response = $this->postSite($user);

        $response->assertStatus(201);
    }

    public function test_it_201s_when_pro_user_adds_3rd_site(): void
    {
        $proPlan = Plan::factory()->create([
            'slug' => 'pro',
            'price_monthly' => 499,
            'price_yearly' => 4990,
            'trial_days' => 14,
            'max_sites' => 3,
            'is_active' => true,
        ]);

        $user = $this->customer();
        $this->subscribeToPlan($user, $proPlan);
        $this->createSites($user, 2); // 2 existing, adding the 3rd is allowed

        $response = $this->postSite($user);

        $response->assertStatus(201);
    }

    public function test_it_403s_when_pro_user_tries_to_add_a_4th_site(): void
    {
        $proPlan = Plan::factory()->create([
            'slug' => 'pro',
            'price_monthly' => 499,
            'price_yearly' => 4990,
            'trial_days' => 14,
            'max_sites' => 3,
            'is_active' => true,
        ]);

        $user = $this->customer();
        $this->subscribeToPlan($user, $proPlan);
        $this->createSites($user, 3); // already at the 3-site limit

        $response = $this->postSite($user);

        $response->assertStatus(403);
        $response->assertJsonPath('error.code', 'PLAN_LIMIT_EXCEEDED');
    }

    public function test_it_201s_when_max_user_adds_5th_site(): void
    {
        $maxPlan = Plan::factory()->create([
            'slug' => 'max',
            'price_monthly' => 699,
            'price_yearly' => 6990,
            'trial_days' => 14,
            'max_sites' => 5,
            'is_active' => true,
        ]);

        $user = $this->customer();
        $this->subscribeToPlan($user, $maxPlan);
        $this->createSites($user, 4); // 4 existing, adding the 5th is allowed

        $response = $this->postSite($user);

        $response->assertStatus(201);
    }

    public function test_it_403s_when_max_user_tries_to_add_a_6th_site(): void
    {
        $maxPlan = Plan::factory()->create([
            'slug' => 'max',
            'price_monthly' => 699,
            'price_yearly' => 6990,
            'trial_days' => 14,
            'max_sites' => 5,
            'is_active' => true,
        ]);

        $user = $this->customer();
        $this->subscribeToPlan($user, $maxPlan);
        $this->createSites($user, 5); // already at the 5-site limit

        $response = $this->postSite($user);

        $response->assertStatus(403);
        $response->assertJsonPath('error.code', 'PLAN_LIMIT_EXCEEDED');
    }
}
