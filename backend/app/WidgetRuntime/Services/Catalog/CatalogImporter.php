<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Catalog;

use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Services\Catalog\DTO\ImportResult;
use App\WidgetRuntime\Services\Catalog\DTO\RawProduct;
use App\WidgetRuntime\Services\Catalog\Readers\CatalogReader;
use Illuminate\Support\Facades\DB;
use Psr\Log\LoggerInterface;

final class CatalogImporter
{
    public function __construct(private readonly LoggerInterface $logger)
    {
    }

    public function import(
        Site $site,
        CatalogReader $reader,
        ?\Closure $onProgress = null,
    ): ImportResult {
        // First pass: collect all SKUs so we can identify valid parents
        /** @var array<string, true> $allSkus */
        $allSkus = [];
        $rows    = [];

        foreach ($reader->read() as $product) {
            $allSkus[$product->sku] = true;
            $rows[]                 = $product;
        }

        $inserted        = 0;
        $updated         = 0;
        $unchanged       = 0;
        $skippedVariants = 0;
        $skippedHidden   = 0; // already filtered in reader (fromXlsxRow returns null for hidden)

        $processed = 0;

        $this->runInTransaction(function () use (
            $site,
            $rows,
            $allSkus,
            &$inserted,
            &$updated,
            &$unchanged,
            &$skippedVariants,
            $onProgress,
            &$processed,
        ): void {
            foreach ($rows as $product) {
                /** @var RawProduct $product */
                if ($this->isVariant($product, $allSkus)) {
                    $skippedVariants++;
                    $processed++;

                    if ($onProgress !== null) {
                        ($onProgress)($processed);
                    }

                    continue;
                }

                $result = $this->upsertProduct($site, $product);

                match ($result) {
                    'inserted'  => $inserted++,
                    'updated'   => $updated++,
                    'unchanged' => $unchanged++,
                    default     => null,
                };

                $processed++;

                if ($onProgress !== null) {
                    ($onProgress)($processed);
                }
            }
        });

        return new ImportResult(
            inserted: $inserted,
            updated: $updated,
            unchanged: $unchanged,
            skippedVariants: $skippedVariants,
            skippedHidden: $skippedHidden,
        );
    }

    /**
     * Returns 'inserted', 'updated', or 'unchanged'.
     */
    private function upsertProduct(Site $site, RawProduct $product): string
    {
        $hash    = $product->sourceHash();
        $siteId  = $site->getKey();

        /** @var CatalogProduct|null $existing */
        $existing = CatalogProduct::query()
            ->where('site_id', $siteId)
            ->where('sku', $product->sku)
            ->first();

        if ($existing === null) {
            CatalogProduct::create($this->toAttributes($siteId, $product, $hash));

            return 'inserted';
        }

        if ($existing->source_hash === $hash) {
            return 'unchanged';
        }

        $attrs = $this->toAttributes($siteId, $product, $hash);
        // Clear AI fields so re-tagging and re-embedding are triggered
        $attrs['ai_tagged_at'] = null;
        $attrs['embedded_at']  = null;

        $existing->fill($attrs)->save();

        // Also null out the pgvector embedding column (not in fillable, raw update).
        // The column only exists on PostgreSQL — skip this in SQLite test environments.
        if (DB::connection('pgsql_runtime')->getDriverName() === 'pgsql') {
            DB::connection('pgsql_runtime')
                ->table('wgt_catalog_products')
                ->where('id', $existing->getKey())
                ->update(['embedding' => null]);
        }

        return 'updated';
    }

    /**
     * @param array<string, true> $allSkus
     */
    private function isVariant(RawProduct $product, array $allSkus): bool
    {
        if ($product->parentSku === null || $product->parentSku === $product->sku) {
            return false;
        }

        if (! isset($allSkus[$product->parentSku])) {
            $this->logger->info(
                'CatalogImporter: variant references unknown parent, skipping',
                ['sku' => $product->sku, 'parent_sku' => $product->parentSku],
            );
        }

        // Either way: it's a variant row — skip it
        return true;
    }

    /**
     * Run a callback inside a transaction on the runtime connection.
     *
     * When tests wrap each case in their own SQLite transaction via RefreshDatabase,
     * calling DB::transaction() on the same underlying PDO from a second Connection
     * object would fail with "cannot start a transaction within a transaction" (PHP 8.4+).
     * Checking `transactionLevel()` on *this* connection object is not reliable in that
     * scenario (the other connection holds the open transaction), so we fall back to
     * checking the PDO directly. If the PDO is already in a transaction we run the
     * callback without wrapping — the outer transaction provides rollback safety anyway.
     */
    private function runInTransaction(\Closure $callback): void
    {
        $connection = DB::connection('pgsql_runtime');

        if ($connection->getPdo()->inTransaction()) {
            $callback();

            return;
        }

        /** @phpstan-ignore argument.templateType */
        $connection->transaction($callback);
    }

    /**
     * @return array<string, mixed>
     */
    private function toAttributes(mixed $siteId, RawProduct $product, string $hash): array
    {
        return [
            'site_id'              => $siteId,
            'sku'                  => $product->sku,
            'parent_sku'           => $product->parentSku,
            'alias'                => $product->alias,
            'title_ua'             => $product->titleUa,
            'title_en'             => $product->titleEn,
            'category_path'        => $product->categoryPath,
            'brand'                => $product->brand,
            'price'                => $product->price,
            'old_price'            => $product->oldPrice,
            'currency'             => $product->currency,
            'in_stock'             => $product->inStock,
            'image_url'            => $product->imageUrl,
            'image_urls'           => $product->imageUrls,
            'description_ua'       => $product->descriptionUa,
            'description_en'       => $product->descriptionEn,
            'short_description_ua' => $product->shortDescriptionUa,
            'short_description_en' => $product->shortDescriptionEn,
            'raw_attributes'       => $product->rawAttributes,
            'source_hash'          => $hash,
        ];
    }
}
