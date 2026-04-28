<?php

declare(strict_types=1);

namespace Tests\Feature\Recommender;

use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Services\Catalog\CatalogImporter;
use App\WidgetRuntime\Services\Catalog\DTO\RawProduct;
use App\WidgetRuntime\Services\Catalog\Readers\CatalogReader;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

final class FakeReader implements CatalogReader
{
    /** @param list<RawProduct> $items */
    public function __construct(private readonly array $items)
    {
    }

    /** @return iterable<RawProduct> */
    public function read(): iterable
    {
        yield from $this->items;
    }
}

final class CatalogImporterTest extends TestCase
{
    use RefreshDatabase;

    private CatalogImporter $importer;

    private Site $site;

    protected function setUp(): void
    {
        parent::setUp();

        $this->importer = app(CatalogImporter::class);
        $this->site     = Site::factory()->create();
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------

    /**
     * @param array<string, mixed> $overrides
     */
    private function makeProduct(string $sku, array $overrides = []): RawProduct
    {
        return new RawProduct(
            sku: $sku,
            parentSku: $overrides['parentSku'] ?? null,
            alias: $overrides['alias'] ?? null,
            titleUa: $overrides['titleUa'] ?? "Товар {$sku}",
            titleEn: $overrides['titleEn'] ?? "Product {$sku}",
            categoryPath: $overrides['categoryPath'] ?? 'Category',
            brand: $overrides['brand'] ?? 'Brand',
            price: $overrides['price'] ?? 100.0,
            oldPrice: $overrides['oldPrice'] ?? null,
            currency: $overrides['currency'] ?? 'UAH',
            inStock: $overrides['inStock'] ?? true,
            imageUrl: $overrides['imageUrl'] ?? null,
            imageUrls: $overrides['imageUrls'] ?? [],
            descriptionUa: $overrides['descriptionUa'] ?? null,
            descriptionEn: $overrides['descriptionEn'] ?? null,
            shortDescriptionUa: $overrides['shortDescriptionUa'] ?? null,
            shortDescriptionEn: $overrides['shortDescriptionEn'] ?? null,
            rawAttributes: $overrides['rawAttributes'] ?? [],
        );
    }

    /** @return list<RawProduct> */
    private function fiveProducts(): array
    {
        return array_map(fn (int $i) => $this->makeProduct("SKU-{$i}"), range(1, 5));
    }

    // ---------------------------------------------------------------
    // Tests
    // ---------------------------------------------------------------

    public function test_imports_new_products(): void
    {
        $result = $this->importer->import($this->site, new FakeReader($this->fiveProducts()));

        self::assertSame(5, $result->inserted);
        self::assertSame(0, $result->updated);
        self::assertSame(0, $result->unchanged);
        self::assertSame(0, $result->skippedVariants);

        self::assertSame(5, CatalogProduct::query()->where('site_id', $this->site->getKey())->count());
    }

    public function test_is_idempotent(): void
    {
        $products = $this->fiveProducts();

        $this->importer->import($this->site, new FakeReader($products));
        $result = $this->importer->import($this->site, new FakeReader($products));

        self::assertSame(0, $result->inserted);
        self::assertSame(0, $result->updated);
        self::assertSame(5, $result->unchanged);

        self::assertSame(5, CatalogProduct::query()->where('site_id', $this->site->getKey())->count());
    }

    public function test_updates_when_source_hash_changes(): void
    {
        $original = $this->fiveProducts();
        $this->importer->import($this->site, new FakeReader($original));

        // Modify one product's title so its hash changes
        $modified   = $original;
        $modified[0] = $this->makeProduct('SKU-1', ['titleUa' => 'Змінена назва']);

        $result = $this->importer->import($this->site, new FakeReader($modified));

        self::assertSame(0, $result->inserted);
        self::assertSame(1, $result->updated);
        self::assertSame(4, $result->unchanged);
    }

    public function test_clears_ai_fields_on_update(): void
    {
        // Pre-create a product with ai_tagged_at and embedded_at set
        $product = CatalogProduct::factory()->create([
            'site_id'      => $this->site->getKey(),
            'sku'          => 'SKU-AI',
            'title_ua'     => 'Original',
            'source_hash'  => 'old-hash',
            'ai_tagged_at' => now(),
            'embedded_at'  => now(),
        ]);

        // Import a version with a different hash
        $dto = $this->makeProduct('SKU-AI', ['titleUa' => 'Updated']);

        $this->importer->import($this->site, new FakeReader([$dto]));

        $product->refresh();

        self::assertNull($product->ai_tagged_at);
        self::assertNull($product->embedded_at);
    }

    public function test_skips_variants(): void
    {
        // One parent + one variant that points to the parent
        $parent  = $this->makeProduct('PARENT-1');
        $variant = $this->makeProduct('VARIANT-1', ['parentSku' => 'PARENT-1']);

        $result = $this->importer->import($this->site, new FakeReader([$parent, $variant]));

        self::assertSame(1, $result->inserted);
        self::assertSame(1, $result->skippedVariants);

        self::assertSame(1, CatalogProduct::query()->where('site_id', $this->site->getKey())->count());

        $imported = CatalogProduct::query()
            ->where('site_id', $this->site->getKey())
            ->where('sku', 'PARENT-1')
            ->first();

        self::assertNotNull($imported);
    }

    public function test_skips_orphan_variants_with_log_warning(): void
    {
        // Variant whose parent SKU doesn't exist in the batch at all
        Log::spy();

        $orphan = $this->makeProduct('ORPHAN-1', ['parentSku' => 'NONEXISTENT-PARENT']);

        $result = $this->importer->import($this->site, new FakeReader([$orphan]));

        self::assertSame(0, $result->inserted);
        self::assertSame(1, $result->skippedVariants);

        self::assertSame(0, CatalogProduct::query()->where('site_id', $this->site->getKey())->count());
    }
}
