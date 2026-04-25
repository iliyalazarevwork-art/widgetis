<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BillingPeriod;
use App\Enums\ProductAvailability;
use App\Enums\SubscriptionStatus;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Subscription;
use App\Models\User;
use App\WidgetRuntime\Models\UserWidgetGrant;
use App\WidgetRuntime\Services\Widget\ProductAccessState;
use App\WidgetRuntime\Services\Widget\WidgetAccessService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WidgetAccessServiceTest extends TestCase
{
    use RefreshDatabase;

    private WidgetAccessService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new WidgetAccessService();
    }

    public function test_user_without_subscription_cannot_access_product(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct();

        $this->assertFalse($this->service->canAccess($user, $product));
    }

    public function test_user_with_active_subscription_can_access_product_in_plan(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct();
        $plan = $this->makePlan([$product]);
        $this->makeSubscription($user, $plan, SubscriptionStatus::Active);

        $this->assertTrue($this->service->canAccess($user, $product));
    }

    public function test_user_with_active_subscription_cannot_access_product_not_in_plan(): void
    {
        $user = User::factory()->create();
        $productInPlan = $this->makeProduct(['slug' => 'in-plan']);
        $productOutOfPlan = $this->makeProduct(['slug' => 'out-of-plan']);
        $plan = $this->makePlan([$productInPlan]);
        $this->makeSubscription($user, $plan, SubscriptionStatus::Active);

        $this->assertFalse($this->service->canAccess($user, $productOutOfPlan));
    }

    public function test_user_with_cancelled_subscription_cannot_access_product(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct();
        $plan = $this->makePlan([$product]);
        $this->makeSubscription($user, $plan, SubscriptionStatus::Cancelled);

        $this->assertFalse($this->service->canAccess($user, $product));
    }

    public function test_user_on_trial_can_access_product_in_plan(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct();
        $plan = $this->makePlan([$product]);
        $this->makeSubscription($user, $plan, SubscriptionStatus::Trial);

        $this->assertTrue($this->service->canAccess($user, $product));
    }

    public function test_active_manual_grant_allows_access_without_subscription(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct();

        UserWidgetGrant::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'reason' => 'VIP customer',
            'expires_at' => null,
        ]);

        $this->assertTrue($this->service->canAccess($user, $product));
    }

    public function test_active_manual_grant_allows_access_for_product_outside_plan(): void
    {
        $user = User::factory()->create();
        $planProduct = $this->makeProduct(['slug' => 'in-plan']);
        $grantedProduct = $this->makeProduct(['slug' => 'granted']);
        $plan = $this->makePlan([$planProduct]);
        $this->makeSubscription($user, $plan, SubscriptionStatus::Active);

        UserWidgetGrant::create([
            'user_id' => $user->id,
            'product_id' => $grantedProduct->id,
            'reason' => 'Compensation for downtime',
            'expires_at' => null,
        ]);

        $this->assertTrue($this->service->canAccess($user, $grantedProduct));
    }

    public function test_expired_manual_grant_does_not_allow_access(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct();

        UserWidgetGrant::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'reason' => 'Temporary trial',
            'expires_at' => now()->subDay(),
        ]);

        $this->assertFalse($this->service->canAccess($user, $product));
    }

    public function test_future_expiring_manual_grant_allows_access(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct();

        UserWidgetGrant::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'reason' => '30-day promo',
            'expires_at' => now()->addDays(30),
        ]);

        $this->assertTrue($this->service->canAccess($user, $product));
    }

    public function test_coming_soon_product_blocks_access_even_with_plan(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct(['availability' => ProductAvailability::ComingSoon]);
        $plan = $this->makePlan([$product]);
        $this->makeSubscription($user, $plan, SubscriptionStatus::Active);

        $this->assertFalse($this->service->canAccess($user, $product));
    }

    public function test_coming_soon_product_blocks_access_even_with_grant(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct(['availability' => ProductAvailability::ComingSoon]);

        UserWidgetGrant::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'reason' => 'Early access',
            'expires_at' => null,
        ]);

        $this->assertFalse($this->service->canAccess($user, $product));
    }

    public function test_archived_product_blocks_access(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct(['availability' => ProductAvailability::Archived]);
        $plan = $this->makePlan([$product]);
        $this->makeSubscription($user, $plan, SubscriptionStatus::Active);

        $this->assertFalse($this->service->canAccess($user, $product));
    }

    public function test_accessible_products_returns_union_of_plan_and_grants(): void
    {
        $user = User::factory()->create();
        $planProduct = $this->makeProduct(['slug' => 'plan-product']);
        $grantedProduct = $this->makeProduct(['slug' => 'granted-product']);
        $otherProduct = $this->makeProduct(['slug' => 'other-product']);
        $plan = $this->makePlan([$planProduct]);
        $this->makeSubscription($user, $plan, SubscriptionStatus::Active);

        UserWidgetGrant::create([
            'user_id' => $user->id,
            'product_id' => $grantedProduct->id,
            'reason' => 'Bonus access',
            'expires_at' => null,
        ]);

        $accessible = $this->service->accessibleProducts($user);
        $ids = $accessible->pluck('id')->all();

        $this->assertCount(2, $accessible);
        $this->assertContains($planProduct->id, $ids);
        $this->assertContains($grantedProduct->id, $ids);
        $this->assertNotContains($otherProduct->id, $ids);
    }

    public function test_accessible_products_excludes_coming_soon_and_archived(): void
    {
        $user = User::factory()->create();
        $available = $this->makeProduct(['slug' => 'available']);
        $comingSoon = $this->makeProduct(['slug' => 'coming', 'availability' => ProductAvailability::ComingSoon]);
        $plan = $this->makePlan([$available, $comingSoon]);
        $this->makeSubscription($user, $plan, SubscriptionStatus::Active);

        $accessible = $this->service->accessibleProducts($user);

        $this->assertCount(1, $accessible);
        $this->assertSame($available->id, $accessible->first()?->id);
    }

    public function test_access_state_for_anonymous_user_on_available_product_is_locked(): void
    {
        $product = $this->makeProduct();

        $this->assertSame(
            ProductAccessState::Locked,
            $this->service->getAccessState(null, $product),
        );
    }

    public function test_access_state_for_anonymous_user_on_coming_soon_is_coming_soon(): void
    {
        $product = $this->makeProduct(['availability' => ProductAvailability::ComingSoon]);

        $this->assertSame(
            ProductAccessState::ComingSoon,
            $this->service->getAccessState(null, $product),
        );
    }

    public function test_access_state_for_archived_product_is_archived(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct(['availability' => ProductAvailability::Archived]);

        $this->assertSame(
            ProductAccessState::Archived,
            $this->service->getAccessState($user, $product),
        );
    }

    public function test_accessible_products_excludes_expired_grants(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct();

        UserWidgetGrant::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'reason' => 'Expired grant',
            'expires_at' => now()->subDay(),
        ]);

        $accessible = $this->service->accessibleProducts($user);

        $this->assertCount(0, $accessible);
    }

    public function test_access_state_for_user_with_plan_is_available(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct();
        $plan = $this->makePlan([$product]);
        $this->makeSubscription($user, $plan, SubscriptionStatus::Active);

        $this->assertSame(
            ProductAccessState::Available,
            $this->service->getAccessState($user, $product),
        );
    }

    public function test_access_state_for_user_without_access_is_locked(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct();

        $this->assertSame(
            ProductAccessState::Locked,
            $this->service->getAccessState($user, $product),
        );
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function makeProduct(array $overrides = []): Product
    {
        return Product::create(array_merge([
            'slug' => 'test-product-' . uniqid(),
            'name' => ['en' => 'Test', 'uk' => 'Тест'],
            'description' => ['en' => 'Test product', 'uk' => 'Тестовий продукт'],
            'icon' => 'box',
            'platform' => 'horoshop',
            'status' => 'active',
            'availability' => ProductAvailability::Available,
            'builder_module' => 'test',
            'sort_order' => 0,
        ], $overrides));
    }

    /**
     * @param  list<Product>  $products
     */
    private function makePlan(array $products): Plan
    {
        $plan = Plan::create([
            'slug' => 'test-plan-' . uniqid(),
            'name' => ['en' => 'Test Plan', 'uk' => 'Тестовий план'],
            'description' => ['en' => 'Test', 'uk' => 'Тест'],
            'price_monthly' => 999,
            'price_yearly' => 9999,
            'trial_days' => 7,
            'max_sites' => 1,
            'max_widgets' => 10,
            'features' => [],
            'is_recommended' => false,
            'sort_order' => 0,
            'is_active' => true,
        ]);

        if ($products !== []) {
            $plan->products()->sync(array_map(fn (Product $p) => $p->id, $products));
        }

        return $plan;
    }

    private function makeSubscription(User $user, Plan $plan, SubscriptionStatus $status): Subscription
    {
        return Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'billing_period' => BillingPeriod::Monthly->value,
            'status' => $status,
            'is_trial' => $status === SubscriptionStatus::Trial,
            'trial_ends_at' => $status === SubscriptionStatus::Trial ? now()->addDays(7) : null,
            'current_period_start' => now()->subDay(),
            'current_period_end' => now()->addMonth(),
        ]);
    }
}
