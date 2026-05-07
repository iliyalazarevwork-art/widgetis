<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Core\Models\Order;
use App\Core\Models\Plan;
use App\Core\Models\Subscription;
use App\Core\Models\User;
use App\Core\Services\Billing\SubscriptionActivationService;
use App\Enums\BillingPeriod;
use App\Enums\OrderStatus;
use App\Enums\PaymentProvider;
use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class FoundingSlotClaimTest extends TestCase
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
     * Build a pending Order with optional notes and attach a Pending Subscription.
     *
     * @param array<string, mixed> $notes
     */
    private function buildOrderWithSubscription(User $user, Plan $plan, array $notes = []): Order
    {
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'billing_period' => BillingPeriod::Monthly->value,
            'amount' => 299,
            'status' => OrderStatus::Pending,
            'payment_provider' => PaymentProvider::Monobank,
            'notes' => $notes ?: null,
        ]);

        Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Pending,
            'billing_period' => BillingPeriod::Monthly->value,
            'is_trial' => false,
            'current_period_start' => now(),
            'current_period_end' => now()->addMonth(),
            'payment_provider' => PaymentProvider::Monobank,
        ]);

        return $order;
    }

    private function maxSlots(): int
    {
        return (int) config('founding.max_slots', 20);
    }

    // ─── Tests ─────────────────────────────────────────────────────────────────

    public function test_it_claims_a_founding_slot_when_payment_is_activated_for_pro_with_founding_price_flag(): void
    {
        $proPlan = Plan::factory()->create([
            'slug' => 'pro',
            'price_monthly' => 499,
            'price_yearly' => 4990,
            'trial_days' => 14,
        ]);

        $user = $this->customer();

        $order = $this->buildOrderWithSubscription($user, $proPlan, ['founding_price' => true]);

        /** @var SubscriptionActivationService $activationService */
        $activationService = app(SubscriptionActivationService::class);

        $activationService->activateOrRenew(
            order: $order,
            transactionId: 'TXN-FOUNDING-001',
            amountUah: 299.0,
            provider: PaymentProvider::Monobank,
            paymentMethod: 'card',
            metadata: [],
        );

        $freshUser = $user->fresh();
        $this->assertTrue((bool) $freshUser->is_founding);
        $this->assertNotNull($freshUser->founding_locked_price_monthly);
    }

    public function test_it_does_not_claim_a_slot_for_non_pro_orders(): void
    {
        $maxPlan = Plan::factory()->create([
            'slug' => 'max',
            'price_monthly' => 699,
            'price_yearly' => 6990,
            'trial_days' => 14,
        ]);

        $user = $this->customer();

        $order = $this->buildOrderWithSubscription($user, $maxPlan, ['founding_price' => true]);

        /** @var SubscriptionActivationService $activationService */
        $activationService = app(SubscriptionActivationService::class);

        $activationService->activateOrRenew(
            order: $order,
            transactionId: 'TXN-MAX-001',
            amountUah: 699.0,
            provider: PaymentProvider::Monobank,
            paymentMethod: 'card',
            metadata: [],
        );

        // Max plan — founding slot must NOT be claimed
        $freshUser = $user->fresh();
        $this->assertFalse((bool) $freshUser->is_founding);
    }

    public function test_it_does_not_claim_a_slot_for_renewals(): void
    {
        $proPlan = Plan::factory()->create([
            'slug' => 'pro',
            'price_monthly' => 499,
            'price_yearly' => 4990,
            'trial_days' => 14,
        ]);

        $user = $this->customer();

        // Simulate an already-active subscription (renewal scenario)
        Subscription::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $proPlan->id,
            'status' => SubscriptionStatus::Active,
            'billing_period' => BillingPeriod::Monthly->value,
            'is_trial' => false,
            'current_period_start' => now()->subMonth(),
            'current_period_end' => now()->addDays(5), // still in future → isRenewal = true
            'payment_provider' => PaymentProvider::Monobank,
        ]);

        $order = Order::factory()->create([
            'user_id' => $user->id,
            'plan_id' => $proPlan->id,
            'billing_period' => BillingPeriod::Monthly->value,
            'amount' => 499,
            'status' => OrderStatus::Pending,
            'payment_provider' => PaymentProvider::Monobank,
            'notes' => ['founding_price' => true],
        ]);

        /** @var SubscriptionActivationService $activationService */
        $activationService = app(SubscriptionActivationService::class);

        // Must not throw and must not consume a slot on renewal
        $activationService->activateOrRenew(
            order: $order,
            transactionId: 'TXN-RENEW-001',
            amountUah: 499.0,
            provider: PaymentProvider::Monobank,
            paymentMethod: 'card',
            metadata: [],
        );

        $freshUser = $user->fresh();
        // Renewal path skips founding claim; user is not marked as founding
        $this->assertFalse((bool) $freshUser->is_founding);
    }

    public function test_it_is_idempotent_on_already_founding_exception(): void
    {
        $proPlan = Plan::factory()->create([
            'slug' => 'pro',
            'price_monthly' => 499,
            'price_yearly' => 4990,
            'trial_days' => 14,
        ]);

        $user = $this->customer();

        // Pre-set user as already founding
        DB::table('users')->where('id', $user->id)->update([
            'is_founding' => true,
            'founding_locked_price_monthly' => 299,
        ]);

        $order = $this->buildOrderWithSubscription($user, $proPlan, ['founding_price' => true]);

        /** @var SubscriptionActivationService $activationService */
        $activationService = app(SubscriptionActivationService::class);

        // Must not throw AlreadyFoundingException — swallowed as idempotent
        $result = $activationService->activateOrRenew(
            order: $order,
            transactionId: 'TXN-ALREADY-001',
            amountUah: 299.0,
            provider: PaymentProvider::Monobank,
            paymentMethod: 'card',
            metadata: [],
        );

        $this->assertNotNull($result);
        $this->assertTrue((bool) $user->fresh()->is_founding);
    }

    public function test_it_is_idempotent_on_founding_slots_exhausted_exception(): void
    {
        $maxSlots = $this->maxSlots();

        // Fill all founding slots
        User::factory()->count($maxSlots)->create()->each(function (User $u): void {
            DB::table('users')->where('id', $u->id)->update([
                'is_founding' => true,
                'founding_locked_price_monthly' => 299,
            ]);
        });

        $proPlan = Plan::factory()->create([
            'slug' => 'pro',
            'price_monthly' => 499,
            'price_yearly' => 4990,
            'trial_days' => 14,
        ]);

        $user = $this->customer();

        $order = $this->buildOrderWithSubscription($user, $proPlan, ['founding_price' => true]);

        /** @var SubscriptionActivationService $activationService */
        $activationService = app(SubscriptionActivationService::class);

        // Must not throw FoundingSlotsExhaustedException — swallowed gracefully
        $result = $activationService->activateOrRenew(
            order: $order,
            transactionId: 'TXN-EXHAUSTED-001',
            amountUah: 299.0,
            provider: PaymentProvider::Monobank,
            paymentMethod: 'card',
            metadata: [],
        );

        $this->assertNotNull($result);
        // Slots were exhausted — user does NOT become founding
        $this->assertFalse((bool) $user->fresh()->is_founding);
    }
}
