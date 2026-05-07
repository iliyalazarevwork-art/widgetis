<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Core\Models\Order;
use App\Core\Models\Plan;
use App\Core\Models\User;
use App\Core\Services\Billing\CheckoutService;
use App\Enums\BillingPeriod;
use App\Enums\PaymentProvider;
use App\Enums\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Tests that founding price (299 ₴/mo, 2990 ₴/yr) is applied correctly
 * for Pro plan checkouts when slots are available, and that normal pricing
 * is used when slots are exhausted or for non-Pro plans.
 *
 * These tests use the CheckoutService directly to avoid needing live
 * payment-provider HTTP calls, and they stub Monobank via Http::fake().
 */
class FoundingPriceCheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();
        Carbon::setTestNow('2026-05-07 10:00:00');

        // Fake Monobank so CheckoutService doesn't make real HTTP calls
        Http::fake([
            'api.monobank.ua/*' => Http::response([
                'subscriptionId' => 'mono_sub_test',
                'pageUrl' => 'https://pay.mbnk.biz/mono_sub_test',
            ]),
        ]);

        config([
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
     * Mark N users as founding to fill slots.
     */
    private function fillFoundingSlots(int $count): void
    {
        User::factory()->count($count)->create()->each(function (User $u): void {
            DB::table('users')->where('id', $u->id)->update([
                'is_founding' => true,
                'founding_locked_price_monthly' => 299,
            ]);
        });
    }

    private function foundingLockedMonthly(): int
    {
        return (int) config('founding.locked_price_monthly', 299);
    }

    private function maxSlots(): int
    {
        return (int) config('founding.max_slots', 20);
    }

    // ─── Tests ─────────────────────────────────────────────────────────────────

    public function test_it_charges_founding_monthly_price_for_pro_when_slots_available(): void
    {
        $proPlan = Plan::factory()->create([
            'slug' => 'pro',
            'price_monthly' => 499,
            'price_yearly' => 4990,
            'trial_days' => 14,
            'is_active' => true,
        ]);

        $user = $this->customer();
        $lockedMonthly = $this->foundingLockedMonthly();

        /** @var CheckoutService $checkoutService */
        $checkoutService = app(CheckoutService::class);

        $checkoutService->createCheckout(
            user: $user,
            plan: $proPlan,
            billingPeriod: BillingPeriod::Monthly,
            provider: PaymentProvider::Monobank,
            siteDomain: 'mystore.com.ua',
        );

        $order = Order::where('user_id', $user->id)->latest()->first();
        $this->assertNotNull($order);
        $this->assertSame((float) $lockedMonthly, (float) $order->amount);
        $this->assertOrderHasFoundingFlag($order, true);
    }

    public function test_it_charges_founding_yearly_price_for_pro_yearly(): void
    {
        $proPlan = Plan::factory()->create([
            'slug' => 'pro',
            'price_monthly' => 499,
            'price_yearly' => 4990,
            'trial_days' => 14,
            'is_active' => true,
        ]);

        $user = $this->customer();
        $lockedMonthly = $this->foundingLockedMonthly();
        $expectedYearly = $lockedMonthly * 10; // 2990

        /** @var CheckoutService $checkoutService */
        $checkoutService = app(CheckoutService::class);

        $checkoutService->createCheckout(
            user: $user,
            plan: $proPlan,
            billingPeriod: BillingPeriod::Yearly,
            provider: PaymentProvider::Monobank,
            siteDomain: 'mystore.com.ua',
        );

        $order = Order::where('user_id', $user->id)->latest()->first();
        $this->assertNotNull($order);
        $this->assertSame((float) $expectedYearly, (float) $order->amount);
        $this->assertOrderHasFoundingFlag($order, true);
    }

    public function test_it_charges_normal_499_when_founding_slots_are_exhausted(): void
    {
        $maxSlots = $this->maxSlots();
        $this->fillFoundingSlots($maxSlots);

        $proPlan = Plan::factory()->create([
            'slug' => 'pro',
            'price_monthly' => 499,
            'price_yearly' => 4990,
            'trial_days' => 14,
            'is_active' => true,
        ]);

        $user = $this->customer();

        /** @var CheckoutService $checkoutService */
        $checkoutService = app(CheckoutService::class);

        $checkoutService->createCheckout(
            user: $user,
            plan: $proPlan,
            billingPeriod: BillingPeriod::Monthly,
            provider: PaymentProvider::Monobank,
            siteDomain: 'mystore.com.ua',
        );

        $order = Order::where('user_id', $user->id)->latest()->first();
        $this->assertNotNull($order);
        $this->assertSame(499.0, (float) $order->amount);
        $this->assertOrderHasFoundingFlag($order, false);
    }

    public function test_it_charges_normal_price_for_max_plan(): void
    {
        // Founding offer is Pro-only; Max should always use sticker price
        $maxPlan = Plan::factory()->create([
            'slug' => 'max',
            'price_monthly' => 699,
            'price_yearly' => 6990,
            'trial_days' => 14,
            'is_active' => true,
        ]);

        $user = $this->customer();

        /** @var CheckoutService $checkoutService */
        $checkoutService = app(CheckoutService::class);

        $checkoutService->createCheckout(
            user: $user,
            plan: $maxPlan,
            billingPeriod: BillingPeriod::Monthly,
            provider: PaymentProvider::Monobank,
            siteDomain: 'mystore.com.ua',
        );

        $order = Order::where('user_id', $user->id)->latest()->first();
        $this->assertNotNull($order);
        $this->assertSame(699.0, (float) $order->amount);
        $this->assertOrderHasFoundingFlag($order, false);
    }

    public function test_it_charges_normal_price_when_user_is_already_founding(): void
    {
        $proPlan = Plan::factory()->create([
            'slug' => 'pro',
            'price_monthly' => 499,
            'price_yearly' => 4990,
            'trial_days' => 14,
            'is_active' => true,
        ]);

        $user = $this->customer();

        // User already has a founding slot claimed
        DB::table('users')->where('id', $user->id)->update([
            'is_founding' => true,
            'founding_locked_price_monthly' => 299,
        ]);

        /** @var CheckoutService $checkoutService */
        $checkoutService = app(CheckoutService::class);

        // CheckoutService checks !$user->is_founding before applying founding price.
        // A user who is already founding gets the normal sticker price at checkout
        // (their locked price is applied via SubscriptionResource::effective_monthly_price,
        // not by discounting a new order — slot was already claimed).
        $checkoutService->createCheckout(
            user: $user->fresh(),
            plan: $proPlan,
            billingPeriod: BillingPeriod::Monthly,
            provider: PaymentProvider::Monobank,
            siteDomain: 'mystore.com.ua',
        );

        $order = Order::where('user_id', $user->id)->latest()->first();
        $this->assertNotNull($order);
        // The user is already founding → CheckoutService skips the discount
        $this->assertSame(499.0, (float) $order->amount);
        $this->assertOrderHasFoundingFlag($order, false);
    }

    // ─── Assertion helpers ─────────────────────────────────────────────────────

    /**
     * Assert whether an Order has the founding_price flag set in its notes.
     * Uses a raw DB read to avoid PHPStan's static narrowing of the cast type.
     */
    private function assertOrderHasFoundingFlag(Order $order, bool $expected): void
    {
        $raw = DB::table('orders')->where('id', $order->id)->value('notes');
        /** @var array<string, mixed> $notes */
        $notes = is_string($raw) ? json_decode($raw, true) : [];
        $actual = (bool) ($notes['founding_price'] ?? false);

        if ($expected) {
            $this->assertTrue($actual, 'Expected order notes.founding_price to be truthy');
        } else {
            $this->assertFalse($actual, 'Expected order notes.founding_price to be absent/falsy');
        }
    }
}
