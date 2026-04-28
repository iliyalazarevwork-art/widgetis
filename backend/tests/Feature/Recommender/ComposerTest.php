<?php

declare(strict_types=1);

namespace Tests\Feature\Recommender;

use App\WidgetRuntime\Enums\CartRecommenderRelationSource;
use App\WidgetRuntime\Models\CartRecommenderRelation;
use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Services\Widget\CartRecommender\CartRecommenderService;
use App\WidgetRuntime\Services\Widget\CartRecommender\Composer\CandidateRetriever;
use App\WidgetRuntime\Services\Widget\CartRecommender\Composer\ComposerInterface;
use App\WidgetRuntime\Services\Widget\CartRecommender\Composer\OnDemandComposer;
use App\WidgetRuntime\Services\Widget\CartRecommender\Exceptions\ComposerException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use OpenAI\Contracts\ClientContract;
use OpenAI\Laravel\Facades\OpenAI;
use OpenAI\Responses\Chat\CreateResponse;
use OpenAI\Responses\Meta\MetaInformation;
use Psr\Log\NullLogger;
use Tests\TestCase;

final class ComposerTest extends TestCase
{
    use RefreshDatabase;

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private function makeChatResponse(string $content): CreateResponse
    {
        return CreateResponse::from([
            'id'                 => 'chatcmpl-test',
            'object'             => 'chat.completion',
            'created'            => 1_700_000_000,
            'model'              => 'gpt-4o-mini',
            'system_fingerprint' => null,
            'choices'            => [
                [
                    'index'         => 0,
                    'message'       => [
                        'role'    => 'assistant',
                        'content' => $content,
                    ],
                    'logprobs'      => null,
                    'finish_reason' => 'stop',
                ],
            ],
            'usage' => [
                'prompt_tokens'     => 100,
                'completion_tokens' => 50,
                'total_tokens'      => 150,
            ],
        ], MetaInformation::from([]));
    }

    /** @return array<string, mixed> */
    private function beddingTags(string $primaryType = 'bedding_set', string $role = 'hero'): array
    {
        return [
            'primary_type' => $primaryType,
            'style'        => ['classic'],
            'color_family' => 'white',
            'palette'      => ['white', 'cream'],
            'material'     => 'cotton',
            'mood'         => 'fresh',
            'size_class'   => 'double',
            'role'         => $role,
            'use_cases'    => ['everyday'],
            'complements'  => ['pillowcase', 'duvet_insert'],
        ];
    }

    // ------------------------------------------------------------------
    // Test 1: CandidateRetriever filters
    // ------------------------------------------------------------------

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_filters_out_source_product_out_of_stock_and_non_tagged_candidates(): void
    {
        $site = Site::factory()->create();

        $source = CatalogProduct::factory()->create([
            'site_id'      => $site->id,
            'price'        => 500.00,
            'in_stock'     => true,
            'ai_tags'      => $this->beddingTags(),
            'ai_tagged_at' => now(),
        ]);

        // Should be excluded: the source product itself
        // (already created as $source)

        // Should be excluded: out of stock
        CatalogProduct::factory()->create([
            'site_id'      => $site->id,
            'price'        => 500.00,
            'in_stock'     => false,
            'ai_tags'      => $this->beddingTags('pillowcase', 'accessory'),
            'ai_tagged_at' => now(),
        ]);

        // Should be excluded: not AI-tagged
        CatalogProduct::factory()->create([
            'site_id'      => $site->id,
            'price'        => 500.00,
            'in_stock'     => true,
            'ai_tags'      => null,
            'ai_tagged_at' => null,
        ]);

        // Should be included
        $validProduct = CatalogProduct::factory()->create([
            'site_id'      => $site->id,
            'price'        => 500.00,
            'in_stock'     => true,
            'ai_tags'      => $this->beddingTags('pillowcase', 'accessory'),
            'ai_tagged_at' => now(),
        ]);

        $retriever = new CandidateRetriever(new NullLogger());
        $results   = $retriever->retrieve($source, 50);

        // Only the valid product should be returned
        $this->assertCount(1, $results);
        $this->assertEquals($validProduct->id, $results[0]->id);
    }

    // ------------------------------------------------------------------
    // Test 2: OnDemandComposer with mocked OpenAI
    // ------------------------------------------------------------------

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_composes_and_persists_relations_from_openai_picks(): void
    {
        $site = Site::factory()->create();

        $source = CatalogProduct::factory()->create([
            'site_id'      => $site->id,
            'price'        => 500.00,
            'in_stock'     => true,
            'ai_tags'      => $this->beddingTags(),
            'ai_tagged_at' => now(),
        ]);

        // Create 5 candidate products (all valid)
        $candidates = CatalogProduct::factory()->count(5)->create([
            'site_id'      => $site->id,
            'price'        => 500.00,
            'in_stock'     => true,
            'ai_tags'      => $this->beddingTags('pillowcase', 'accessory'),
            'ai_tagged_at' => now(),
        ]);

        // OpenAI returns picks for candidates at index 1, 3, 5
        $picksPayload = json_encode([
            'picks' => [
                ['index' => 1, 'rationale_ua' => 'Підходить за кольором', 'rationale_en' => 'Matches by colour'],
                ['index' => 3, 'rationale_ua' => 'Доповнює стиль',        'rationale_en' => 'Complements the style'],
                ['index' => 5, 'rationale_ua' => 'Ідеальний акцент',      'rationale_en' => 'Perfect accent'],
            ],
        ]);

        $fake = OpenAI::fake([$this->makeChatResponse((string) $picksPayload)]);
        $this->app->instance(ClientContract::class, $fake);

        /** @var OnDemandComposer $composer */
        $composer = $this->app->make(OnDemandComposer::class);
        $relations = $composer->composeFor($source);

        // Should have 3 persisted relations
        $this->assertCount(3, $relations);

        // All are CartRecommenderRelation instances with LazyAi source
        foreach ($relations as $rel) {
            $this->assertInstanceOf(CartRecommenderRelation::class, $rel);
            $this->assertEquals(CartRecommenderRelationSource::LazyAi, $rel->source);
            $this->assertEquals($source->id, $rel->source_product_id);
        }

        // Scores should be descending
        $scores = array_map(fn ($r) => $r->score, $relations);
        $this->assertGreaterThan($scores[1], $scores[0]);
        $this->assertGreaterThan($scores[2], $scores[1]);

        // Relations are persisted in the database
        $this->assertDatabaseCount('wgt_cart_recommender_relations', 3);

        // Check first relation rationale
        $this->assertEquals('Підходить за кольором', $relations[0]->rationale_ua);
        $this->assertEquals('Matches by colour', $relations[0]->rationale_en);

        // Correct related product IDs (1-based index into candidates collection)
        $candidateIds = $candidates->pluck('id')->values()->all();
        $this->assertEquals($candidateIds[0], $relations[0]->related_product_id); // index 1
        $this->assertEquals($candidateIds[2], $relations[1]->related_product_id); // index 3
        $this->assertEquals($candidateIds[4], $relations[2]->related_product_id); // index 5
    }

    // ------------------------------------------------------------------
    // Test 3: CartRecommenderService returns existing fresh relations
    // ------------------------------------------------------------------

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_returns_existing_fresh_relations_without_calling_openai(): void
    {
        $site = Site::factory()->create();

        $source = CatalogProduct::factory()->create([
            'site_id'      => $site->id,
            'in_stock'     => true,
            'ai_tags'      => $this->beddingTags(),
            'ai_tagged_at' => now(),
        ]);

        $related = CatalogProduct::factory()->create([
            'site_id'  => $site->id,
            'in_stock' => true,
        ]);

        // Create a fresh relation (not expired)
        CartRecommenderRelation::factory()->create([
            'site_id'            => $site->id,
            'source_product_id'  => $source->id,
            'related_product_id' => $related->id,
            'score'              => 0.9,
            'source'             => CartRecommenderRelationSource::LazyAi,
            'computed_at'        => now(),
            'expires_at'         => now()->addDays(7),
        ]);

        // OpenAI should NOT be called — the composer mock asserts it receives no calls
        /** @var \Mockery\MockInterface&ComposerInterface $neverCalledComposer */
        $neverCalledComposer = \Mockery::mock(ComposerInterface::class);
        $neverCalledComposer->shouldNotReceive('composeFor');

        $service = new CartRecommenderService($neverCalledComposer, new NullLogger());
        $results = $service->suggestForProduct($site, $source->id);

        $this->assertCount(1, $results);
        $this->assertEquals($related->id, $results[0]->related_product_id);
        $this->assertEquals(0.9, $results[0]->score);
    }

    // ------------------------------------------------------------------
    // Test 4: CartRecommenderService falls back to category match on exception
    // ------------------------------------------------------------------

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_falls_back_to_category_products_when_composer_throws(): void
    {
        $site = Site::factory()->create();

        $source = CatalogProduct::factory()->create([
            'site_id'         => $site->id,
            'price'           => 500.00,
            'in_stock'        => true,
            'category_path'   => 'Bedding > Sets',
            'ai_tags'         => $this->beddingTags(),
            'ai_tagged_at'    => now(),
        ]);

        // Products in the same category (should be returned as fallback)
        $sameCategoryProducts = CatalogProduct::factory()->count(3)->create([
            'site_id'       => $site->id,
            'price'         => 500.00,
            'in_stock'      => true,
            'category_path' => 'Bedding > Sets',
            'ai_tags'       => null,
            'ai_tagged_at'  => null,
        ]);

        // Product in a different category (should NOT be returned)
        CatalogProduct::factory()->create([
            'site_id'       => $site->id,
            'price'         => 500.00,
            'in_stock'      => true,
            'category_path' => 'Towels',
            'ai_tags'       => null,
            'ai_tagged_at'  => null,
        ]);

        // Mock composer to throw ComposerException
        /** @var \Mockery\MockInterface&ComposerInterface $failingComposer */
        $failingComposer = \Mockery::mock(ComposerInterface::class);
        $failingComposer->shouldReceive('composeFor')
            ->once()
            ->andThrow(new ComposerException('Simulated OpenAI failure'));

        $service = new CartRecommenderService($failingComposer, new NullLogger());
        $results = $service->suggestForProduct($site, $source->id);

        // Should return 3 same-category fallback products
        $this->assertCount(3, $results);

        foreach ($results as $rel) {
            $this->assertInstanceOf(CartRecommenderRelation::class, $rel);
            $this->assertEquals(CartRecommenderRelationSource::CategoryFallback, $rel->source);
            $this->assertContains(
                $rel->related_product_id,
                $sameCategoryProducts->pluck('id')->all(),
            );
        }

        // Fallback relations are NOT persisted
        $this->assertDatabaseCount('wgt_cart_recommender_relations', 0);
    }
}
