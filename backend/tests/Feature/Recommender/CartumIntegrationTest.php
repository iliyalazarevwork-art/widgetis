<?php

declare(strict_types=1);

namespace Tests\Feature\Recommender;

use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Services\Catalog\Cartum\CartumClient;
use App\WidgetRuntime\Services\Catalog\Cartum\DTO\LiveProductView;
use App\WidgetRuntime\Services\Catalog\Cartum\Exceptions\CartumAuthException;
use App\WidgetRuntime\Services\Catalog\Cartum\LiveProductEnricher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

final class CartumIntegrationTest extends TestCase
{
    use RefreshDatabase;

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private function makeSite(): Site
    {
        return Site::factory()->create([
            'domain'                    => 'shop.example.com',
            'cartum_login'              => 'testuser',
            'cartum_password_encrypted' => Crypt::encryptString('test_password'),
        ]);
    }

    // ------------------------------------------------------------------
    // CartumClient — token caching
    // ------------------------------------------------------------------

    #[Test]
    public function it_caches_token_and_calls_auth_endpoint_only_once(): void
    {
        $site = $this->makeSite();

        Http::fake([
            'https://shop.example.com/api/auth/*' => Http::sequence()
                ->push(['status' => 'OK', 'response' => ['token' => 'tok-abc']])
                ->push(['status' => 'OK', 'response' => ['token' => 'tok-should-not-be-used']]),
        ]);

        /** @var CartumClient $client */
        $client = app(CartumClient::class);

        $first  = $client->tokenFor($site);
        $second = $client->tokenFor($site);

        $this->assertSame('tok-abc', $first);
        $this->assertSame('tok-abc', $second);

        Http::assertSentCount(1);
    }

    // ------------------------------------------------------------------
    // CartumClient — exportProducts
    // ------------------------------------------------------------------

    #[Test]
    public function it_exports_products_and_returns_map_keyed_by_article(): void
    {
        $site = $this->makeSite();

        Http::fake([
            'https://shop.example.com/api/auth/*'           => Http::response([
                'status'   => 'OK',
                'response' => ['token' => 'tok-xyz'],
            ]),
            'https://shop.example.com/api/catalog/export/*' => Http::response([
                'status'   => 'OK',
                'response' => [
                    'items' => [
                        [
                            'article'  => 'SKU-001',
                            'name'     => ['uk' => 'Продукт 1'],
                            'price'    => 299.99,
                            'oldPrice' => 349.99,
                            'presence' => 'В наявності',
                            'images'   => ['https://cdn.example.com/img1.jpg'],
                        ],
                        [
                            'article'  => 'SKU-002',
                            'name'     => ['uk' => 'Продукт 2'],
                            'price'    => 199.00,
                            'oldPrice' => null,
                            'presence' => 'Немає в наявності',
                            'images'   => [],
                        ],
                    ],
                ],
            ]),
        ]);

        /** @var CartumClient $client */
        $client = app(CartumClient::class);

        $map = $client->exportProducts($site, ['SKU-001', 'SKU-002']);

        $this->assertArrayHasKey('SKU-001', $map);
        $this->assertArrayHasKey('SKU-002', $map);
        $this->assertSame(299.99, $map['SKU-001']['price']);
        $this->assertSame('В наявності', $map['SKU-001']['presence']);
        $this->assertSame('Немає в наявності', $map['SKU-002']['presence']);
    }

    // ------------------------------------------------------------------
    // CartumClient — auth failure
    // ------------------------------------------------------------------

    #[Test]
    public function it_throws_cartum_auth_exception_when_auth_returns_non_ok(): void
    {
        $site = $this->makeSite();

        Http::fake([
            'https://shop.example.com/api/auth/*' => Http::response([
                'status'  => 'UNAUTHORIZED',
                'message' => 'Invalid credentials',
            ]),
        ]);

        /** @var CartumClient $client */
        $client = app(CartumClient::class);

        $this->expectException(CartumAuthException::class);
        $this->expectExceptionMessageMatches('/UNAUTHORIZED/');

        $client->tokenFor($site);
    }

    // ------------------------------------------------------------------
    // LiveProductEnricher — fresh data path
    // ------------------------------------------------------------------

    #[Test]
    public function live_product_enricher_uses_fresh_cartum_data_and_sets_live_true(): void
    {
        $site = $this->makeSite();

        $product = CatalogProduct::factory()->create([
            'site_id'   => $site->id,
            'sku'       => 'SKU-LIVE',
            'price'     => '100.00',
            'old_price' => '120.00',
            'in_stock'  => false,
            'image_url' => 'https://old-cdn.example.com/old.jpg',
            'currency'  => 'UAH',
        ]);

        Http::fake([
            'https://shop.example.com/api/auth/*'           => Http::response([
                'status'   => 'OK',
                'response' => ['token' => 'tok-enricher'],
            ]),
            'https://shop.example.com/api/catalog/export/*' => Http::response([
                'status'   => 'OK',
                'response' => [
                    'items' => [
                        [
                            'article'  => 'SKU-LIVE',
                            'name'     => ['uk' => 'Живий товар'],
                            'price'    => 89.99,
                            'oldPrice' => 110.00,
                            'presence' => 'В наявності',
                            'images'   => ['https://new-cdn.example.com/new.jpg'],
                        ],
                    ],
                ],
            ]),
        ]);

        /** @var LiveProductEnricher $enricher */
        $enricher = app(LiveProductEnricher::class);

        $views = $enricher->enrich($site, [$product]);

        $this->assertCount(1, $views);
        /** @var LiveProductView $view */
        $view = $views[0];

        $this->assertTrue($view->live);
        $this->assertSame('SKU-LIVE', $view->sku);
        $this->assertSame(89.99, $view->priceNew);
        $this->assertSame(110.00, $view->priceOld);
        $this->assertTrue($view->inStock);
        $this->assertSame('https://new-cdn.example.com/new.jpg', $view->imageUrl);
        $this->assertSame('UAH', $view->currency); // snapshot currency preserved
    }

    // ------------------------------------------------------------------
    // LiveProductEnricher — fallback on Cartum failure
    // ------------------------------------------------------------------

    #[Test]
    public function live_product_enricher_falls_back_to_snapshot_when_cartum_throws(): void
    {
        $site = $this->makeSite();

        $product = CatalogProduct::factory()->create([
            'site_id'   => $site->id,
            'sku'       => 'SKU-SNAP',
            'price'     => '250.00',
            'old_price' => null,
            'in_stock'  => true,
            'image_url' => 'https://snapshot-cdn.example.com/snap.jpg',
            'currency'  => 'UAH',
        ]);

        // Auth endpoint returns error → CartumAuthException → fallback
        Http::fake([
            'https://shop.example.com/api/auth/*' => Http::response([
                'status' => 'ERROR',
            ]),
        ]);

        /** @var LiveProductEnricher $enricher */
        $enricher = app(LiveProductEnricher::class);

        $views = $enricher->enrich($site, [$product]);

        $this->assertCount(1, $views);
        /** @var LiveProductView $view */
        $view = $views[0];

        $this->assertFalse($view->live);
        $this->assertSame('SKU-SNAP', $view->sku);
        $this->assertSame(250.0, $view->priceNew);
        $this->assertTrue($view->inStock);
        $this->assertSame('https://snapshot-cdn.example.com/snap.jpg', $view->imageUrl);
    }

    // ------------------------------------------------------------------
    // LiveProductEnricher — caching of live results
    // ------------------------------------------------------------------

    #[Test]
    public function live_product_enricher_caches_result_and_skips_second_http_call(): void
    {
        $site = $this->makeSite();

        $product = CatalogProduct::factory()->create([
            'site_id' => $site->id,
            'sku'     => 'SKU-CACHE',
            'price'   => '300.00',
            'in_stock' => false,
        ]);

        Http::fake([
            'https://shop.example.com/api/auth/*'           => Http::response([
                'status'   => 'OK',
                'response' => ['token' => 'tok-cache'],
            ]),
            'https://shop.example.com/api/catalog/export/*' => Http::response([
                'status'   => 'OK',
                'response' => [
                    'items' => [
                        [
                            'article'  => 'SKU-CACHE',
                            'name'     => 'Кешований товар',
                            'price'    => 275.0,
                            'presence' => 'В наявності',
                            'images'   => [],
                        ],
                    ],
                ],
            ]),
        ]);

        /** @var LiveProductEnricher $enricher */
        $enricher = app(LiveProductEnricher::class);

        // First call: hits HTTP
        $first = $enricher->enrich($site, [$product]);
        // Second call: should read from cache, no new HTTP export call
        $second = $enricher->enrich($site, [$product]);

        // Auth is called once; export is called once (second uses cache)
        Http::assertSentCount(2); // auth + export

        $this->assertTrue($first[0]->live);
        $this->assertTrue($second[0]->live);
    }
}
