<?php

declare(strict_types=1);

namespace Tests\Feature\SmartSearch;

use App\WidgetRuntime\Models\Site;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

class PublicFeedTest extends TestCase
{
    use RefreshDatabase;

    private const FEED_URL = '/api/v1/widgets/smart-search/feed';

    protected function setUp(): void
    {
        parent::setUp();
        // Clear all feed cache keys between tests
        $keys = Redis::keys('*srch:feed:*');
        foreach ($keys as $key) {
            Redis::del($key);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function makeSite(string $domain = 'shop.test'): Site
    {
        return Site::factory()->create(['domain' => $domain]);
    }

    /** @param array<string, mixed> $overrides */
    private function seedProduct(Site $site, array $overrides = []): void
    {
        DB::connection('pgsql_runtime')->table('wgt_smart_search_products')->insert(array_merge([
            'id'            => Str::uuid7()->toString(),
            'site_id'       => $site->id,
            'lang'          => 'uk',
            'external_id'   => (string) random_int(1_000_000, 9_999_999),
            'name'          => 'Тестовий товар',
            'vendor'        => 'TestBrand',
            'category_id'   => 'toys',
            'category_path' => 'Іграшки > Тести',
            'category_name' => 'Іграшки',
            'picture'       => 'https://cdn.test/img.jpg',
            'url'           => 'https://shop.test/p/1',
            'price'         => 500,
            'oldprice'      => 700,
            'currency'      => 'UAH',
            'available'     => true,
            'search_text'   => 'тестовий товар testbrand іграшки',
            'popularity'    => 0,
            'created_at'    => now(),
            'updated_at'    => now(),
        ], $overrides));
    }

    private function seedCategory(Site $site, string $name, string $url, string $lang = 'uk'): void
    {
        DB::connection('pgsql_runtime')->table('wgt_smart_search_categories')->insert([
            'id'          => Str::uuid7()->toString(),
            'site_id'     => $site->id,
            'lang'        => $lang,
            'external_id' => Str::slug($name),
            'name'        => $name,
            'url'         => $url,
            'parent_id'   => null,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);
    }

    /** @return array<string, string> */
    private function h(string $domain = 'shop.test', string $lang = 'uk'): array
    {
        return ['Origin' => "https://{$domain}", 'Accept-Language' => $lang];
    }

    // ── Auth & Origin ─────────────────────────────────────────────────────────

    public function test_returns_403_when_origin_missing(): void
    {
        $this->makeSite('shop.test');

        $this->getJson(self::FEED_URL)
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'UNKNOWN_ORIGIN');
    }

    public function test_returns_403_when_origin_unknown(): void
    {
        $this->makeSite('shop.test');

        $this->getJson(self::FEED_URL, ['Origin' => 'https://notregistered.example'])
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'UNKNOWN_ORIGIN');
    }

    // ── Response shape ────────────────────────────────────────────────────────

    public function test_returns_200_with_correct_top_level_structure(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site);

        $this->getJson(self::FEED_URL, $this->h())
            ->assertStatus(200)
            ->assertJsonStructure(['version', 'currency', 'accentColor', 'categoryUrls', 'products']);
    }

    public function test_product_items_have_all_required_fields(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site, ['external_id' => 'ext-42']);

        $response = $this->getJson(self::FEED_URL, $this->h())
            ->assertStatus(200);

        $products = $response->json('products');
        $this->assertNotEmpty($products);
        $p = $products[0];

        $this->assertArrayHasKey('id', $p);
        $this->assertArrayHasKey('url', $p);
        $this->assertArrayHasKey('name', $p);
        $this->assertArrayHasKey('price', $p);
        $this->assertArrayHasKey('oldprice', $p);
        $this->assertArrayHasKey('picture', $p);
        $this->assertArrayHasKey('vendor', $p);
        $this->assertArrayHasKey('cat', $p);
        $this->assertArrayHasKey('available', $p);
        $this->assertArrayHasKey('st', $p);
    }

    public function test_product_fields_have_correct_types(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site, [
            'price'     => 999,
            'oldprice'  => 1200,
            'available' => true,
        ]);

        $response = $this->getJson(self::FEED_URL, $this->h())
            ->assertStatus(200);

        $p = $response->json('products.0');
        $this->assertIsString($p['id']);
        $this->assertIsString($p['url']);
        $this->assertIsString($p['name']);
        $this->assertIsInt($p['price']);
        $this->assertIsInt($p['oldprice']);
        $this->assertIsBool($p['available']);
        $this->assertSame(999, $p['price']);
        $this->assertSame(1200, $p['oldprice']);
        $this->assertTrue($p['available']);
    }

    public function test_category_urls_is_json_object_not_array_when_empty(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site);

        $response = $this->getJson(self::FEED_URL, $this->h())
            ->assertStatus(200);

        // JSON object decodes to array in PHP/Laravel — but an empty object must not be []
        $raw = $response->getContent();
        $this->assertStringContainsString('"categoryUrls":{}', $raw);
    }

    public function test_category_urls_included_when_categories_have_urls(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site);
        $this->seedCategory($site, 'Іграшки', 'https://shop.test/toys');
        $this->seedCategory($site, 'Аксесуари', 'https://shop.test/accessories');

        $response = $this->getJson(self::FEED_URL, $this->h())
            ->assertStatus(200);

        $urls = $response->json('categoryUrls');
        $this->assertArrayHasKey('Іграшки', $urls);
        $this->assertSame('https://shop.test/toys', $urls['Іграшки']);
        $this->assertArrayHasKey('Аксесуари', $urls);
    }

    public function test_categories_with_empty_url_are_excluded_from_category_urls(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site);
        $this->seedCategory($site, 'З URL', 'https://shop.test/good');
        // Category with empty URL should not appear
        DB::connection('pgsql_runtime')->table('wgt_smart_search_categories')->insert([
            'id'          => Str::uuid7()->toString(),
            'site_id'     => $site->id,
            'lang'        => 'uk',
            'external_id' => 'no-url',
            'name'        => 'Без URL',
            'url'         => '',
            'parent_id'   => null,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        $urls = $this->getJson(self::FEED_URL, $this->h())
            ->assertStatus(200)
            ->json('categoryUrls');

        $this->assertArrayHasKey('З URL', $urls);
        $this->assertArrayNotHasKey('Без URL', $urls);
    }

    // ── Filtering ─────────────────────────────────────────────────────────────

    public function test_excludes_products_with_empty_name(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site, ['name' => 'Нормальний товар', 'external_id' => 'good-1']);
        $this->seedProduct($site, ['name' => '', 'external_id' => 'empty-name']);

        $response = $this->getJson(self::FEED_URL, $this->h())
            ->assertStatus(200);

        $names = array_column($response->json('products'), 'name');
        $this->assertContains('Нормальний товар', $names);
        $this->assertNotContains('', $names);
    }

    public function test_excludes_products_from_other_sites(): void
    {
        $site1 = $this->makeSite('shop1.test');
        $site2 = $this->makeSite('shop2.test');

        $this->seedProduct($site1, ['name' => 'Товар сайту 1', 'external_id' => 'site1-p1']);
        $this->seedProduct($site2, ['name' => 'Товар сайту 2', 'external_id' => 'site2-p1']);

        $response = $this->getJson(self::FEED_URL, $this->h('shop1.test'))
            ->assertStatus(200);

        $names = array_column($response->json('products'), 'name');
        $this->assertContains('Товар сайту 1', $names);
        $this->assertNotContains('Товар сайту 2', $names);
    }

    public function test_excludes_products_of_other_langs(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site, ['lang' => 'uk', 'name' => 'Товар UK', 'external_id' => 'uk-1']);
        $this->seedProduct($site, ['lang' => 'ru', 'name' => 'Товар RU', 'external_id' => 'ru-1']);

        $names = array_column(
            $this->getJson(self::FEED_URL, $this->h(lang: 'uk'))->assertStatus(200)->json('products'),
            'name',
        );

        $this->assertContains('Товар UK', $names);
        $this->assertNotContains('Товар RU', $names);
    }

    // ── Accept-Language header ────────────────────────────────────────────────

    public function test_unrecognised_lang_falls_back_to_uk(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site, ['lang' => 'uk', 'name' => 'Товар UK', 'external_id' => 'uk-1']);

        $products = $this->getJson(self::FEED_URL, $this->h(lang: 'zz'))
            ->assertStatus(200)
            ->json('products');

        $this->assertNotEmpty($products);
        $this->assertSame('Товар UK', $products[0]['name']);
    }

    public function test_region_subtag_stripped_correctly(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site, ['lang' => 'uk', 'name' => 'Товар UK', 'external_id' => 'uk-1']);
        $this->seedProduct($site, ['lang' => 'ru', 'name' => 'Товар RU', 'external_id' => 'ru-1']);

        $names = array_column(
            $this->getJson(self::FEED_URL, $this->h(lang: 'ru-RU'))->assertStatus(200)->json('products'),
            'name',
        );

        $this->assertContains('Товар RU', $names);
        $this->assertNotContains('Товар UK', $names);
    }

    public function test_quality_value_parsed_correctly(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site, ['lang' => 'ru', 'name' => 'Товар RU', 'external_id' => 'ru-1']);

        $names = array_column(
            $this->getJson(self::FEED_URL, ['Origin' => 'https://shop.test', 'Accept-Language' => 'ru-RU,ru;q=0.9,uk;q=0.8'])
                ->assertStatus(200)->json('products'),
            'name',
        );

        $this->assertContains('Товар RU', $names);
    }

    // ── Ordering ──────────────────────────────────────────────────────────────

    public function test_products_ordered_by_name_when_popularity_equal(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site, ['name' => 'Цукерки', 'popularity' => 0, 'external_id' => 'p1']);
        $this->seedProduct($site, ['name' => 'Апельсин', 'popularity' => 0, 'external_id' => 'p2']);
        $this->seedProduct($site, ['name' => 'Банан', 'popularity' => 0, 'external_id' => 'p3']);

        $names = array_column(
            $this->getJson(self::FEED_URL, $this->h())->assertStatus(200)->json('products'),
            'name',
        );

        // Alphabetical order: А < Б < Ц
        $this->assertSame(['Апельсин', 'Банан', 'Цукерки'], $names);
    }

    public function test_products_ordered_by_popularity_desc(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site, ['name' => 'Новий товар', 'popularity' => 5, 'external_id' => 'pop5']);
        $this->seedProduct($site, ['name' => 'Аааа товар', 'popularity' => 0, 'external_id' => 'pop0']);
        $this->seedProduct($site, ['name' => 'Б товар', 'popularity' => 10, 'external_id' => 'pop10']);

        $names = array_column(
            $this->getJson(self::FEED_URL, $this->h())->assertStatus(200)->json('products'),
            'name',
        );

        // popularity DESC: 10, 5, 0
        $this->assertSame(['Б товар', 'Новий товар', 'Аааа товар'], $names);
    }

    // ── HTTP caching ──────────────────────────────────────────────────────────

    public function test_response_contains_etag_header(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site);

        $response = $this->getJson(self::FEED_URL, $this->h())
            ->assertStatus(200);

        $etag = $response->headers->get('ETag');
        $this->assertNotEmpty($etag);
        $this->assertStringStartsWith('W/"', $etag);
        $this->assertStringEndsWith('"', $etag);
    }

    public function test_etag_is_stable_across_identical_requests(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site);

        $etag1 = $this->getJson(self::FEED_URL, $this->h())->headers->get('ETag');
        $etag2 = $this->getJson(self::FEED_URL, $this->h())->headers->get('ETag');

        $this->assertSame($etag1, $etag2);
    }

    public function test_returns_304_when_etag_matches(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site);

        $etag = $this->getJson(self::FEED_URL, $this->h())
            ->assertStatus(200)
            ->headers->get('ETag');

        $this->assertNotEmpty($etag);

        $this->getJson(self::FEED_URL, array_merge($this->h(), ['If-None-Match' => $etag]))
            ->assertStatus(304);
    }

    public function test_returns_200_when_etag_does_not_match(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site);

        $this->getJson(self::FEED_URL, array_merge($this->h(), ['If-None-Match' => 'W/"stale-etag-value"']))
            ->assertStatus(200);
    }

    public function test_response_has_cache_control_headers(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site);

        $response = $this->getJson(self::FEED_URL, $this->h())
            ->assertStatus(200);

        $cc = (string) $response->headers->get('Cache-Control');
        $this->assertStringContainsString('public', $cc);
        $this->assertStringContainsString('max-age=', $cc);
        $this->assertStringContainsString('stale-while-revalidate=', $cc);
    }

    public function test_response_has_vary_header(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site);

        $vary = (string) $this->getJson(self::FEED_URL, $this->h())
            ->assertStatus(200)
            ->headers->get('Vary');

        $this->assertStringContainsString('Origin', $vary);
    }

    // ── gzip pass-through ─────────────────────────────────────────────────────

    public function test_returns_gzip_content_when_client_accepts_it(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site);

        // First request to warm Redis cache
        $this->getJson(self::FEED_URL, $this->h())->assertStatus(200);

        // Second request with Accept-Encoding: gzip — served from Redis without gzdecode
        $response = $this->call('GET', self::FEED_URL, [], [], [], [
            'HTTP_ORIGIN'           => 'https://shop.test',
            'HTTP_ACCEPT_LANGUAGE'  => 'uk',
            'HTTP_ACCEPT_ENCODING'  => 'gzip',
        ]);

        $response->assertStatus(200);
        $this->assertSame('gzip', $response->headers->get('Content-Encoding'));
        // Verify the body is valid gzip-encoded JSON
        $decoded = gzdecode($response->getContent());
        $this->assertIsString($decoded);
        $this->assertJson($decoded);
    }

    public function test_returns_plain_json_without_gzip_header(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site);

        $response = $this->getJson(self::FEED_URL, $this->h())
            ->assertStatus(200);

        $this->assertNull($response->headers->get('Content-Encoding'));
        $this->assertJson($response->getContent());
    }

    // ── Redis caching ─────────────────────────────────────────────────────────

    public function test_second_request_is_served_from_redis_cache(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site);

        // Warm the cache
        $first = $this->getJson(self::FEED_URL, $this->h())->assertStatus(200);

        // After first request, feed key must exist in Redis
        $keys = Redis::keys('*srch:feed:*');
        $feedKeys = array_filter($keys, fn (string $k) => ! str_ends_with($k, ':etag'));
        $this->assertNotEmpty($feedKeys, 'Redis feed key was not written after first request');

        // Second request should return same ETag (same data, from Redis)
        $second = $this->getJson(self::FEED_URL, $this->h())->assertStatus(200);

        $this->assertSame($first->headers->get('ETag'), $second->headers->get('ETag'));
    }

    public function test_etag_is_cached_in_redis_separately(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site);

        $etag = $this->getJson(self::FEED_URL, $this->h())
            ->assertStatus(200)
            ->headers->get('ETag');

        $etagKeys = array_filter(
            Redis::keys('*srch:feed:*'),
            fn (string $k) => str_ends_with($k, ':etag'),
        );
        $this->assertNotEmpty($etagKeys, 'ETag Redis key was not written after first request');

        // Confirm cached ETag matches by verifying 304
        $this->getJson(self::FEED_URL, array_merge($this->h(), ['If-None-Match' => $etag]))
            ->assertStatus(304);
    }

    public function test_304_served_from_redis_etag_without_gzdecode(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site);

        $etag = $this->getJson(self::FEED_URL, $this->h())
            ->assertStatus(200)
            ->headers->get('ETag');

        $this->getJson(self::FEED_URL, array_merge($this->h(), ['If-None-Match' => $etag]))
            ->assertStatus(304);
    }

    // ── Version ───────────────────────────────────────────────────────────────

    public function test_version_field_is_a_non_empty_string(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site);

        $version = $this->getJson(self::FEED_URL, $this->h())
            ->assertStatus(200)
            ->json('version');

        $this->assertNotEmpty($version);
    }

    public function test_version_includes_product_count(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site, ['external_id' => 'p1']);
        $this->seedProduct($site, ['external_id' => 'p2']);
        $this->seedProduct($site, ['external_id' => 'p3']);

        $version = $this->getJson(self::FEED_URL, $this->h())
            ->assertStatus(200)
            ->json('version');

        $this->assertStringStartsWith('3:', (string) $version);
    }

    // ── Empty site ────────────────────────────────────────────────────────────

    public function test_returns_empty_products_array_when_site_has_no_products(): void
    {
        $this->makeSite('shop.test');

        $response = $this->getJson(self::FEED_URL, $this->h())
            ->assertStatus(200);

        $this->assertSame([], $response->json('products'));
        $this->assertSame('0:0', $response->json('version'));
    }

    public function test_currency_is_present_in_response(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site);

        $this->getJson(self::FEED_URL, $this->h())
            ->assertStatus(200)
            ->assertJsonPath('currency', 'грн');
    }

    public function test_accent_color_is_null_by_default(): void
    {
        $site = $this->makeSite('shop.test');
        $this->seedProduct($site);

        $this->getJson(self::FEED_URL, $this->h())
            ->assertStatus(200)
            ->assertJsonPath('accentColor', null);
    }
}
