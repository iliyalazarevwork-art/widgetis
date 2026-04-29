<?php

declare(strict_types=1);

namespace Tests\Feature\Recommender;

use App\WidgetRuntime\Enums\CartRecommenderRelationSource;
use App\WidgetRuntime\Models\CartRecommenderRelation;
use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Services\Widget\CartRecommender\Composer\ComposerInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Feature tests for GET /api/v1/widget/cart-recommender/suggest
 *
 * LiveProductEnricher is mocked via the container so Cartum HTTP is never hit.
 * CartRecommenderRelation rows are pre-seeded to exercise the cache-hit path.
 */
final class SuggestEndpointTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/v1/widget/cart-recommender/suggest';

    // ------------------------------------------------------------------
    // Set up
    // ------------------------------------------------------------------

    protected function setUp(): void
    {
        parent::setUp();

        // Bind a no-op ComposerInterface so CartRecommenderService never calls OpenAI.
        // Tests that pre-seed CartRecommenderRelation rows will hit the "fresh existing"
        // path before the composer is ever invoked; this binding is a safety net for
        // tests where no relations exist (category fallback path also skips the composer).
        $this->app->bind(ComposerInterface::class, static function () {
            return new class () implements ComposerInterface {
                public function composeFor(\App\WidgetRuntime\Models\CatalogProduct $source): array
                {
                    return [];
                }
            };
        });
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private function makeSite(string $domain = 'shop.example.com'): Site
    {
        return Site::factory()->create(['domain' => $domain]);
    }

    private function originHeader(string $domain): array
    {
        return ['Origin' => "https://{$domain}"];
    }

    /**
     * Make Cartum auth endpoints return an error so LiveProductEnricher falls back
     * to DB snapshot (live = false) without requiring an actual Cartum server.
     *
     * LiveProductEnricher is `final readonly` so it cannot be subclassed or mocked.
     * Using Http::fake() on the Cartum auth URL is the idiomatic way to force the
     * graceful snapshot fallback path that the enricher already handles internally.
     *
     * The Site domain pattern covers any Cartum auth endpoint for any domain.
     */
    private function fakeCartumFailing(): void
    {
        Http::fake([
            '*/api/auth/*' => Http::response(['status' => 'ERROR'], 200),
        ]);
    }

    // ------------------------------------------------------------------
    // Origin / site resolution
    // ------------------------------------------------------------------

    #[Test]
    public function it_returns_403_when_origin_header_is_missing(): void
    {
        $this->getJson(self::ENDPOINT . '?sku=foo')
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'UNKNOWN_ORIGIN');
    }

    #[Test]
    public function it_returns_403_when_origin_domain_is_not_registered(): void
    {
        $this->getJson(
            self::ENDPOINT . '?sku=foo',
            $this->originHeader('unregistered-domain.com'),
        )
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'UNKNOWN_ORIGIN');
    }

    // ------------------------------------------------------------------
    // SKU resolution
    // ------------------------------------------------------------------

    #[Test]
    public function it_returns_empty_data_when_sku_is_unknown(): void
    {
        $site = $this->makeSite();

        $response = $this->getJson(
            self::ENDPOINT . '?sku=nonexistent-sku',
            $this->originHeader($site->domain),
        );

        $response->assertOk();
        $response->assertJsonPath('data', []);
        $response->assertJsonPath('meta.source_product_id', null);
        $response->assertJsonPath('meta.source_sku', 'nonexistent-sku');
        $response->assertJsonPath('meta.live', false);
    }

    #[Test]
    public function it_returns_suggestions_when_sku_matches_and_relations_are_seeded(): void
    {
        $site = $this->makeSite();

        $source = CatalogProduct::factory()->create([
            'site_id'  => $site->id,
            'sku'      => 'source-sku-001',
            'title_ua' => 'Джерело',
            'price'    => '500.00',
            'in_stock' => true,
            'currency' => 'UAH',
        ]);

        $related1 = CatalogProduct::factory()->create([
            'site_id'  => $site->id,
            'sku'      => 'related-sku-001',
            'title_ua' => 'Рекомендований 1',
            'price'    => '400.00',
            'in_stock' => true,
            'currency' => 'UAH',
        ]);

        $related2 = CatalogProduct::factory()->create([
            'site_id'  => $site->id,
            'sku'      => 'related-sku-002',
            'title_ua' => 'Рекомендований 2',
            'price'    => '600.00',
            'in_stock' => true,
            'currency' => 'UAH',
        ]);

        // Pre-seed relations (cache-hit path in CartRecommenderService).
        CartRecommenderRelation::factory()->create([
            'site_id'            => $site->id,
            'source_product_id'  => $source->id,
            'related_product_id' => $related1->id,
            'score'              => 0.9,
            'rationale_ua'       => 'Часто купують разом',
            'rationale_en'       => 'Often bought together',
            'source'             => CartRecommenderRelationSource::LazyAi,
            'expires_at'         => now()->addHours(24),
        ]);

        CartRecommenderRelation::factory()->create([
            'site_id'            => $site->id,
            'source_product_id'  => $source->id,
            'related_product_id' => $related2->id,
            'score'              => 0.7,
            'rationale_ua'       => null,
            'rationale_en'       => null,
            'source'             => CartRecommenderRelationSource::CategoryFallback,
            'expires_at'         => now()->addHours(24),
        ]);

        $this->fakeCartumFailing();

        $response = $this->getJson(
            self::ENDPOINT . '?sku=source-sku-001',
            $this->originHeader($site->domain),
        );

        $response->assertOk();
        $response->assertJsonPath('meta.source_product_id', $source->id);
        $response->assertJsonPath('meta.source_sku', 'source-sku-001');
        $response->assertJsonPath('meta.live', false);

        $data = $response->json('data');
        $this->assertCount(2, $data);

        // Verify shape of first item.
        $item = $data[0];
        $this->assertArrayHasKey('id', $item);
        $this->assertArrayHasKey('sku', $item);
        $this->assertArrayHasKey('url', $item);
        $this->assertArrayHasKey('image', $item);
        $this->assertArrayHasKey('title', $item);
        $this->assertArrayHasKey('price_new', $item);
        $this->assertArrayHasKey('price_old', $item);
        $this->assertArrayHasKey('currency', $item);
        $this->assertArrayHasKey('rationale', $item);
        $this->assertArrayHasKey('source', $item);
    }

    // ------------------------------------------------------------------
    // product_id resolution (Phase 1 compat)
    // ------------------------------------------------------------------

    #[Test]
    public function it_returns_suggestions_when_product_id_matches(): void
    {
        $site = $this->makeSite('compat-store.com');

        $source = CatalogProduct::factory()->create([
            'site_id'  => $site->id,
            'sku'      => 'compat-sku',
            'price'    => '300.00',
            'in_stock' => true,
            'currency' => 'UAH',
        ]);

        $related = CatalogProduct::factory()->create([
            'site_id'  => $site->id,
            'sku'      => 'compat-related',
            'price'    => '250.00',
            'in_stock' => true,
            'currency' => 'UAH',
        ]);

        CartRecommenderRelation::factory()->create([
            'site_id'            => $site->id,
            'source_product_id'  => $source->id,
            'related_product_id' => $related->id,
            'score'              => 0.8,
            'source'             => CartRecommenderRelationSource::LazyAi,
            'expires_at'         => now()->addHours(24),
        ]);

        $this->fakeCartumFailing();

        $response = $this->getJson(
            self::ENDPOINT . "?product_id={$source->id}",
            $this->originHeader($site->domain),
        );

        $response->assertOk();
        $response->assertJsonPath('meta.source_product_id', $source->id);
        $response->assertJsonPath('meta.source_sku', 'compat-sku');

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertSame($related->id, $data[0]['id']);
    }

    #[Test]
    public function it_returns_empty_data_when_product_id_is_unknown(): void
    {
        $site = $this->makeSite();

        $response = $this->getJson(
            self::ENDPOINT . '?product_id=999999',
            $this->originHeader($site->domain),
        );

        $response->assertOk();
        $response->assertJsonPath('data', []);
        $response->assertJsonPath('meta.source_product_id', null);
        $response->assertJsonPath('meta.live', false);
    }

    // ------------------------------------------------------------------
    // sku takes precedence over product_id when both supplied
    // ------------------------------------------------------------------

    #[Test]
    public function sku_takes_precedence_over_product_id_when_both_are_supplied(): void
    {
        $site = $this->makeSite('precedence.com');

        // SKU-based source product.
        $skuSource = CatalogProduct::factory()->create([
            'site_id' => $site->id,
            'sku'     => 'priority-sku',
            'price'   => '100.00',
        ]);

        // Unrelated source product (id-based, should be ignored).
        $idSource = CatalogProduct::factory()->create([
            'site_id' => $site->id,
            'sku'     => 'ignored-sku',
            'price'   => '200.00',
        ]);

        $related = CatalogProduct::factory()->create([
            'site_id'  => $site->id,
            'sku'      => 'priority-related',
            'price'    => '90.00',
            'in_stock' => true,
        ]);

        // Only seed relation for SKU source.
        CartRecommenderRelation::factory()->create([
            'site_id'            => $site->id,
            'source_product_id'  => $skuSource->id,
            'related_product_id' => $related->id,
            'score'              => 0.95,
            'source'             => CartRecommenderRelationSource::LazyAi,
            'expires_at'         => now()->addHours(24),
        ]);

        $this->fakeCartumFailing();

        $response = $this->getJson(
            self::ENDPOINT . "?sku=priority-sku&product_id={$idSource->id}",
            $this->originHeader($site->domain),
        );

        $response->assertOk();
        // Result must be resolved via SKU, not product_id.
        $response->assertJsonPath('meta.source_product_id', $skuSource->id);
        $response->assertJsonPath('meta.source_sku', 'priority-sku');
        $this->assertCount(1, $response->json('data'));
    }

    // ------------------------------------------------------------------
    // Response shape / frontend regression
    // ------------------------------------------------------------------

    #[Test]
    public function it_includes_all_required_response_fields_for_frontend_compat(): void
    {
        $site = $this->makeSite('shape-check.com');

        $source = CatalogProduct::factory()->create([
            'site_id'  => $site->id,
            'sku'      => 'shape-src',
            'price'    => '999.00',
            'in_stock' => true,
        ]);

        $related = CatalogProduct::factory()->create([
            'site_id'   => $site->id,
            'sku'       => 'shape-rel',
            'title_ua'  => 'Товар для перевірки',
            'price'     => '888.00',
            'old_price' => '1000.00',
            'currency'  => 'UAH',
            'image_url' => 'https://cdn.example.com/img.jpg',
            'alias'     => 'product-alias',
            'in_stock'  => true,
        ]);

        CartRecommenderRelation::factory()->create([
            'site_id'            => $site->id,
            'source_product_id'  => $source->id,
            'related_product_id' => $related->id,
            'score'              => 0.85,
            'rationale_ua'       => 'Підходить за стилем',
            'rationale_en'       => 'Matches by style',
            'source'             => CartRecommenderRelationSource::LazyAi,
            'expires_at'         => now()->addHours(24),
        ]);

        $this->fakeCartumFailing();

        $response = $this->getJson(
            self::ENDPOINT . '?sku=shape-src',
            $this->originHeader($site->domain),
        );

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                [
                    'id',
                    'sku',
                    'horoshop_id',
                    'url',
                    'image',
                    'title',
                    'price_new',
                    'price_old',
                    'currency',
                    'rationale',
                    'source',
                ],
            ],
            'meta' => [
                'source_product_id',
                'source_sku',
                'live',
            ],
        ]);

        $item = $response->json('data.0');
        $this->assertSame($related->id, $item['id']);
        $this->assertSame('shape-rel', $item['sku']);
        $this->assertSame('/product-alias/', $item['url']);
        $this->assertSame('https://cdn.example.com/img.jpg', $item['image']);
        $this->assertSame('lazy_ai', $item['source']);
        $this->assertSame('Підходить за стилем', $item['rationale']['ua'] ?? null);
        $this->assertSame('Matches by style', $item['rationale']['en'] ?? null);
        $this->assertFalse($response->json('meta.live'));
    }

    // ------------------------------------------------------------------
    // No params supplied
    // ------------------------------------------------------------------

    #[Test]
    public function it_returns_empty_data_when_neither_sku_nor_product_id_supplied(): void
    {
        $site = $this->makeSite();

        $response = $this->getJson(
            self::ENDPOINT,
            $this->originHeader($site->domain),
        );

        $response->assertOk();
        $response->assertJsonPath('data', []);
        $response->assertJsonPath('meta.source_product_id', null);
        $response->assertJsonPath('meta.live', false);
    }

    // ------------------------------------------------------------------
    // allowed_origins fallback (TASK 1)
    // ------------------------------------------------------------------

    #[Test]
    public function it_returns_200_when_origin_matches_allowed_origins_full_url(): void
    {
        // Site whose domain does NOT match localhost but whose allowed_origins does.
        $site = Site::factory()->create([
            'domain'          => 'real-shop.example.com',
            'allowed_origins' => ['http://localhost:3100'],
        ]);

        $response = $this->getJson(
            self::ENDPOINT,
            ['Origin' => 'http://localhost:3100/some/path'],
        );

        // No sku/product_id → empty data, but 200 means the site was resolved.
        $response->assertOk();
        $response->assertJsonPath('data', []);
    }

    #[Test]
    public function it_returns_403_when_domain_mismatches_and_allowed_origins_has_no_overlap(): void
    {
        Site::factory()->create([
            'domain'          => 'other-shop.example.com',
            'allowed_origins' => ['http://localhost:9999'],
        ]);

        $response = $this->getJson(
            self::ENDPOINT . '?sku=foo',
            ['Origin' => 'http://localhost:3100'],
        );

        $response->assertStatus(403)
            ->assertJsonPath('error.code', 'UNKNOWN_ORIGIN');
    }

    // ------------------------------------------------------------------
    // alias resolution (TASK 2)
    // ------------------------------------------------------------------

    #[Test]
    public function it_resolves_product_and_returns_suggestions_when_alias_matches(): void
    {
        $site = $this->makeSite('alias-shop.com');

        $source = CatalogProduct::factory()->create([
            'site_id'  => $site->id,
            'sku'      => 'alias-src-sku',
            'alias'    => 'my-product-alias',
            'price'    => '100.00',
            'in_stock' => true,
            'currency' => 'UAH',
        ]);

        $related = CatalogProduct::factory()->create([
            'site_id'  => $site->id,
            'sku'      => 'alias-rel-sku',
            'price'    => '90.00',
            'in_stock' => true,
            'currency' => 'UAH',
        ]);

        CartRecommenderRelation::factory()->create([
            'site_id'            => $site->id,
            'source_product_id'  => $source->id,
            'related_product_id' => $related->id,
            'score'              => 0.8,
            'source'             => CartRecommenderRelationSource::LazyAi,
            'expires_at'         => now()->addHours(24),
        ]);

        $this->fakeCartumFailing();

        $response = $this->getJson(
            self::ENDPOINT . '?alias=my-product-alias',
            $this->originHeader($site->domain),
        );

        $response->assertOk();
        $response->assertJsonPath('meta.source_product_id', $source->id);
        $response->assertJsonPath('meta.source_sku', 'alias-src-sku');
        $this->assertCount(1, $response->json('data'));
    }

    #[Test]
    public function alias_is_normalised_to_lowercase_before_lookup(): void
    {
        $site = $this->makeSite('alias-case.com');

        $source = CatalogProduct::factory()->create([
            'site_id'  => $site->id,
            'sku'      => 'case-sku',
            'alias'    => 'existing-alias',  // stored lowercase
            'price'    => '200.00',
            'in_stock' => true,
        ]);

        $related = CatalogProduct::factory()->create([
            'site_id'  => $site->id,
            'sku'      => 'case-rel-sku',
            'price'    => '180.00',
            'in_stock' => true,
        ]);

        CartRecommenderRelation::factory()->create([
            'site_id'            => $site->id,
            'source_product_id'  => $source->id,
            'related_product_id' => $related->id,
            'score'              => 0.75,
            'source'             => CartRecommenderRelationSource::LazyAi,
            'expires_at'         => now()->addHours(24),
        ]);

        $this->fakeCartumFailing();

        // Supply mixed-case alias — controller must normalise before query.
        $response = $this->getJson(
            self::ENDPOINT . '?alias=Existing-ALIAS',
            $this->originHeader($site->domain),
        );

        $response->assertOk();
        $response->assertJsonPath('meta.source_product_id', $source->id);
        $this->assertCount(1, $response->json('data'));
    }

    #[Test]
    public function alias_leading_and_trailing_slashes_are_stripped_before_lookup(): void
    {
        $site = $this->makeSite('alias-slashes.com');

        $source = CatalogProduct::factory()->create([
            'site_id'  => $site->id,
            'sku'      => 'slash-sku',
            'alias'    => 'foo',  // stored without slashes
            'price'    => '300.00',
            'in_stock' => true,
        ]);

        $related = CatalogProduct::factory()->create([
            'site_id'  => $site->id,
            'sku'      => 'slash-rel-sku',
            'price'    => '270.00',
            'in_stock' => true,
        ]);

        CartRecommenderRelation::factory()->create([
            'site_id'            => $site->id,
            'source_product_id'  => $source->id,
            'related_product_id' => $related->id,
            'score'              => 0.7,
            'source'             => CartRecommenderRelationSource::LazyAi,
            'expires_at'         => now()->addHours(24),
        ]);

        $this->fakeCartumFailing();

        // Supply alias wrapped in slashes — controller must strip them.
        $response = $this->getJson(
            self::ENDPOINT . '?alias=' . urlencode('/foo/'),
            $this->originHeader($site->domain),
        );

        $response->assertOk();
        $response->assertJsonPath('meta.source_product_id', $source->id);
        $this->assertCount(1, $response->json('data'));
    }
}
