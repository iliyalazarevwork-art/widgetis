<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Core\Models\Product;
use App\Core\Models\User;
use App\Enums\UserRole;
use App\WidgetRuntime\Jobs\RebuildSiteScriptJob;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Models\SiteWidget;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

/**
 * Admin /sites/{id}/configure must read and write the same source of truth
 * as the customer cabinet — `wgt_site_widgets`. These tests pin the contract:
 * the GET response carries product slugs (so the frontend can map widget-builder
 * module IDs back to product_id), and PUT triggers a rebuild so that the
 * R2-hosted bundle reflects admin edits without a separate "deploy" step.
 */
class AdminSiteWidgetEditorTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(UserRole::Admin->value);

        return $user;
    }

    private function siteFor(User $owner, string $domain = 'test.example'): Site
    {
        /** @var Site $site */
        $site = Site::create([
            'user_id' => $owner->id,
            'domain' => $domain,
            'url' => "https://{$domain}",
            'name' => $domain,
            'platform' => 'horoshop',
            'status' => 'active',
        ]);

        return $site;
    }

    public function test_show_returns_slug_per_widget_and_full_products_catalog(): void
    {
        $admin = $this->admin();
        $owner = User::factory()->create();
        $owner->assignRole(UserRole::Customer->value);
        $site = $this->siteFor($owner);

        $cartRecommender = Product::factory()->create(['slug' => 'cart-recommender', 'name' => 'Cart Recommender']);
        $phoneMask = Product::factory()->create(['slug' => 'phone-mask', 'name' => 'Phone Mask']);

        SiteWidget::create([
            'site_id' => $site->id,
            'product_id' => $cartRecommender->id,
            'is_enabled' => true,
            'config' => ['config' => ['enabled' => true], 'i18n' => []],
        ]);

        $response = $this->actingAs($admin, 'core')
            ->getJson("/api/v1/admin/sites/{$site->id}")
            ->assertOk();

        $response->assertJsonPath('data.widgets.0.slug', 'cart-recommender');
        $response->assertJsonPath('data.widgets.0.is_enabled', true);

        /** @var array<int, array{slug: string}> $products */
        $products = $response->json('data.products');
        $slugs = array_column($products, 'slug');
        $this->assertContains($cartRecommender->slug, $slugs);
        $this->assertContains($phoneMask->slug, $slugs);
    }

    public function test_update_widget_dispatches_rebuild_job(): void
    {
        Bus::fake();

        $admin = $this->admin();
        $owner = User::factory()->create();
        $owner->assignRole(UserRole::Customer->value);
        $site = $this->siteFor($owner);

        $product = Product::factory()->create(['slug' => 'phone-mask']);

        $this->actingAs($admin, 'core')
            ->putJson("/api/v1/admin/sites/{$site->id}/widgets/{$product->id}", [
                'is_enabled' => true,
                'config' => ['config' => ['mask' => '+38 (___) ___-__-__'], 'i18n' => []],
            ])
            ->assertOk();

        Bus::assertDispatched(
            RebuildSiteScriptJob::class,
            fn (RebuildSiteScriptJob $job) => $job->siteId === $site->id,
        );

        $this->assertDatabaseHas('wgt_site_widgets', [
            'site_id' => $site->id,
            'product_id' => $product->id,
            'is_enabled' => true,
        ], 'pgsql_runtime');
    }
}
