<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Console\Commands\Catalog;

use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Services\Catalog\CatalogImporter;
use App\WidgetRuntime\Services\Catalog\Exceptions\SiteNotFoundException;
use App\WidgetRuntime\Services\Catalog\Readers\XlsxCatalogReader;
use Illuminate\Console\Command;

final class ImportXlsxCommand extends Command
{
    protected $signature = 'catalog:import-xlsx
        {site : Site domain or site_key}
        {path : Absolute path to the .xlsx file}';

    protected $description = 'Import catalog snapshot from XLSX into wgt_catalog_products.';

    public function handle(CatalogImporter $importer): int
    {
        $siteArg = (string) $this->argument('site');
        $filePath = (string) $this->argument('path');

        // Use separate queries to avoid PostgreSQL casting the domain string as UUID
        // when both columns are compared in the same OR clause.
        $site = Site::query()->where('domain', $siteArg)->first()
            ?? Site::query()->where('site_key', $siteArg)->first();

        if ($site === null) {
            throw new SiteNotFoundException("Site not found: {$siteArg}");
        }

        if (! file_exists($filePath)) {
            $this->error("File not found: {$filePath}");

            return self::FAILURE;
        }

        $reader = new XlsxCatalogReader($filePath);

        $bar = $this->output->createProgressBar();
        $bar->setFormat('[%current%] %elapsed:6s% %memory:6s%');
        $bar->start();

        $result = $importer->import(
            $site,
            $reader,
            function (int $processed) use ($bar): void {
                $bar->setProgress($processed);
            },
        );

        $bar->finish();
        $this->newLine();

        $this->info(sprintf(
            'Done. inserted=%d updated=%d unchanged=%d skipped_variants=%d skipped_hidden=%d',
            $result->inserted,
            $result->updated,
            $result->unchanged,
            $result->skippedVariants,
            $result->skippedHidden,
        ));

        return self::SUCCESS;
    }
}
