<?php

declare(strict_types=1);

namespace Tests\Feature\Recommender;

use App\WidgetRuntime\Enums\CatalogVertical;
use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Models\Site;
use Illuminate\Foundation\Testing\RefreshDatabase;
use OpenAI\Contracts\ClientContract;
use OpenAI\Responses\Chat\CreateResponse;
use OpenAI\Responses\Embeddings\CreateResponse as EmbeddingCreateResponse;
use OpenAI\Responses\Meta\MetaInformation;
use OpenAI\Testing\ClientFake;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;
use Tests\TestCase;

final class OnboardCommandTest extends TestCase
{
    use RefreshDatabase;

    private string $xlsxPath;

    protected function setUp(): void
    {
        parent::setUp();

        $this->xlsxPath = storage_path('app/test_onboard.xlsx');
        $this->createFixtureXlsx($this->xlsxPath);
    }

    protected function tearDown(): void
    {
        if (file_exists($this->xlsxPath)) {
            unlink($this->xlsxPath);
        }

        parent::tearDown();
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------

    /**
     * Build a minimal XLSX with a non-empty header row + 3 product rows.
     *
     * Column layout follows RawProduct::fromXlsxRow():
     *   0  = sku        1  = parent_sku   3  = title_ua  4  = title_en
     *   8  = brand      9  = category     11 = price      13 = currency
     *   14 = visibility 15 = stock        16 = image_url
     *
     * IMPORTANT: OpenSpout silently drops rows where every cell is empty,
     * so the header row must contain at least one non-empty cell — otherwise
     * the first product row becomes the "header" and gets skipped by XlsxCatalogReader.
     */
    private function createFixtureXlsx(string $path): void
    {
        $dir = dirname($path);
        if (! is_dir($dir)) {
            mkdir($dir, 0777, true);
        }

        $writer = new Writer();
        $writer->openToFile($path);

        // Header row — must be non-empty so OpenSpout actually writes it.
        $headers    = array_fill(0, 35, 'col');
        $headers[0] = 'sku';
        $writer->addRow(Row::fromValues($headers));

        // 3 product rows
        for ($i = 1; $i <= 3; $i++) {
            $cells        = array_fill(0, 35, '');
            $cells[0]     = "SKU-{$i}";
            $cells[3]     = "Товар {$i}";
            $cells[4]     = "Product {$i}";
            $cells[8]     = 'TestBrand';
            $cells[9]     = 'Category > Sub';
            $cells[11]    = 100.0 * $i;
            $cells[13]    = 'UAH';
            $cells[14]    = 'yes';
            $cells[15]    = 'in stock';
            $cells[16]    = 'https://img.test/1.jpg';
            $writer->addRow(Row::fromValues($cells));
        }

        $writer->close();
    }

    /**
     * Build a fake OpenAI chat completion response (used by AI tagger).
     */
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
                    'message'       => ['role' => 'assistant', 'content' => $content],
                    'logprobs'      => null,
                    'finish_reason' => 'stop',
                ],
            ],
            'usage' => ['prompt_tokens' => 50, 'completion_tokens' => 20, 'total_tokens' => 70],
        ], MetaInformation::from([]));
    }

    /**
     * Build a fake OpenAI embeddings response for $count products.
     */
    private function makeEmbeddingResponse(int $count): EmbeddingCreateResponse
    {
        $data = [];

        for ($i = 0; $i < $count; $i++) {
            $data[] = [
                'object'    => 'embedding',
                'index'     => $i,
                'embedding' => array_fill(0, 1536, 0.0),
            ];
        }

        return EmbeddingCreateResponse::from([
            'object' => 'list',
            'model'  => 'text-embedding-3-small',
            'data'   => $data,
            'usage'  => ['prompt_tokens' => 10, 'total_tokens' => 10],
        ], MetaInformation::from([]));
    }

    /**
     * Build a valid AI-tags JSON for the bedding vertical.
     */
    private function beddingTagsJson(): string
    {
        return (string) json_encode([
            'primary_type' => 'bedding_set',
            'style'        => ['classic'],
            'color_family' => 'white',
            'palette'      => ['white'],
            'material'     => 'cotton',
            'mood'         => 'fresh',
            'size_class'   => 'double',
            'role'         => 'hero',
            'use_cases'    => ['everyday'],
            'complements'  => ['pillowcase'],
        ]);
    }

    // ---------------------------------------------------------------
    // Tests
    // ---------------------------------------------------------------

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_onboards_a_site_end_to_end_with_sync_flag(): void
    {
        $site = Site::factory()->create(['recommender_vertical' => CatalogVertical::Generic]);

        // 3 products → 3 tagging calls (chat) + 1 embedding batch call.
        $fake = new ClientFake([
            $this->makeChatResponse($this->beddingTagsJson()),
            $this->makeChatResponse($this->beddingTagsJson()),
            $this->makeChatResponse($this->beddingTagsJson()),
            $this->makeEmbeddingResponse(3),
        ]);
        $this->app->instance(ClientContract::class, $fake);

        $this->artisan('cart-recommender:onboard', [
            'site'       => $site->domain,
            '--vertical' => 'bedding',
            '--xlsx'     => $this->xlsxPath,
            '--sync'     => true,
        ])->assertExitCode(0);

        // Vertical persisted
        $site->refresh();
        $this->assertSame(CatalogVertical::Bedding, $site->recommender_vertical);

        // All 3 products imported, tagged and embedded
        $total    = CatalogProduct::query()->where('site_id', $site->getKey())->count();
        $tagged   = CatalogProduct::query()->where('site_id', $site->getKey())->whereNotNull('ai_tagged_at')->count();
        $embedded = CatalogProduct::query()->where('site_id', $site->getKey())->whereNotNull('embedded_at')->count();

        $this->assertSame(3, $total);
        $this->assertSame(3, $tagged);
        $this->assertSame(3, $embedded);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_fast_when_xlsx_file_does_not_exist(): void
    {
        $site = Site::factory()->create();

        $this->artisan('cart-recommender:onboard', [
            'site'   => $site->domain,
            '--xlsx' => '/tmp/nonexistent_file_xyz_12345.xlsx',
        ])->assertExitCode(1);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_fails_when_vertical_is_invalid(): void
    {
        $site = Site::factory()->create();

        $this->artisan('cart-recommender:onboard', [
            'site'       => $site->domain,
            '--vertical' => 'invalid_vertical',
            '--xlsx'     => $this->xlsxPath,
        ])->assertExitCode(1);
    }
}
