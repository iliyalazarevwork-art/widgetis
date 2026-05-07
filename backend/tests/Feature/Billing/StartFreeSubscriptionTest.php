<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Core\Models\Payment;
use App\Core\Models\Plan;
use App\Core\Models\Subscription;
use App\Core\Models\User;
use App\Enums\BillingPeriod;
use App\Enums\SubscriptionStatus;
use App\Shared\Events\Subscription\GuestSiteRequested;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class StartFreeSubscriptionTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/v1/profile/subscription/start-free';

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private function customer(): User
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

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
            'is_active' => true,
        ]);
    }

    // ─── Tests ─────────────────────────────────────────────────────────────────

    public function test_it_activates_free_subscription_for_new_user(): void
    {
        $this->freePlan();
        $user = $this->customer();

        $response = $this->postJson(self::ENDPOINT, [
            'site_domain' => 'mystore.com.ua',
        ], $this->authHeaders($user));

        $response->assertStatus(201);

        $subscription = Subscription::where('user_id', $user->id)->sole();
        $this->assertSame(SubscriptionStatus::Active, $subscription->status);
        $this->assertFalse($subscription->is_trial);
        $this->assertNull($subscription->trial_ends_at);
        $this->assertSame(BillingPeriod::Monthly->value, $subscription->billing_period);

        $plan = Plan::where('slug', 'free')->sole();
        $this->assertSame($plan->id, $subscription->plan_id);
    }

    public function test_it_returns_409_if_user_already_has_subscription(): void
    {
        $plan = $this->freePlan();
        $user = $this->customer();

        Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Active,
        ]);

        $response = $this->postJson(self::ENDPOINT, [
            'site_domain' => 'mystore.com.ua',
        ], $this->authHeaders($user));

        $response->assertStatus(409);
        $response->assertJsonPath('error.code', 'ALREADY_SUBSCRIBED');
    }

    public function test_it_requires_site_domain(): void
    {
        $this->freePlan();
        $user = $this->customer();

        $response = $this->postJson(self::ENDPOINT, [], $this->authHeaders($user));

        $response->assertStatus(422);
    }

    public function test_it_requires_authentication(): void
    {
        $this->freePlan();

        $response = $this->postJson(self::ENDPOINT, [
            'site_domain' => 'mystore.com.ua',
        ]);

        $response->assertStatus(401);
    }

    public function test_it_dispatches_guest_site_requested_event(): void
    {
        Event::fake([GuestSiteRequested::class]);

        $this->freePlan();
        $user = $this->customer();

        $this->postJson(self::ENDPOINT, [
            'site_domain' => 'mystore.com.ua',
            'platform' => 'horoshop',
        ], $this->authHeaders($user));

        Event::assertDispatched(GuestSiteRequested::class, function (GuestSiteRequested $event) use ($user): bool {
            return (string) $event->userId->value === (string) $user->id
                && $event->domain === 'mystore.com.ua'
                && $event->platform === 'horoshop';
        });
    }

    public function test_it_does_not_create_a_payment_row(): void
    {
        $this->freePlan();
        $user = $this->customer();

        $paymentsBefore = Payment::count();

        $this->postJson(self::ENDPOINT, [
            'site_domain' => 'mystore.com.ua',
        ], $this->authHeaders($user));

        $this->assertSame($paymentsBefore, Payment::count());
    }
}
