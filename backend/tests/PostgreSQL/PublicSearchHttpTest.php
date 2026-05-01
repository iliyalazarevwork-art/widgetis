<?php

declare(strict_types=1);

namespace Tests\PostgreSQL;

use App\SmartSearch\Services\Cache\SearchCache;
use App\WidgetRuntime\Models\Site;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * HTTP-level integration tests for the Smart Search public endpoint.
 *
 * All tests run against a real PostgreSQL instance and a real Redis instance.
 * Every test is wrapped in a database transaction — no manual cleanup needed.
 *
 * Run with:
 *   docker compose -f docker-compose.dev.yml exec backend \
 *     php artisan test --configuration phpunit.pgsql.xml tests/PostgreSQL/PublicSearchHttpTest.php
 *
 * API contract under test:
 *   GET /api/v1/widgets/smart-search?q={query}[&limit={n}][&category={name}]
 *   Headers: Origin: https://{site-domain}   Accept-Language: {lang}
 */
class PublicSearchHttpTest extends TestCase
{
    use DatabaseTransactions;

    /** @var list<string> */
    protected $connectionsToTransact = ['pgsql', 'pgsql_runtime'];

    private const DOMAIN = 'srch-http.internal';

    private const SEARCH_URL = '/api/v1/widgets/smart-search';

    private string $siteId;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::connection('pgsql_runtime')->getDriverName() !== 'pgsql') {
            $this->markTestSkipped(
                'PublicSearchHttpTest requires a real PostgreSQL connection. ' .
                'Run with: php artisan test --configuration phpunit.pgsql.xml',
            );
        }

        $userId       = Str::uuid7()->toString();
        $this->siteId = Str::uuid7()->toString();

        DB::table('users')->insert([
            'id'         => $userId,
            'name'       => 'Search HTTP Test User',
            'email'      => 'srch-http-' . Str::random(6) . '@test.invalid',
            'password'   => bcrypt('secret'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::connection('pgsql_runtime')->table('wgt_sites')->insert([
            'id'               => $this->siteId,
            'user_id'          => $userId,
            'site_key'         => Str::uuid7()->toString(),
            'name'             => 'Search HTTP Test Site',
            'domain'           => self::DOMAIN,
            'url'              => 'https://' . self::DOMAIN,
            'allowed_origins'  => json_encode(['https://' . self::DOMAIN]),
            'platform'         => 'horoshop',
            'status'           => 'active',
            'script_installed' => false,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        $this->app->make(SearchCache::class)->flushSite($this->siteId);
    }

    protected function tearDown(): void
    {
        $this->app->make(SearchCache::class)->flushSite($this->siteId);
        parent::tearDown();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** @param array<string, mixed> $overrides */
    private function seed(array $overrides = []): void
    {
        DB::connection('pgsql_runtime')->table('wgt_smart_search_products')->insert(array_merge([
            'id'            => Str::uuid7()->toString(),
            'site_id'       => $this->siteId,
            'lang'          => 'uk',
            'external_id'   => (string) random_int(1_000_000, 9_999_999),
            'name'          => 'Тестовий товар',
            'vendor'        => 'TestBrand',
            'category_id'   => 'cat',
            'category_path' => 'Категорія',
            'category_name' => 'Категорія',
            'picture'       => 'https://cdn.test/img.jpg',
            'url'           => 'https://' . self::DOMAIN . '/p/1',
            'price'         => 500,
            'oldprice'      => 700,
            'currency'      => 'UAH',
            'available'     => true,
            'search_text'   => 'тестовий товар testbrand категорія',
            'popularity'    => 0,
            'created_at'    => now(),
            'updated_at'    => now(),
        ], $overrides));
    }

    /** @return array<string, string> */
    private function h(string $lang = 'uk'): array
    {
        return ['Origin' => 'https://' . self::DOMAIN, 'Accept-Language' => $lang];
    }

    // ── Test 1: basic match ───────────────────────────────────────────────────

    public function test_returns_products_matching_query_term(): void
    {
        $this->seed([
            'name'        => 'Силіконовий вібратор',
            'search_text' => 'силіконовий вібратор',
            'external_id' => 'basic-1',
        ]);

        $response = $this->getJson(self::SEARCH_URL . '?q=вібратор', $this->h())
            ->assertStatus(200);

        $this->assertGreaterThan(0, $response->json('total'));
        $this->assertNotEmpty($response->json('groups'));
    }

    // ── Test 2: no results ────────────────────────────────────────────────────

    public function test_returns_empty_result_for_unrecognised_query(): void
    {
        $this->seed(['name' => 'Шоколад преміум', 'search_text' => 'шоколад преміум', 'external_id' => 'nores-1']);

        $response = $this->getJson(self::SEARCH_URL . '?q=xyzzyx', $this->h())
            ->assertStatus(200);

        $this->assertSame(0, $response->json('total'));
        $this->assertSame([], $response->json('groups'));
    }

    // ── Test 3: Accept-Language uk ────────────────────────────────────────────

    public function test_returns_uk_products_for_uk_accept_language(): void
    {
        $this->seed(['lang' => 'uk', 'name' => 'Крем для рук', 'search_text' => 'крем руки', 'external_id' => 'uk-1']);
        $this->seed(['lang' => 'ru', 'name' => 'Крем для рук RU', 'search_text' => 'крем руки ru', 'external_id' => 'ru-1']);

        $response = $this->getJson(self::SEARCH_URL . '?q=крем', $this->h('uk'))
            ->assertStatus(200);

        $allNames = [];
        foreach ($response->json('groups') as $group) {
            foreach ($group['items'] as $item) {
                $allNames[] = $item['name'];
            }
        }

        $this->assertContains('Крем для рук', $allNames);
        $this->assertNotContains('Крем для рук RU', $allNames);
    }

    // ── Test 4: Accept-Language ru ────────────────────────────────────────────

    public function test_returns_ru_products_for_ru_accept_language(): void
    {
        $this->seed(['lang' => 'uk', 'name' => 'Шампунь UA', 'search_text' => 'шампунь ua', 'external_id' => 'shamp-uk']);
        $this->seed(['lang' => 'ru', 'name' => 'Шампунь RU', 'search_text' => 'шампунь ru', 'external_id' => 'shamp-ru']);

        $response = $this->getJson(self::SEARCH_URL . '?q=шампунь', $this->h('ru'))
            ->assertStatus(200);

        $allNames = [];
        foreach ($response->json('groups') as $group) {
            foreach ($group['items'] as $item) {
                $allNames[] = $item['name'];
            }
        }

        $this->assertContains('Шампунь RU', $allNames);
        $this->assertNotContains('Шампунь UA', $allNames);
    }

    // ── Test 5: region subtag stripped ────────────────────────────────────────

    public function test_region_subtag_is_stripped_to_primary_lang(): void
    {
        $this->seed(['lang' => 'uk', 'name' => 'Гель для душу', 'search_text' => 'гель душ', 'external_id' => 'subtag-1']);

        $response = $this->getJson(
            self::SEARCH_URL . '?q=гель',
            ['Origin' => 'https://' . self::DOMAIN, 'Accept-Language' => 'uk-UA,uk;q=0.9'],
        )->assertStatus(200);

        $this->assertGreaterThan(0, $response->json('total'));
    }

    // ── Test 6: grouping by category ─────────────────────────────────────────

    public function test_groups_products_by_category_name(): void
    {
        $this->seed(['name' => 'Сироватка А', 'search_text' => 'сироватка', 'category_name' => 'Сироватки', 'external_id' => 'grp-1']);
        $this->seed(['name' => 'Сироватка Б', 'search_text' => 'сироватка', 'category_name' => 'Сироватки', 'external_id' => 'grp-2']);
        $this->seed(['name' => 'Бальзам', 'search_text' => 'сироватка бальзам', 'category_name' => 'Бальзами', 'external_id' => 'grp-3']);

        $response = $this->getJson(self::SEARCH_URL . '?q=сироватка', $this->h())
            ->assertStatus(200);

        $groups = $response->json('groups');
        $this->assertArrayHasKey('Сироватки', $groups);
        $this->assertSame(2, $groups['Сироватки']['total']);
    }

    // ── Test 7: limit parameter ────────────────────────────────────────────────

    public function test_limit_parameter_restricts_preview_results(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $this->seed([
                'name'          => "Помада #{$i}",
                'search_text'   => "помада варіант {$i}",
                'category_name' => 'Помади',
                'external_id'   => "limit-{$i}",
            ]);
        }

        $response2 = $this->getJson(self::SEARCH_URL . '?q=помада&limit=2', $this->h())
            ->assertStatus(200);

        $groups  = $response2->json('groups');
        $allItems = array_merge(...array_column(array_values($groups), 'items'));
        $this->assertLessThanOrEqual(2, count($allItems));

        // total reflects actual count, not limit
        $this->assertGreaterThanOrEqual(2, $response2->json('total'));
    }

    // ── Test 8: category filter ────────────────────────────────────────────────

    public function test_category_parameter_filters_to_one_group(): void
    {
        $this->seed(['name' => 'Тонік А', 'search_text' => 'тонік', 'category_name' => 'Тоніки', 'external_id' => 'cat-1']);
        $this->seed(['name' => 'Тонік Б', 'search_text' => 'тонік', 'category_name' => 'Тоніки', 'external_id' => 'cat-2']);
        $this->seed(['name' => 'Тонік Зволожуючий', 'search_text' => 'тонік зволожуючий', 'category_name' => 'Зволоження', 'external_id' => 'cat-3']);

        $response = $this->getJson(
            self::SEARCH_URL . '?q=тонік&limit=50&category=' . urlencode('Тоніки'),
            $this->h(),
        )->assertStatus(200);

        $groups = $response->json('groups');
        $this->assertArrayHasKey('Тоніки', $groups);
        $this->assertArrayNotHasKey('Зволоження', $groups);
    }

    // ── Test 9: response shape ────────────────────────────────────────────────

    public function test_response_item_has_all_required_fields(): void
    {
        $this->seed([
            'name'        => 'Крем SPF50',
            'search_text' => 'крем сонцезахисний spf',
            'external_id' => 'shape-1',
            'price'       => 299,
            'oldprice'    => 350,
            'available'   => true,
            'picture'     => 'https://cdn.test/spf.jpg',
            'url'         => 'https://' . self::DOMAIN . '/p/spf50',
            'vendor'      => 'SunBrand',
        ]);

        $response = $this->getJson(self::SEARCH_URL . '?q=крем', $this->h())
            ->assertStatus(200)
            ->assertJsonStructure(['query', 'correction', 'total', 'loading', 'currency', 'categoryUrls', 'features', 'groups']);

        $groups = $response->json('groups');
        $this->assertNotEmpty($groups);
        $item = array_values($groups)[0]['items'][0];

        $this->assertArrayHasKey('id', $item);
        $this->assertArrayHasKey('url', $item);
        $this->assertArrayHasKey('name', $item);
        $this->assertArrayHasKey('price', $item);
        $this->assertArrayHasKey('oldprice', $item);
        $this->assertArrayHasKey('picture', $item);
        $this->assertArrayHasKey('available', $item);
        $this->assertIsInt($item['price']);
        $this->assertIsBool($item['available']);
    }

    // ── Test 10: typo correction suggestion ──────────────────────────────────

    public function test_correction_suggested_when_query_has_no_results(): void
    {
        $this->seed([
            'name'        => 'Скраб для обличчя',
            'search_text' => 'скраб обличчя',
            'external_id' => 'typo-1',
        ]);

        // Intentional double-б — close enough for trigram, but FTS may miss it
        $result = $this->getJson(self::SEARCH_URL . '?q=скрабб', $this->h())
            ->assertStatus(200)
            ->json();

        if ($result['total'] === 0) {
            // Typo correction must be suggested
            $this->assertNotNull($result['correction']);
            $this->assertStringContainsStringIgnoringCase('скраб', (string) $result['correction']);
        } else {
            // Trigram/FTS found it anyway — valid, correction must be null
            $this->assertNull($result['correction']);
        }
    }
}
