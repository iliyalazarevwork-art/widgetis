<?php

declare(strict_types=1);

namespace Tests\PostgreSQL;

use App\SmartSearch\DataTransferObjects\SearchQueryDto;
use App\SmartSearch\Enums\SearchLanguage;
use App\SmartSearch\Exceptions\InvalidSearchQueryException;
use App\SmartSearch\Services\Cache\SearchCache;
use App\SmartSearch\Services\Search\PgProductSearchEngine;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Integration tests for PgProductSearchEngine against a real PostgreSQL instance.
 *
 * Run with:
 *   docker compose -f docker-compose.dev.yml exec backend \
 *     php artisan test --configuration phpunit.pgsql.xml
 *
 * All writes are rolled back (DatabaseTransactions), so the dev DB is untouched.
 * Tests are automatically skipped when running under the default SQLite config.
 */
class PgSearchEngineTest extends TestCase
{
    use DatabaseTransactions;

    /** @var list<string> */
    protected $connectionsToTransact = ['pgsql', 'pgsql_runtime'];

    private PgProductSearchEngine $engine;

    private string $siteId;

    private const LANG = 'uk';

    private const DOMAIN = 'pg-test.internal';

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::connection('pgsql_runtime')->getDriverName() !== 'pgsql') {
            $this->markTestSkipped(
                'PgSearchEngineTest requires a real PostgreSQL connection. ' .
                'Run with: php artisan test --configuration phpunit.pgsql.xml',
            );
        }

        $this->engine = $this->app->make(PgProductSearchEngine::class);

        // Create a test user + site scoped to this test run
        $userId = Str::uuid7()->toString();
        DB::table('users')->insert([
            'id'         => $userId,
            'name'       => 'PG Test User',
            'email'      => 'pg-test-' . Str::random(6) . '@test.invalid',
            'password'   => bcrypt('secret'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->siteId = Str::uuid7()->toString();
        DB::connection('pgsql_runtime')->table('wgt_sites')->insert([
            'id'               => $this->siteId,
            'user_id'          => $userId,
            'site_key'         => Str::uuid7()->toString(),
            'name'             => 'PG Test Site',
            'domain'           => self::DOMAIN,
            'url'              => 'https://' . self::DOMAIN,
            'allowed_origins'  => json_encode(['https://' . self::DOMAIN]),
            'platform'         => 'horoshop',
            'status'           => 'active',
            'script_installed' => false,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        // Flush search cache so test results are not stale
        $this->app->make(SearchCache::class)->flushSite($this->siteId);
    }

    protected function tearDown(): void
    {
        $this->app->make(SearchCache::class)->flushSite($this->siteId);
        $this->clearFeedCache();

        parent::tearDown();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Delete all srch:feed:* Redis keys using the raw client.
     *
     * Redis::keys() returns keys WITH the configured prefix already baked in.
     * Passing those keys back to Redis::del() would add the prefix a second time
     * (double-prefix bug). The raw Predis/PhpRedis client never applies the prefix,
     * so keys() and del() work on the exact strings stored in Redis.
     */
    private function clearFeedCache(): void
    {
        $redis  = Redis::connection()->client();
        $prefix = (string) config('database.redis.options.prefix', '');
        /** @var list<string> $keys */
        $keys = $redis->keys($prefix . 'srch:feed:*');
        if ($keys !== []) {
            $redis->del($keys);
        }
    }

    private function seedTestProduct(array $overrides = []): void
    {
        DB::connection('pgsql_runtime')->table('wgt_smart_search_products')->insert(array_merge([
            'id'            => Str::uuid7()->toString(),
            'site_id'       => $this->siteId,
            'lang'          => self::LANG,
            'external_id'   => (string) random_int(1_000_000, 9_999_999),
            'name'          => 'Тестовий товар',
            'vendor'        => 'TestBrand',
            'category_id'   => 'test',
            'category_path' => 'Тести',
            'category_name' => 'Тести',
            'picture'       => '',
            'url'           => 'https://shop.test/p/1',
            'price'         => 500,
            'oldprice'      => 0,
            'currency'      => 'UAH',
            'available'     => true,
            'search_text'   => 'тестовий товар testbrand тести',
            'popularity'    => 0,
            'created_at'    => now(),
            'updated_at'    => now(),
        ], $overrides));
    }

    private function query(
        string $q,
        int $limit = 10,
        ?string $category = null,
    ): \App\SmartSearch\DataTransferObjects\SearchResponseDto {
        $dto = new \ReflectionClass(SearchQueryDto::class);
        $constructor = $dto->getConstructor();
        $constructor->setAccessible(true);
        $instance = $dto->newInstanceWithoutConstructor();
        $constructor->invoke($instance, $q, SearchLanguage::Uk, $limit, $category, $this->siteId);

        return $this->engine->search($instance);
    }

    // ── Query validation ──────────────────────────────────────────────────────

    public function test_throws_for_query_shorter_than_2_chars(): void
    {
        $this->expectException(InvalidSearchQueryException::class);
        $this->query('а');
    }

    public function test_throws_for_query_longer_than_90_chars(): void
    {
        $this->expectException(InvalidSearchQueryException::class);
        $this->query(str_repeat('а', 91));
    }

    // ── FTS (tsvector) ────────────────────────────────────────────────────────

    public function test_finds_product_via_tsvector_match(): void
    {
        $this->seedTestProduct([
            'name'        => 'Анальна пробка силіконова',
            'search_text' => 'анальна пробка силіконова',
            'external_id' => 'fts-1',
        ]);

        $result = $this->query('пробка');
        $this->assertGreaterThan(0, $result->total);
    }

    public function test_tsvector_column_is_auto_generated(): void
    {
        // The tsv column is GENERATED ALWAYS AS — we never write it manually.
        // Verify the engine can search immediately after INSERT.
        $this->seedTestProduct([
            'name'        => 'Вібратор кролик синій',
            'search_text' => 'вібратор кролик синій',
            'external_id' => 'tsv-auto',
        ]);

        $result = $this->query('вібратор кролик');
        $found = false;
        foreach ($result->groups as $group) {
            foreach ($group->items as $item) {
                if ($item->name === 'Вібратор кролик синій') {
                    $found = true;
                }
            }
        }
        $this->assertTrue($found, 'Product not found via FTS after immediate INSERT');
    }

    // ── Trigram (% operator) ──────────────────────────────────────────────────

    public function test_finds_product_via_trigram_similarity(): void
    {
        // Trigram similarity works on search_text with GIN trgm index
        $this->seedTestProduct([
            'name'        => 'Мастурбатор реалістичний',
            'search_text' => 'мастурбатор реалістичний',
            'external_id' => 'trgm-1',
        ]);

        $result = $this->query('мастурбатор');
        $this->assertGreaterThan(0, $result->total);
    }

    // ── Prefix ILIKE ──────────────────────────────────────────────────────────

    public function test_finds_product_via_prefix_ilike(): void
    {
        $this->seedTestProduct([
            'name'        => 'Лубрикант на водній основі',
            'search_text' => 'лубрикант водна основа',
            'external_id' => 'ilike-1',
        ]);

        // Prefix "луб" should match via ILIKE 'луб%'
        $result = $this->query('луб');
        $this->assertGreaterThan(0, $result->total);
    }

    // ── Grouping ──────────────────────────────────────────────────────────────

    public function test_groups_results_by_category_name(): void
    {
        $this->seedTestProduct(['name' => 'Вібратор А', 'search_text' => 'вібратор а', 'category_name' => 'Вібратори', 'external_id' => 'g1']);
        $this->seedTestProduct(['name' => 'Вібратор Б', 'search_text' => 'вібратор б', 'category_name' => 'Вібратори', 'external_id' => 'g2']);
        $this->seedTestProduct(['name' => 'Анальний вібратор', 'search_text' => 'анальний вібратор', 'category_name' => 'Анальні іграшки', 'external_id' => 'g3']);

        $result = $this->query('вібратор', 50);
        $this->assertArrayHasKey('Вібратори', $result->groups);
        $this->assertArrayHasKey('Анальні іграшки', $result->groups);
    }

    public function test_group_total_reflects_all_matches_via_window_function(): void
    {
        // Seed more products than the default per-group limit (4)
        for ($i = 0; $i < 7; $i++) {
            $this->seedTestProduct([
                'name'          => "Вібратор #{$i}",
                'search_text'   => "вібратор товар {$i}",
                'category_name' => 'Вібратори',
                'external_id'   => "wf-{$i}",
            ]);
        }

        $result = $this->query('вібратор', 4);
        $vibrGroup = $result->groups['Вібратори'] ?? null;
        $this->assertNotNull($vibrGroup);

        // cat_total (from window COUNT) must be 7, not just 4
        $this->assertSame(7, $vibrGroup->total);
        // But only 4 items are returned (default per-group)
        $this->assertCount(4, $vibrGroup->items);
    }

    // ── Category filter ───────────────────────────────────────────────────────

    public function test_category_filter_returns_only_matching_category(): void
    {
        $this->seedTestProduct(['name' => 'Вібратор А', 'search_text' => 'вібратор', 'category_name' => 'Вібратори', 'external_id' => 'cf-1']);
        $this->seedTestProduct(['name' => 'Анальний вібратор', 'search_text' => 'анальний вібратор', 'category_name' => 'Анальні', 'external_id' => 'cf-2']);

        $result = $this->query('вібратор', 50, 'Вібратори');
        $this->assertArrayHasKey('Вібратори', $result->groups);
        $this->assertArrayNotHasKey('Анальні', $result->groups);
    }

    public function test_category_filter_returns_all_items_without_per_group_cap(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $this->seedTestProduct([
                'name'          => "Вібратор #{$i}",
                'search_text'   => "вібратор {$i}",
                'category_name' => 'Вібратори',
                'external_id'   => "cap-{$i}",
            ]);
        }

        // Without category filter: capped at 4 per group
        $preview = $this->query('вібратор', 4);
        $this->assertLessThanOrEqual(4, count($preview->groups['Вібратори']->items));

        // With category filter: all 10 items returned
        $expanded = $this->query('вібратор', 50, 'Вібратори');
        $this->assertSame(10, $expanded->groups['Вібратори']->total);
        $this->assertGreaterThan(4, count($expanded->groups['Вібратори']->items));
    }

    // ── Scoring & ranking ─────────────────────────────────────────────────────

    public function test_higher_score_product_ranks_first(): void
    {
        // "вібратор" in name → higher ts_rank than just in search_text
        $this->seedTestProduct([
            'name'          => 'Вібратор класичний',
            'search_text'   => 'вібратор класичний',
            'category_name' => 'V',
            'external_id'   => 'score-hi',
            'popularity'    => 0,
        ]);
        $this->seedTestProduct([
            'name'          => 'Товар з додатком',
            'search_text'   => 'товар вібратор тип',
            'category_name' => 'V',
            'external_id'   => 'score-lo',
            'popularity'    => 0,
        ]);

        $result = $this->query('вібратор', 10);
        $items = $result->groups['V']->items ?? [];
        // First result must have "вібратор" in its name (higher ts_rank)
        $this->assertStringContainsStringIgnoringCase('вібратор', $items[0]->name);
    }

    public function test_available_products_rank_before_unavailable(): void
    {
        $this->seedTestProduct([
            'name'          => 'Вібратор доступний',
            'search_text'   => 'вібратор',
            'category_name' => 'V',
            'available'     => true,
            'external_id'   => 'avail-yes',
            'price'         => 500,
        ]);
        $this->seedTestProduct([
            'name'          => 'Вібратор недоступний',
            'search_text'   => 'вібратор',
            'category_name' => 'V',
            'available'     => false,
            'external_id'   => 'avail-no',
            'price'         => 100, // cheaper but unavailable
        ]);

        $result = $this->query('вібратор', 10);
        $items = $result->groups['V']->items ?? [];
        $this->assertCount(2, $items);
        $this->assertTrue($items[0]->available, 'Available product must rank first');
        $this->assertFalse($items[1]->available);
    }

    // ── Typo correction ───────────────────────────────────────────────────────

    public function test_returns_correction_for_zero_results_with_close_match(): void
    {
        $this->seedTestProduct([
            'name'        => 'Вібратор силіконовий',
            'search_text' => 'вібратор силіконовий',
            'external_id' => 'corr-1',
        ]);

        // "вібратор" is correct → zero results for a completely unrelated query
        // We need a query that:
        //  (a) returns zero results
        //  (b) has a trigram similarity > 0.4 with some product name in the DB
        // "вібраторр" (double-r) should match "вібратор" via trigram
        $result = $this->query('вібраторр');
        if ($result->total === 0) {
            $this->assertNotNull($result->correction, 'Expected a spelling suggestion for "вібраторр"');
            $this->assertStringContainsString('вібратор', (string) $result->correction);
        } else {
            // FTS/trigram found it anyway — correction is null, which is also correct
            $this->assertNull($result->correction);
        }
    }

    public function test_returns_null_correction_when_results_found(): void
    {
        $this->seedTestProduct([
            'name'        => 'Вібратор класичний',
            'search_text' => 'вібратор класичний',
            'external_id' => 'nocorr-1',
        ]);

        $result = $this->query('вібратор');
        $this->assertGreaterThan(0, $result->total);
        $this->assertNull($result->correction);
    }

    // ── Isolation ─────────────────────────────────────────────────────────────

    public function test_does_not_return_products_from_other_sites(): void
    {
        // Create another site + product
        $otherSiteId = Str::uuid7()->toString();
        DB::connection('pgsql_runtime')->table('wgt_sites')->insert([
            'id'               => $otherSiteId,
            'user_id'          => DB::table('users')->value('id'),
            'site_key'         => Str::uuid7()->toString(),
            'name'             => 'Other Site',
            'domain'           => 'other.internal',
            'url'              => 'https://other.internal',
            'allowed_origins'  => json_encode(['https://other.internal']),
            'platform'         => 'horoshop',
            'status'           => 'active',
            'script_installed' => false,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        DB::connection('pgsql_runtime')->table('wgt_smart_search_products')->insert([
            'id'            => Str::uuid7()->toString(),
            'site_id'       => $otherSiteId,
            'lang'          => self::LANG,
            'external_id'   => 'other-1',
            'name'          => 'Вібратор чужого сайту',
            'vendor'        => null,
            'category_id'   => 'other',
            'category_path' => 'Other',
            'category_name' => 'Other',
            'picture'       => '',
            'url'           => 'https://other.internal/p/1',
            'price'         => 100,
            'oldprice'      => 0,
            'currency'      => 'UAH',
            'available'     => true,
            'search_text'   => 'вібратор чужого сайту',
            'popularity'    => 0,
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        // Our site has no products matching "вібратор"
        $result = $this->query('вібратор');
        $this->assertSame(0, $result->total);
    }

    // ── HTTP endpoint (full stack) ────────────────────────────────────────────

    public function test_http_endpoint_returns_200_with_products(): void
    {
        $this->seedTestProduct([
            'name'        => 'Вібратор тестовий',
            'search_text' => 'вібратор тестовий',
            'external_id' => 'http-1',
        ]);

        $response = $this->getJson(
            '/api/v1/widgets/smart-search?q=вібратор',
            ['Origin' => 'https://' . self::DOMAIN, 'Accept-Language' => 'uk'],
        );

        $response->assertStatus(200)
            ->assertJsonStructure(['query', 'total', 'groups', 'features', 'currency'])
            ->assertJsonPath('query', 'вібратор');

        $this->assertGreaterThan(0, $response->json('total'));
    }

    public function test_http_endpoint_returns_groups_with_items(): void
    {
        $this->seedTestProduct([
            'name'          => 'Вібратор груп А',
            'search_text'   => 'вібратор груп а',
            'category_name' => 'Груп А',
            'external_id'   => 'grp-1',
        ]);

        $response = $this->getJson(
            '/api/v1/widgets/smart-search?q=вібратор',
            ['Origin' => 'https://' . self::DOMAIN, 'Accept-Language' => 'uk'],
        )->assertStatus(200);

        $groups = $response->json('groups');
        $this->assertNotEmpty($groups);

        $firstGroup = array_values($groups)[0];
        $this->assertArrayHasKey('total', $firstGroup);
        $this->assertArrayHasKey('items', $firstGroup);
        $this->assertNotEmpty($firstGroup['items']);

        $item = $firstGroup['items'][0];
        $this->assertArrayHasKey('id', $item);
        $this->assertArrayHasKey('url', $item);
        $this->assertArrayHasKey('name', $item);
        $this->assertArrayHasKey('price', $item);
        $this->assertArrayHasKey('available', $item);
    }

    public function test_http_endpoint_is_cached_in_redis(): void
    {
        $this->seedTestProduct(['search_text' => 'вібратор кеш', 'external_id' => 'cache-http-1']);

        // First request — populates cache
        $first = $this->getJson(
            '/api/v1/widgets/smart-search?q=вібратор',
            ['Origin' => 'https://' . self::DOMAIN, 'Accept-Language' => 'uk'],
        )->assertStatus(200);

        // Second request — must return 304 via ETag
        $etag = $first->headers->get('ETag');
        $this->assertNotEmpty($etag);

        $this->getJson('/api/v1/widgets/smart-search?q=вібратор', [
            'Origin'        => 'https://' . self::DOMAIN,
            'If-None-Match' => $etag,
        ])->assertStatus(304);
    }

    // ── Feed endpoint on real PG ──────────────────────────────────────────────

    public function test_feed_endpoint_returns_200_with_products(): void
    {
        $this->seedTestProduct(['name' => 'Фід товар', 'external_id' => 'feed-1']);

        $response = $this->getJson(
            '/api/v1/widgets/smart-search/feed',
            ['Origin' => 'https://' . self::DOMAIN, 'Accept-Language' => 'uk'],
        )->assertStatus(200);

        $response->assertJsonStructure(['version', 'currency', 'accentColor', 'categoryUrls', 'products']);
        $this->assertNotEmpty($response->json('products'));
    }

    public function test_feed_excludes_products_with_empty_name(): void
    {
        $this->seedTestProduct(['name' => 'Нормальний', 'external_id' => 'feed-norm']);
        $this->seedTestProduct(['name' => '', 'external_id' => 'feed-empty-name']);

        $response = $this->getJson(
            '/api/v1/widgets/smart-search/feed',
            ['Origin' => 'https://' . self::DOMAIN, 'Accept-Language' => 'uk'],
        )->assertStatus(200);

        $names = array_column($response->json('products'), 'name');
        $this->assertContains('Нормальний', $names);
        $this->assertNotContains('', $names);
    }

    public function test_feed_version_changes_when_products_change(): void
    {
        $this->seedTestProduct(['name' => 'Товар 1', 'external_id' => 'ver-1']);

        $v1 = $this->getJson(
            '/api/v1/widgets/smart-search/feed',
            ['Origin' => 'https://' . self::DOMAIN, 'Accept-Language' => 'uk'],
        )->json('version');

        // Add another product after the feed was built; bust Redis so the controller re-queries DB
        $this->clearFeedCache();

        $this->seedTestProduct(['name' => 'Товар 2', 'external_id' => 'ver-2']);

        $v2 = $this->getJson(
            '/api/v1/widgets/smart-search/feed',
            ['Origin' => 'https://' . self::DOMAIN, 'Accept-Language' => 'uk'],
        )->json('version');

        $this->assertNotSame($v1, $v2, 'Feed version must change when products are added');
    }

    public function test_feed_returns_gzip_when_client_accepts_it(): void
    {
        $this->seedTestProduct(['name' => 'Gzip товар', 'external_id' => 'gzip-1']);

        // Warm the feed cache
        $this->getJson('/api/v1/widgets/smart-search/feed', ['Origin' => 'https://' . self::DOMAIN, 'Accept-Language' => 'uk']);

        $response = $this->call('GET', '/api/v1/widgets/smart-search/feed', [], [], [], [
            'HTTP_ORIGIN'           => 'https://' . self::DOMAIN,
            'HTTP_ACCEPT_LANGUAGE'  => 'uk',
            'HTTP_ACCEPT_ENCODING'  => 'gzip',
        ]);

        $response->assertStatus(200);
        $this->assertSame('gzip', $response->headers->get('Content-Encoding'));
        $decoded = gzdecode($response->getContent());
        $this->assertJson((string) $decoded);
    }
}
