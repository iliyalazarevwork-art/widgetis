<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Core\Models\Plan;
use App\Core\Models\Product;
use App\Core\Models\Subscription;
use App\Core\Models\User;
use App\Enums\BillingPeriod;
use App\Enums\ProductAvailability;
use App\Enums\SubscriptionStatus;
use App\Shared\ValueObjects\UserId;
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
        $this->service = $this->app->make(WidgetAccessService::class);
    }

    public function test_user_without_subscription_cannot_access_product(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct();

        $userId = UserId::fromString((string) $user->id);

        $this->assertFalse(
            $this->service->canAccessBySlug($userId, $product->slug, $product->availability->value, $product->id),
        );
    }

    public function test_user_with_active_subscription_can_access_product_in_plan(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct();
        $plan = $this->makePlan([$product]);
        $this->makeSubscription($user, $plan, SubscriptionStatus::Active);

        $userId = UserId::fromString((string) $user->id);

        $this->assertTrue(
            $this->service->canAccessBySlug($userId, $product->slug, $product->availability->value, $product->id),
        );
    }

    public function test_user_with_active_subscription_cannot_access_product_not_in_plan(): void
    {
        $user = User::factory()->create();
        $productInPlan = $this->makeProduct(['slug' => 'in-plan']);
        $productOutOfPlan = $this->makeProduct(['slug' => 'out-of-plan']);
        $plan = $this->makePlan([$productInPlan]);
        $this->makeSubscription($user, $plan, SubscriptionStatus::Active);

        $userId = UserId::fromString((string) $user->id);

        $this->assertFalse(
            $this->service->canAccessBySlug($userId, $productOutOfPlan->slug, $productOutOfPlan->availability->value, $productOutOfPlan->id),
        );
    }

    public function test_user_with_cancelled_subscription_cannot_access_product(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct();
        $plan = $this->makePlan([$product]);
        $this->makeSubscription($user, $plan, SubscriptionStatus::Cancelled);

        $userId = UserId::fromString((string) $user->id);

        $this->assertFalse(
            $this->service->canAccessBySlug($userId, $product->slug, $product->availability->value, $product->id),
        );
    }

    public function test_user_on_trial_can_access_product_in_plan(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct();
        $plan = $this->makePlan([$product]);
        $this->makeSubscription($user, $plan, SubscriptionStatus::Trial);

        $userId = UserId::fromString((string) $user->id);

        $this->assertTrue(
            $this->service->canAccessBySlug($userId, $product->slug, $product->availability->value, $product->id),
        );
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

        $userId = UserId::fromString((string) $user->id);

        $this->assertTrue(
            $this->service->canAccessBySlug($userId, $product->slug, $product->availability->value, $product->id),
        );
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

        $userId = UserId::fromString((string) $user->id);

        $this->assertTrue(
            $this->service->canAccessBySlug($userId, $grantedProduct->slug, $grantedProduct->availability->value, $grantedProduct->id),
        );
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

        $userId = UserId::fromString((string) $user->id);

        $this->assertFalse(
            $this->service->canAccessBySlug($userId, $product->slug, $product->availability->value, $product->id),
        );
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

        $userId = UserId::fromString((string) $user->id);

        $this->assertTrue(
            $this->service->canAccessBySlug($userId, $product->slug, $product->availability->value, $product->id),
        );
    }

    public function test_coming_soon_product_blocks_access_even_with_plan(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct(['availability' => ProductAvailability::ComingSoon]);
        $plan = $this->makePlan([$product]);
        $this->makeSubscription($user, $plan, SubscriptionStatus::Active);

        $userId = UserId::fromString((string) $user->id);

        $this->assertFalse(
            $this->service->canAccessBySlug($userId, $product->slug, $product->availability->value, $product->id),
        );
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

        $userId = UserId::fromString((string) $user->id);

        $this->assertFalse(
            $this->service->canAccessBySlug($userId, $product->slug, $product->availability->value, $product->id),
        );
    }

    public function test_archived_product_blocks_access(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct(['availability' => ProductAvailability::Archived]);
        $plan = $this->makePlan([$product]);
        $this->makeSubscription($user, $plan, SubscriptionStatus::Active);

        $userId = UserId::fromString((string) $user->id);

        $this->assertFalse(
            $this->service->canAccessBySlug($userId, $product->slug, $product->availability->value, $product->id),
        );
    }

    public function test_accessible_product_ids_includes_granted_products(): void
    {
        $user = User::factory()->create();
        $planProduct = $this->makeProduct(['slug' => 'plan-product']);
        $grantedProduct = $this->makeProduct(['slug' => 'granted-product']);
        $plan = $this->makePlan([$planProduct]);
        $this->makeSubscription($user, $plan, SubscriptionStatus::Active);

        UserWidgetGrant::create([
            'user_id' => $user->id,
            'product_id' => $grantedProduct->id,
            'reason' => 'Bonus access',
            'expires_at' => null,
        ]);

        $userId = UserId::fromString((string) $user->id);
        $ids = $this->service->accessibleProductIds($userId);

        $this->assertContains($grantedProduct->id, $ids);
    }

    public function test_accessible_product_ids_excludes_expired_grants(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct();

        UserWidgetGrant::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'reason' => 'Expired grant',
            'expires_at' => now()->subDay(),
        ]);

        $userId = UserId::fromString((string) $user->id);
        $ids = $this->service->accessibleProductIds($userId);

        $this->assertNotContains($product->id, $ids);
    }

    public function test_accessible_product_ids_with_no_grants_returns_empty(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct(['slug' => 'available']);
        $plan = $this->makePlan([$product]);
        $this->makeSubscription($user, $plan, SubscriptionStatus::Active);

        $userId = UserId::fromString((string) $user->id);
        $ids = $this->service->accessibleProductIds($userId);

        $this->assertEmpty($ids);
    }

    public function test_has_active_grant_by_product_id_returns_true_for_active_grant(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct();

        UserWidgetGrant::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'reason' => 'Test grant',
            'expires_at' => null,
        ]);

        $userId = UserId::fromString((string) $user->id);

        $this->assertTrue($this->service->hasActiveGrantByProductId($userId, $product->id));
    }

    public function test_has_active_grant_by_product_id_returns_false_for_expired_grant(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct();

        UserWidgetGrant::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'reason' => 'Expired',
            'expires_at' => now()->subDay(),
        ]);

        $userId = UserId::fromString((string) $user->id);

        $this->assertFalse($this->service->hasActiveGrantByProductId($userId, $product->id));
    }

    public function test_is_in_active_plan_by_slug_returns_true_when_product_in_plan(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct(['slug' => 'my-widget']);
        $plan = $this->makePlan([$product]);
        $this->makeSubscription($user, $plan, SubscriptionStatus::Active);

        $userId = UserId::fromString((string) $user->id);

        $this->assertTrue($this->service->isInActivePlanBySlug($userId, 'my-widget'));
    }

    public function test_is_in_active_plan_by_slug_returns_false_when_no_subscription(): void
    {
        $user = User::factory()->create();
        $this->makeProduct(['slug' => 'my-widget']);

        $userId = UserId::fromString((string) $user->id);

        $this->assertFalse($this->service->isInActivePlanBySlug($userId, 'my-widget'));
    }

    public function test_access_state_for_anonymous_user_on_available_product_is_locked(): void
    {
        $product = $this->makeProduct();

        $this->assertSame(
            ProductAccessState::Locked,
            $this->service->getAccessState(null, $product->slug, $product->availability->value, $product->id),
        );
    }

    public function test_access_state_for_anonymous_user_on_coming_soon_is_coming_soon(): void
    {
        $product = $this->makeProduct(['availability' => ProductAvailability::ComingSoon]);

        $this->assertSame(
            ProductAccessState::ComingSoon,
            $this->service->getAccessState(null, $product->slug, $product->availability->value, $product->id),
        );
    }

    public function test_access_state_for_archived_product_is_archived(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct(['availability' => ProductAvailability::Archived]);

        $userId = UserId::fromString((string) $user->id);

        $this->assertSame(
            ProductAccessState::Archived,
            $this->service->getAccessState($userId, $product->slug, $product->availability->value, $product->id),
        );
    }

    public function test_access_state_for_user_with_plan_is_available(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct();
        $plan = $this->makePlan([$product]);
        $this->makeSubscription($user, $plan, SubscriptionStatus::Active);

        $userId = UserId::fromString((string) $user->id);

        $this->assertSame(
            ProductAccessState::Available,
            $this->service->getAccessState($userId, $product->slug, $product->availability->value, $product->id),
        );
    }

    public function test_access_state_for_user_without_access_is_locked(): void
    {
        $user = User::factory()->create();
        $product = $this->makeProduct();

        $userId = UserId::fromString((string) $user->id);

        $this->assertSame(
            ProductAccessState::Locked,
            $this->service->getAccessState($userId, $product->slug, $product->availability->value, $product->id),
        );
    }

    /**
     * @param array<string, mixed> $overrides
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
            'sort_order' => 0,
        ], $overrides));
    }

    /**
     * @param list<Product> $products
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
