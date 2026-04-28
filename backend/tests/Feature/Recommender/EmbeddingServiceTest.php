<?php

declare(strict_types=1);

namespace Tests\Feature\Recommender;

use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Services\Catalog\Embedding\EmbeddingService;
use App\WidgetRuntime\Services\Catalog\Embedding\EmbeddingTextBuilder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use OpenAI\Contracts\ClientContract;
use OpenAI\Laravel\Facades\OpenAI;
use OpenAI\Responses\Embeddings\CreateResponse;
use OpenAI\Responses\Meta\MetaInformation;
use Tests\TestCase;

final class EmbeddingServiceTest extends TestCase
{
    use RefreshDatabase;

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /**
     * Build a fake OpenAI embeddings CreateResponse with $count embeddings,
     * each being a $dimensions-length zero vector.
     *
     * @param  array<int, array<int, float>>  $vectors  Per-embedding float arrays.
     */
    private function makeEmbeddingResponse(array $vectors): CreateResponse
    {
        $data = [];
        foreach ($vectors as $i => $vec) {
            $data[] = [
                'object'    => 'embedding',
                'index'     => $i,
                'embedding' => $vec,
            ];
        }

        return CreateResponse::from(
            [
                'object' => 'list',
                'model'  => 'text-embedding-3-small',
                'data'   => $data,
                'usage'  => ['prompt_tokens' => 10, 'total_tokens' => 10],
            ],
            MetaInformation::from([]),
        );
    }

    /** @return array<int, float> */
    private function zeroVector(int $dims = 1536): array
    {
        return array_fill(0, $dims, 0.0);
    }

    // ------------------------------------------------------------------
    // EmbeddingTextBuilder tests
    // ------------------------------------------------------------------

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_builds_embedding_text_from_product(): void
    {
        $builder = new EmbeddingTextBuilder();

        $site = Site::factory()->create();

        $product = CatalogProduct::factory()->create([
            'site_id'       => $site->id,
            'title_ua'      => 'Комплект постільної білизни',
            'category_path' => 'Постільна білизна > Комплекти',
            'ai_tags'       => [
                'style'        => ['classic', 'minimalist'],
                'material'     => 'cotton',
                'color_family' => 'white',
                'mood'         => 'fresh',
            ],
            'raw_attributes' => [
                ['value' => 'Двоспальний'],
                ['value' => '200x220'],
                ['value' => '100% бавовна'],
                ['value' => 'this one should be ignored'],
            ],
        ]);

        $text = $builder->build($product);

        $this->assertStringContainsString('Комплект постільної білизни', $text);
        $this->assertStringContainsString('Постільна білизна > Комплекти', $text);
        $this->assertStringContainsString('classic', $text);
        $this->assertStringContainsString('cotton', $text);
        $this->assertStringContainsString('white', $text);
        $this->assertStringContainsString('fresh', $text);
        // Only first 3 raw attributes
        $this->assertStringContainsString('Двоспальний', $text);
        $this->assertStringContainsString('200x220', $text);
        $this->assertStringNotContainsString('this one should be ignored', $text);
        // Max 500 chars
        $this->assertLessThanOrEqual(500, mb_strlen($text));
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_falls_back_to_title_en_when_title_ua_is_null(): void
    {
        $builder = new EmbeddingTextBuilder();

        $site = Site::factory()->create();

        $product = CatalogProduct::factory()->create([
            'site_id'  => $site->id,
            'title_ua' => null,
            'title_en' => 'Bedding Set',
        ]);

        $text = $builder->build($product);

        $this->assertStringContainsString('Bedding Set', $text);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_clips_text_to_500_chars(): void
    {
        $builder = new EmbeddingTextBuilder();

        $site = Site::factory()->create();

        $product = CatalogProduct::factory()->create([
            'site_id'       => $site->id,
            'title_ua'      => str_repeat('А', 400),
            'category_path' => str_repeat('Б', 400),
        ]);

        $text = $builder->build($product);

        $this->assertLessThanOrEqual(500, mb_strlen($text));
    }

    // ------------------------------------------------------------------
    // EmbeddingService tests
    // ------------------------------------------------------------------

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_embeds_and_stamps_embedded_at_on_a_product(): void
    {
        $site = Site::factory()->create();

        $product = CatalogProduct::factory()->create([
            'site_id'      => $site->id,
            'title_ua'     => 'Товар для тесту',
            'ai_tagged_at' => now(),
            'ai_tags'      => ['style' => ['casual'], 'material' => 'polyester', 'color_family' => 'blue', 'mood' => 'sporty'],
            'embedded_at'  => null,
        ]);

        $fake = OpenAI::fake([$this->makeEmbeddingResponse([$this->zeroVector()])]);
        $this->app->instance(ClientContract::class, $fake);

        /** @var EmbeddingService $svc */
        $svc = $this->app->make(EmbeddingService::class);
        $svc->embed($product);

        $product->refresh();

        $this->assertNotNull($product->embedded_at);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_embeds_a_batch_of_five_products_in_one_openai_call(): void
    {
        $site = Site::factory()->create();

        $products = CatalogProduct::factory()->count(5)->create([
            'site_id'      => $site->id,
            'ai_tagged_at' => now(),
            'embedded_at'  => null,
        ]);

        $vectors = array_fill(0, 5, $this->zeroVector());
        $fake = OpenAI::fake([$this->makeEmbeddingResponse($vectors)]);
        $this->app->instance(ClientContract::class, $fake);

        /** @var EmbeddingService $svc */
        $svc = $this->app->make(EmbeddingService::class);
        $svc->embedBatch($products->all());

        // All 5 products must now have embedded_at set.
        foreach ($products as $product) {
            $product->refresh();
            $this->assertNotNull($product->embedded_at);
        }
    }

    // ------------------------------------------------------------------
    // scopeNeedingEmbedding tests
    // ------------------------------------------------------------------

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_excludes_product_without_ai_tagged_at_from_scope_needing_embedding(): void
    {
        $site = Site::factory()->create();

        // Product without ai_tagged_at — must be excluded.
        CatalogProduct::factory()->create([
            'site_id'      => $site->id,
            'ai_tagged_at' => null,
            'embedded_at'  => null,
        ]);

        // Product with ai_tagged_at and no embedding — must be included.
        $ready = CatalogProduct::factory()->create([
            'site_id'      => $site->id,
            'ai_tagged_at' => now(),
            'embedded_at'  => null,
        ]);

        $ids = CatalogProduct::query()
            ->where('site_id', $site->id)
            ->needingEmbedding()
            ->pluck('id')
            ->all();

        $this->assertContains($ready->id, $ids);
        $this->assertCount(1, $ids);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_excludes_already_embedded_product_from_scope_needing_embedding(): void
    {
        $site = Site::factory()->create();

        // Already embedded — must be excluded.
        CatalogProduct::factory()->create([
            'site_id'      => $site->id,
            'ai_tagged_at' => now(),
            'embedded_at'  => now(),
        ]);

        $ids = CatalogProduct::query()
            ->where('site_id', $site->id)
            ->needingEmbedding()
            ->pluck('id')
            ->all();

        $this->assertCount(0, $ids);
    }
}
