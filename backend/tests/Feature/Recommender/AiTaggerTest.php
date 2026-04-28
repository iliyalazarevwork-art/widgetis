<?php

declare(strict_types=1);

namespace Tests\Feature\Recommender;

use App\WidgetRuntime\Enums\CatalogVertical;
use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Services\Catalog\Exceptions\TaggerException;
use App\WidgetRuntime\Services\Catalog\Tagging\AiTaggerService;
use App\WidgetRuntime\Services\Catalog\Tagging\VerticalDictionary;
use Illuminate\Foundation\Testing\RefreshDatabase;
use OpenAI\Contracts\ClientContract;
use OpenAI\Laravel\Facades\OpenAI;
use OpenAI\Responses\Chat\CreateResponse;
use OpenAI\Responses\Meta\MetaInformation;
use Tests\TestCase;

final class AiTaggerTest extends TestCase
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

    // ------------------------------------------------------------------
    // Tests
    // ------------------------------------------------------------------

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_tags_a_product_and_saves_ai_tags_ai_tagged_at_and_clears_embedded_at(): void
    {
        $site = Site::factory()->create([
            'recommender_vertical' => CatalogVertical::Bedding,
        ]);

        $product = CatalogProduct::factory()->create([
            'site_id'       => $site->id,
            'title_ua'      => 'Комплект постільної білизни "Зірки"',
            'category_path' => 'Постільна білизна > Комплекти',
            'ai_tags'       => null,
            'ai_tagged_at'  => null,
            'embedded_at'   => now(),
        ]);

        $tags = [
            'primary_type' => 'bedding_set',
            'style'        => ['classic', 'minimalist'],
            'color_family' => 'white',
            'palette'      => ['white', 'cream'],
            'material'     => 'cotton',
            'mood'         => 'fresh',
            'size_class'   => 'double',
            'role'         => 'hero',
            'use_cases'    => ['everyday'],
            'complements'  => ['pillowcase', 'duvet_insert'],
        ];

        $fake = OpenAI::fake([$this->makeChatResponse((string) json_encode($tags))]);
        $this->app->instance(ClientContract::class, $fake);

        /** @var AiTaggerService $tagger */
        $tagger   = $this->app->make(AiTaggerService::class);
        $vertical = VerticalDictionary::for(CatalogVertical::Bedding);

        $tagger->tagAndSave($product, $vertical);

        $product->refresh();

        $this->assertEquals($tags, $product->ai_tags);
        $this->assertNotNull($product->ai_tagged_at);
        $this->assertNull($product->embedded_at);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_generates_a_json_schema_for_bedding_vertical_with_all_fields_required_and_no_additional_properties(): void
    {
        $vertical = VerticalDictionary::for(CatalogVertical::Bedding);
        $schema   = $vertical->toJsonSchema();

        $this->assertSame('product_tags_bedding', $schema['name']);
        $this->assertTrue($schema['strict']);

        $jsonSchema = $schema['schema'];

        $this->assertSame('object', $jsonSchema['type']);
        $this->assertFalse($jsonSchema['additionalProperties']);

        $beddingFields = [
            'primary_type', 'style', 'color_family', 'palette',
            'material', 'mood', 'size_class', 'role', 'use_cases', 'complements',
        ];

        $this->assertSame($beddingFields, $jsonSchema['required']);
        $this->assertSame($beddingFields, array_keys($jsonSchema['properties']));

        // Array fields have items sub-schema with minItems/maxItems
        $this->assertSame('array', $jsonSchema['properties']['style']['type']);
        $this->assertIsArray($jsonSchema['properties']['style']['items']['enum']);
        $this->assertSame(1, $jsonSchema['properties']['style']['minItems']);
        $this->assertSame(3, $jsonSchema['properties']['style']['maxItems']);

        // String enum field
        $this->assertSame('string', $jsonSchema['properties']['primary_type']['type']);
        $this->assertContains('bedding_set', $jsonSchema['properties']['primary_type']['enum']);

        // palette has no enum but is an array (free string items)
        $this->assertSame('array', $jsonSchema['properties']['palette']['type']);
        $this->assertArrayNotHasKey('enum', $jsonSchema['properties']['palette']);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_throws_tagger_exception_when_model_returns_malformed_json(): void
    {
        $this->expectException(TaggerException::class);

        $site = Site::factory()->create([
            'recommender_vertical' => CatalogVertical::Bedding,
        ]);

        $product = CatalogProduct::factory()->create([
            'site_id' => $site->id,
        ]);

        $fake = OpenAI::fake([$this->makeChatResponse('this is not json {{{{')]);
        $this->app->instance(ClientContract::class, $fake);

        /** @var AiTaggerService $tagger */
        $tagger   = $this->app->make(AiTaggerService::class);
        $vertical = VerticalDictionary::for(CatalogVertical::Bedding);

        $tagger->tag($product, $vertical);
    }
}
