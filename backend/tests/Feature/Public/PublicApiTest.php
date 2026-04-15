<?php

declare(strict_types=1);

namespace Tests\Feature\Public;

use App\Models\CustomerCase;
use App\Models\FaqItem;
use App\Models\Plan;
use App\Models\Product;
use App\Models\WidgetTag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Covers the public (unauthenticated) surface of the v1 API.
 *
 * These endpoints drive the marketing site and are the highest-traffic
 * routes we have — a regression here is visible to every visitor.
 */
class PublicApiTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Health / system
    // -------------------------------------------------------------------------

    public function test_health_endpoint_returns_ok_with_version_and_timestamp(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(200)
            ->assertJsonStructure(['status', 'version', 'timestamp'])
            ->assertJsonPath('status', 'ok');
    }

    public function test_platforms_endpoint_returns_array_of_platforms(): void
    {
        $response = $this->getJson('/api/v1/platforms');

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);

        $data = $response->json('data');
        $this->assertIsArray($data);
        $this->assertNotEmpty($data);
    }

    public function test_settings_endpoint_returns_contact_details(): void
    {
        // Settings are seeded by the Spatie settings migration, so RefreshDatabase
        // gives us real values without an explicit seeder.
        $response = $this->getJson('/api/v1/settings');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['phone', 'email', 'business_hours', 'socials', 'messengers', 'stats'],
            ]);
    }

    // -------------------------------------------------------------------------
    // Plans
    // -------------------------------------------------------------------------

    public function test_plans_index_returns_only_active_plans_ordered_by_sort_order(): void
    {
        Plan::factory()->create(['slug' => 'alpha', 'sort_order' => 2]);
        Plan::factory()->create(['slug' => 'bravo', 'sort_order' => 1]);
        Plan::factory()->inactive()->create(['slug' => 'hidden']);

        $response = $this->getJson('/api/v1/plans');

        $response->assertStatus(200);

        /** @var array<int, array{slug: string}> $data */
        $data = $response->json('data');
        $slugs = array_column($data, 'slug');
        $this->assertContains('alpha', $slugs);
        $this->assertContains('bravo', $slugs);
        $this->assertNotContains('hidden', $slugs, 'inactive plans must not leak into public listing');

        // Sort order: bravo (1) before alpha (2).
        $this->assertLessThan(
            array_search('alpha', $slugs, true),
            array_search('bravo', $slugs, true),
        );
    }

    public function test_plans_features_endpoint_returns_matrix_structure(): void
    {
        Plan::factory()->create();

        $response = $this->getJson('/api/v1/plans/features');

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    // -------------------------------------------------------------------------
    // Products / widgets catalog
    // -------------------------------------------------------------------------

    public function test_products_index_returns_paginated_active_products(): void
    {
        Product::factory()->count(3)->create();
        // status=draft is filtered out by the Active scope (Product::scopeActive).
        Product::factory()->create(['status' => 'draft']);

        $response = $this->getJson('/api/v1/products');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);

        // Only the 3 active products are paginated, archived one is excluded.
        $this->assertSame(3, $response->json('meta.total'));
    }

    public function test_products_index_filters_by_platform(): void
    {
        Product::factory()->count(2)->create(['platform' => 'horoshop']);
        Product::factory()->create(['platform' => 'woocommerce']);

        $response = $this->getJson('/api/v1/products?platform=horoshop');

        $response->assertStatus(200);
        $this->assertSame(2, $response->json('meta.total'));
    }

    public function test_products_index_respects_per_page_limit(): void
    {
        Product::factory()->count(5)->create();

        $response = $this->getJson('/api/v1/products?per_page=2');

        $response->assertStatus(200);
        $this->assertSame(2, $response->json('meta.per_page'));
        $this->assertSame(5, $response->json('meta.total'));
        $this->assertCount(2, $response->json('data'));
    }

    public function test_products_show_returns_detail_for_existing_slug(): void
    {
        $product = Product::factory()->create(['slug' => 'progress-bar']);

        $response = $this->getJson('/api/v1/products/progress-bar');

        $response->assertStatus(200)
            ->assertJsonPath('data.slug', $product->slug);
    }

    public function test_products_show_returns_404_for_unknown_slug(): void
    {
        $response = $this->getJson('/api/v1/products/does-not-exist');

        $response->assertStatus(404);
    }

    public function test_products_show_hides_inactive_product(): void
    {
        Product::factory()->create(['slug' => 'hidden-widget', 'status' => 'draft']);

        $response = $this->getJson('/api/v1/products/hidden-widget');

        $response->assertStatus(404);
    }

    // -------------------------------------------------------------------------
    // Tags
    // -------------------------------------------------------------------------

    public function test_tags_index_returns_all_tags(): void
    {
        WidgetTag::create([
            'slug' => 'urgency',
            'name' => ['en' => 'Urgency', 'uk' => 'Терміновість'],
            'color' => '#ff0000',
            'sort_order' => 0,
        ]);

        $response = $this->getJson('/api/v1/tags');

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
        $this->assertNotEmpty($response->json('data'));
    }

    // -------------------------------------------------------------------------
    // Cases (marketing landing proof-of-work strip)
    // -------------------------------------------------------------------------

    public function test_cases_index_returns_only_published_cases(): void
    {
        CustomerCase::create([
            'store' => 'Published Shop',
            'store_url' => 'https://published.example',
            'owner' => 'Owner',
            'platform' => 'horoshop',
            'description' => ['en' => 'desc', 'uk' => 'опис'],
            'review_text' => 'Great',
            'review_rating' => 5,
            'result_metric' => '+20%',
            'result_period' => '1mo',
            'color' => '#000',
            'is_published' => true,
            'sort_order' => 0,
        ]);
        CustomerCase::create([
            'store' => 'Draft Shop',
            'store_url' => 'https://draft.example',
            'owner' => 'Owner',
            'platform' => 'horoshop',
            'description' => ['en' => 'd', 'uk' => 'о'],
            'review_text' => 'x',
            'review_rating' => 4,
            'result_metric' => '+1%',
            'result_period' => '1mo',
            'color' => '#fff',
            'is_published' => false,
            'sort_order' => 1,
        ]);

        $response = $this->getJson('/api/v1/cases');

        $response->assertStatus(200);
        /** @var array<int, array{store: string}> $data */
        $data = $response->json('data');
        $stores = array_column($data, 'store');
        $this->assertContains('Published Shop', $stores);
        $this->assertNotContains('Draft Shop', $stores);
    }

    // -------------------------------------------------------------------------
    // FAQ
    // -------------------------------------------------------------------------

    public function test_faq_index_returns_published_items(): void
    {
        FaqItem::create([
            'category' => 'general',
            'question' => ['en' => 'Q1', 'uk' => 'П1'],
            'answer' => ['en' => 'A1', 'uk' => 'В1'],
            'is_published' => true,
            'sort_order' => 0,
        ]);

        $response = $this->getJson('/api/v1/faq');

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
        $this->assertNotEmpty($response->json('data'));
    }

    // -------------------------------------------------------------------------
    // Lead capture endpoints
    // -------------------------------------------------------------------------

    public function test_consultations_store_validates_name(): void
    {
        // The app wraps ValidationException into {error: {code, details: {...}}}
        // (see bootstrap/app.php), so the default Laravel helper
        // assertJsonValidationErrors() would miss the errors bag. We assert
        // the path directly.
        $response = $this->postJson('/api/v1/consultations', []);

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
        $this->assertArrayHasKey('name', $response->json('error.details'));
    }

    public function test_consultations_store_persists_valid_request(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/v1/consultations', [
            'name' => 'Test User',
            'phone' => '+380961234567',
            'email' => 'hello@example.com',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('consultations', [
            'name' => 'Test User',
            'phone' => '+380961234567',
            'status' => 'new',
        ]);
    }

    public function test_manager_request_rejects_invalid_messenger(): void
    {
        $response = $this->postJson('/api/v1/manager-requests', [
            'messenger' => 'carrier-pigeon',
        ]);

        $response->assertStatus(422);
        $this->assertArrayHasKey('messenger', $response->json('error.details'));
    }

    public function test_manager_request_accepts_valid_messenger(): void
    {
        $response = $this->postJson('/api/v1/manager-requests', [
            'messenger' => 'telegram',
            'phone' => '+380961234567',
            'message' => 'Call me back please',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('manager_requests', [
            'phone' => '+380961234567',
            'type' => 'demo_request',
            'status' => 'new',
        ]);
    }

    public function test_lead_request_rejects_missing_phone(): void
    {
        $response = $this->postJson('/api/v1/lead-requests', [
            'type' => 'plan',
            'target_id' => 'pro',
        ]);

        $response->assertStatus(422);
        $this->assertArrayHasKey('phone', $response->json('error.details'));
    }

    public function test_lead_request_rejects_invalid_type(): void
    {
        $response = $this->postJson('/api/v1/lead-requests', [
            'type' => 'invalid',
            'target_id' => 'pro',
            'phone' => '+380961234567',
        ]);

        $response->assertStatus(422);
        $this->assertArrayHasKey('type', $response->json('error.details'));
    }

    public function test_lead_request_accepts_valid_plan_interest(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/v1/lead-requests', [
            'type' => 'plan',
            'target_id' => 'pro',
            'phone' => '+380961234567',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('manager_requests', [
            'phone' => '+380961234567',
            'type' => 'plan_interest',
        ]);
    }
}
