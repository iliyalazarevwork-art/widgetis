<?php

declare(strict_types=1);

namespace Tests\Feature\SmartSearch;

use App\SmartSearch\Services\Cache\SearchCache;
use App\WidgetRuntime\Models\Site;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class PublicSearchTest extends TestCase
{
    use RefreshDatabase;

    /**
     * SQLite (test DB) lacks pg_trgm/tsvector that the production search engine
     * relies on. We don't want to spin up Postgres in tests, so the public
     * controller is exercised against a stubbed engine.
     */
    protected function setUp(): void
    {
        parent::setUp();

        // The cache is shared across requests; flush between tests.
        $this->app->make(SearchCache::class)->flushSite('any');
    }

    private function siteWithDomain(string $domain): Site
    {
        return Site::factory()->create(['domain' => $domain]);
    }

    private function seedProduct(Site $site, array $overrides = []): void
    {
        DB::table('wgt_smart_search_products')->insert(array_merge([
            'id'            => Str::uuid7()->toString(),
            'site_id'       => $site->id,
            'lang'          => 'uk',
            'external_id'   => (string) random_int(1_000_000, 9_999_999),
            'name'          => 'Тестовий товар',
            'vendor'        => 'TestBrand',
            'category_id'   => '100',
            'category_path' => 'Категорія',
            'category_name' => 'Категорія',
            'picture'       => 'https://example.com/img.jpg',
            'url'           => 'https://example.com/p/1',
            'price'         => 100,
            'oldprice'      => 0,
            'currency'      => 'UAH',
            'available'     => true,
            'search_text'   => 'тестовий товар testbrand категорія',
            'popularity'    => 0,
            'created_at'    => now(),
            'updated_at'    => now(),
        ], $overrides));
    }

    public function test_returns_403_when_origin_unknown(): void
    {
        $response = $this->getJson('/api/v1/widgets/smart-search?q=test', [
            'Origin' => 'https://nope.invalid',
        ]);

        $response->assertStatus(403);
        $response->assertJsonPath('error.code', 'UNKNOWN_ORIGIN');
    }

    public function test_returns_403_when_origin_missing(): void
    {
        $response = $this->getJson('/api/v1/widgets/smart-search?q=test');

        $response->assertStatus(403);
        $response->assertJsonPath('error.code', 'UNKNOWN_ORIGIN');
    }

    public function test_returns_422_when_query_too_short(): void
    {
        $site = $this->siteWithDomain('shop.test');

        $response = $this->getJson('/api/v1/widgets/smart-search?q=a', [
            'Origin' => 'https://shop.test',
        ]);

        $response->assertStatus(422);
    }

    public function test_returns_422_when_query_missing(): void
    {
        $site = $this->siteWithDomain('shop.test');

        $response = $this->getJson('/api/v1/widgets/smart-search', [
            'Origin' => 'https://shop.test',
        ]);

        $response->assertStatus(422);
    }

    public function test_response_has_contract_shape(): void
    {
        $site = $this->siteWithDomain('shop.test');

        // Stub engine — we only exercise controller plumbing here.
        $this->app->bind(\App\SmartSearch\Services\Search\ProductSearchEngine::class, fn () => new class () implements \App\SmartSearch\Services\Search\ProductSearchEngine {
            public function search(\App\SmartSearch\DataTransferObjects\SearchQueryDto $query): \App\SmartSearch\DataTransferObjects\SearchResponseDto
            {
                return \App\SmartSearch\DataTransferObjects\SearchResponseDto::create(
                    query: $query->query,
                    correction: null,
                    total: 0,
                    loading: false,
                    accentColor: null,
                    currency: 'UAH',
                    categoryUrls: [],
                    features: ['translit' => true, 'typo' => true, 'morphology' => false, 'synonyms' => false, 'history' => true],
                    groups: [],
                );
            }
        });

        $response = $this->getJson('/api/v1/widgets/smart-search?q=test', [
            'Origin' => 'https://shop.test',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'query',
            'correction',
            'total',
            'loading',
            'currency',
            'categoryUrls',
            'features' => ['translit', 'typo', 'morphology', 'synonyms', 'history'],
            'groups',
        ]);
    }

    public function test_etag_returns_304_on_match(): void
    {
        $site = $this->siteWithDomain('shop.test');

        $this->app->bind(\App\SmartSearch\Services\Search\ProductSearchEngine::class, fn () => new class () implements \App\SmartSearch\Services\Search\ProductSearchEngine {
            public function search(\App\SmartSearch\DataTransferObjects\SearchQueryDto $query): \App\SmartSearch\DataTransferObjects\SearchResponseDto
            {
                return \App\SmartSearch\DataTransferObjects\SearchResponseDto::create(
                    query: $query->query,
                    correction: null,
                    total: 0,
                    loading: false,
                    accentColor: null,
                    currency: 'UAH',
                    categoryUrls: [],
                    features: [],
                    groups: [],
                );
            }
        });

        $first = $this->getJson('/api/v1/widgets/smart-search?q=test', ['Origin' => 'https://shop.test']);
        $first->assertStatus(200);
        $etag = $first->headers->get('ETag');
        $this->assertNotEmpty($etag, 'ETag header missing');

        $second = $this->getJson('/api/v1/widgets/smart-search?q=test', [
            'Origin'        => 'https://shop.test',
            'If-None-Match' => $etag,
        ]);
        $second->assertStatus(304);
    }

    public function test_lang_resolved_from_accept_language_header(): void
    {
        $site = $this->siteWithDomain('shop.test');

        $capturedLang = null;

        $this->app->bind(\App\SmartSearch\Services\Search\ProductSearchEngine::class, function () use (&$capturedLang) {
            return new class ($capturedLang) implements \App\SmartSearch\Services\Search\ProductSearchEngine {
                public function __construct(private mixed &$captured)
                {
                }

                public function search(\App\SmartSearch\DataTransferObjects\SearchQueryDto $query): \App\SmartSearch\DataTransferObjects\SearchResponseDto
                {
                    $this->captured = $query->lang->value;

                    return \App\SmartSearch\DataTransferObjects\SearchResponseDto::create(
                        query: $query->query,
                        correction: null,
                        total: 0,
                        loading: false,
                        accentColor: null,
                        currency: 'UAH',
                        categoryUrls: [],
                        features: [],
                        groups: [],
                    );
                }
            };
        });

        $this->getJson('/api/v1/widgets/smart-search?q=test', [
            'Origin'          => 'https://shop.test',
            'Accept-Language' => 'ru-RU,ru;q=0.9,uk;q=0.8',
        ])->assertStatus(200);

        $this->assertSame('ru', $capturedLang);
    }

    public function test_lang_defaults_to_uk_when_tag_unrecognised(): void
    {
        $site = $this->siteWithDomain('shop.test');

        $capturedLang = null;

        $this->app->bind(\App\SmartSearch\Services\Search\ProductSearchEngine::class, function () use (&$capturedLang) {
            return new class ($capturedLang) implements \App\SmartSearch\Services\Search\ProductSearchEngine {
                public function __construct(private mixed &$captured)
                {
                }

                public function search(\App\SmartSearch\DataTransferObjects\SearchQueryDto $query): \App\SmartSearch\DataTransferObjects\SearchResponseDto
                {
                    $this->captured = $query->lang->value;

                    return \App\SmartSearch\DataTransferObjects\SearchResponseDto::create(
                        query: $query->query,
                        correction: null,
                        total: 0,
                        loading: false,
                        accentColor: null,
                        currency: 'UAH',
                        categoryUrls: [],
                        features: [],
                        groups: [],
                    );
                }
            };
        });

        $this->getJson('/api/v1/widgets/smart-search?q=test', [
            'Origin'          => 'https://shop.test',
            'Accept-Language' => 'fr-FR,fr;q=0.9',   // unsupported → fallback to uk
        ])->assertStatus(200);

        $this->assertSame('uk', $capturedLang);
    }

    public function test_response_has_cache_headers(): void
    {
        $site = $this->siteWithDomain('shop.test');

        $this->app->bind(\App\SmartSearch\Services\Search\ProductSearchEngine::class, fn () => new class () implements \App\SmartSearch\Services\Search\ProductSearchEngine {
            public function search(\App\SmartSearch\DataTransferObjects\SearchQueryDto $query): \App\SmartSearch\DataTransferObjects\SearchResponseDto
            {
                return \App\SmartSearch\DataTransferObjects\SearchResponseDto::create(
                    query: $query->query,
                    correction: null,
                    total: 0,
                    loading: false,
                    accentColor: null,
                    currency: 'UAH',
                    categoryUrls: [],
                    features: [],
                    groups: [],
                );
            }
        });

        $response = $this->getJson('/api/v1/widgets/smart-search?q=test', [
            'Origin' => 'https://shop.test',
        ]);

        $response->assertStatus(200);
        $cc = (string) $response->headers->get('Cache-Control');
        $this->assertStringContainsString('public', $cc);
        $this->assertStringContainsString('max-age=', $cc);
        $this->assertStringContainsString('stale-while-revalidate=', $cc);
    }
}
