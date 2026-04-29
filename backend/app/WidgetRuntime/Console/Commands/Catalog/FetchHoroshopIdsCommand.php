<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Console\Commands\Catalog;

use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Services\Catalog\Exceptions\SiteNotFoundException;
use App\WidgetRuntime\Services\Catalog\Horoshop\HoroshopProductIdFetchException;
use App\WidgetRuntime\Services\Catalog\Horoshop\XlsxAliasSkuReader;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Throwable;

final class FetchHoroshopIdsCommand extends Command
{
    /**
     * Matches Horoshop product page DOM:
     *   <... id="j-buy-button-counter-12345" ...>
     *   <... id="j-buy-button-widget-12345"  ...>
     */
    private const ID_REGEX = '/id="j-buy-button-(?:counter|widget)-(\d+)/';

    private const TIMEOUT_SECONDS = 15;

    private const USER_AGENT = 'WidgetisCrawler/1.0';

    protected $signature = 'catalog:fetch-horoshop-ids
        {site                : Site domain or site_key}
        {file?               : Absolute path to the XLSX file with sku + alias columns (optional)}
        {--start=0           : Skip first N rows (0-based)}
        {--limit=0           : Process at most N rows (0 = all)}
        {--delay=100         : Delay between batches, ms}
        {--concurrency=10    : Number of concurrent HTTP requests}
        {--dry-run           : Don\'t write to DB, just print what would happen}';

    protected $description = 'Crawls Horoshop product pages and fills wgt_catalog_products.horoshop_id.';

    public function handle(): int
    {
        $site = $this->resolveSite((string) $this->argument('site'));

        $filePath = $this->argument('file');
        $start = (int) $this->option('start');
        $limit = (int) $this->option('limit');
        $delay = max(0, (int) $this->option('delay'));
        $concurrency = max(1, (int) $this->option('concurrency'));
        $dryRun = (bool) $this->option('dry-run');

        // Determine source: file-based or database-based.
        if ($filePath !== null) {
            $filePath = (string) $filePath;
            if (! file_exists($filePath)) {
                $this->error("File not found: {$filePath}");

                return self::FAILURE;
            }

            $rows = $this->collectRowsFromFile($filePath, $start, $limit);
            $source = "file: {$filePath}";
        } else {
            $rows = $this->collectRowsFromCatalog($site, $start, $limit);
            $source = 'database catalog';
        }

        if ($rows === []) {
            $this->warn('No rows to process.');

            return self::SUCCESS;
        }

        $this->info(sprintf(
            'Site: %s | Rows: %d (start=%d, limit=%d) | Source: %s | Concurrency: %d%s',
            $site->domain ?? $site->site_key,
            count($rows),
            $start,
            $limit,
            $source,
            $concurrency,
            $dryRun ? ' | DRY RUN' : '',
        ));

        $bar = $this->output->createProgressBar(count($rows));
        $bar->start();

        $stats = ['saved' => 0, 'no_id' => 0, 'no_product' => 0, 'errors' => 0];

        // Process rows in batches using concurrent HTTP requests.
        $batches = array_chunk($rows, $concurrency);
        foreach ($batches as $batchIndex => $batch) {
            $results = $this->fetchBatch($site, $batch);

            foreach ($batch as $rowIndex => $row) {
                $alias = $row->alias ?? $row['alias'];
                $result = $results[$alias] ?? null;

                // Resolve product (from XLSX mode, need to look up; from DB mode, already have it).
                if (is_array($row)) {
                    // Database mode: $row is array{alias: string, product: CatalogProduct}
                    $product = $row['product'];
                } else {
                    // File mode: $row is AliasSkuRow, need to query by alias.
                    $product = CatalogProduct::query()
                        ->where('site_id', $site->id)
                        ->where('alias', $alias)
                        ->first();
                }

                if ($product === null) {
                    $stats['no_product']++;
                    $sku = $row->sku ?? 'N/A';
                    $this->warnRow("Alias not in catalog: {$alias} (sku={$sku})");
                    $bar->advance();
                    continue;
                }

                if ($result === null) {
                    $stats['no_id']++;
                    $this->warnRow("ID NOT FOUND on page: {$alias}");
                    $bar->advance();
                    continue;
                }

                if ($result instanceof Throwable) {
                    $stats['errors']++;
                    $this->warnRow("FETCH ERROR {$alias}: {$result->getMessage()}");
                    $bar->advance();
                    continue;
                }

                if (! $dryRun) {
                    $product->forceFill(['horoshop_id' => (int) $result])->save();
                }

                $stats['saved']++;
                $bar->advance();
            }

            // Sleep between batches (except after the last one).
            if ($delay > 0 && $batchIndex < count($batches) - 1) {
                usleep($delay * 1000);
            }
        }

        $bar->finish();
        $this->newLine();
        $this->info(sprintf(
            'Done. saved=%d no_id=%d no_product=%d errors=%d%s',
            $stats['saved'],
            $stats['no_id'],
            $stats['no_product'],
            $stats['errors'],
            $dryRun ? ' (dry-run, nothing written)' : '',
        ));

        return self::SUCCESS;
    }

    private function resolveSite(string $arg): Site
    {
        $site = Site::query()->where('domain', $arg)->first()
            ?? Site::query()->where('site_key', $arg)->first();

        if ($site === null) {
            throw new SiteNotFoundException("Site not found: {$arg}");
        }

        if (! $site->domain) {
            throw new SiteNotFoundException("Site {$arg} has no domain configured.");
        }

        return $site;
    }

    /**
     * Reads XLSX rows and dedupes by alias (variants share the parent's page URL,
     * so one HTTP request per unique alias is enough).
     *
     * @return list<\App\WidgetRuntime\Services\Catalog\Horoshop\AliasSkuRow>
     */
    private function collectRowsFromFile(string $path, int $start, int $limit): array
    {
        $byAlias = [];
        foreach ((new XlsxAliasSkuReader($path))->read() as $row) {
            $byAlias[$row->alias] ??= $row;
        }

        $unique = array_values($byAlias);

        if ($limit > 0) {
            return array_slice($unique, $start, $limit);
        }

        return array_slice($unique, $start);
    }

    /**
     * Loads products from the catalog database for the given site.
     * Returns products with non-null, non-empty alias and null horoshop_id.
     *
     * @return list<array{alias: string, product: CatalogProduct}>
     */
    private function collectRowsFromCatalog(Site $site, int $start, int $limit): array
    {
        $query = CatalogProduct::query()
            ->where('site_id', $site->id)
            ->whereNotNull('alias')
            ->where('alias', '!=', '')
            ->whereNull('horoshop_id')
            ->orderBy('id');

        if ($limit > 0) {
            $query->limit($limit);
        }

        if ($start > 0) {
            $query->offset($start);
        }

        $products = $query->get();

        return $products->map(static fn (CatalogProduct $product) => [
            'alias' => $product->alias,
            'product' => $product,
        ])->toArray();
    }

    /**
     * Fetches a batch of URLs concurrently using Http::pool().
     *
     * @param list<\App\WidgetRuntime\Services\Catalog\Horoshop\AliasSkuRow|array{alias: string, product: CatalogProduct}> $batch
     *
     * @return array<string, string|null|Throwable>
     */
    private function fetchBatch(Site $site, array $batch): array
    {
        $results = [];

        try {
            $responses = Http::pool(function ($pool) use ($site, $batch, &$results): void {
                foreach ($batch as $row) {
                    $alias = $row->alias ?? $row['alias'];
                    $url = sprintf('https://%s/%s/', trim($site->domain, '/'), trim($alias, '/'));
                    $results[$alias] = ['url' => $url]; // Placeholder

                    $pool->timeout(self::TIMEOUT_SECONDS)
                        ->withHeaders(['User-Agent' => self::USER_AGENT])
                        ->get($url);
                }
            });

            $aliasIndex = 0;
            foreach ($batch as $row) {
                $alias = $row->alias ?? $row['alias'];
                $response = $responses[$aliasIndex] ?? null;
                $aliasIndex++;

                if ($response === null) {
                    $results[$alias] = null;
                    continue;
                }

                try {
                    if (! $response->successful()) {
                        $results[$alias] = new HoroshopProductIdFetchException(
                            "HTTP {$response->status()} for {$results[$alias]['url']}"
                        );
                        continue;
                    }

                    if (preg_match(self::ID_REGEX, $response->body(), $m) !== 1) {
                        $results[$alias] = null;
                        continue;
                    }

                    $results[$alias] = $m[1];
                } catch (Throwable $e) {
                    $results[$alias] = new HoroshopProductIdFetchException(
                        "HTTP error for {$results[$alias]['url']}: {$e->getMessage()}",
                        0,
                        $e
                    );
                }
            }
        } catch (Throwable $e) {
            // If pool itself fails, mark all as errors.
            foreach ($batch as $row) {
                $alias = $row->alias ?? $row['alias'];
                $results[$alias] = new HoroshopProductIdFetchException("Pool error: {$e->getMessage()}", 0, $e);
            }
        }

        return $results;
    }

    private function warnRow(string $message): void
    {
        $this->newLine();
        $this->warn("  {$message}");
    }
}
