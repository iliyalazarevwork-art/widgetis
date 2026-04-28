<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Console\Commands\Catalog;

use App\WidgetRuntime\Enums\CatalogVertical;
use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Services\Catalog\Exceptions\SiteNotFoundException;
use App\WidgetRuntime\Services\Catalog\Tagging\AiTaggerService;
use App\WidgetRuntime\Services\Catalog\Tagging\BatchAiTagger;
use App\WidgetRuntime\Services\Catalog\Tagging\VerticalDictionary;
use Illuminate\Console\Command;

final class TagCommand extends Command
{
    protected $signature = 'catalog:tag
        {site : Site domain or site_key}
        {--limit= : Maximum number of products to process}
        {--force : Re-tag all products, not just untagged ones}
        {--sync : Run synchronously instead of dispatching to queue}';

    protected $description = 'Tag catalog products with AI structured tags.';

    public function handle(AiTaggerService $tagger, BatchAiTagger $batchTagger): int
    {
        $siteArg = (string) $this->argument('site');

        $site = Site::query()->where('domain', $siteArg)->first()
            ?? Site::query()->where('site_key', $siteArg)->first();

        if ($site === null) {
            throw new SiteNotFoundException("Site not found: {$siteArg}");
        }

        $limit = $this->option('limit') !== null ? (int) $this->option('limit') : null;
        $force = (bool) $this->option('force');

        if ($this->option('sync')) {
            return $this->runSync($site, $tagger, $limit, $force);
        }

        $count = $batchTagger->dispatchForSite($site, $limit, $force);

        $this->info("Dispatched {$count} tagging jobs.");

        return self::SUCCESS;
    }

    private function runSync(Site $site, AiTaggerService $tagger, ?int $limit, bool $force): int
    {
        $query = CatalogProduct::query()->where('site_id', $site->getKey());

        if (! $force) {
            $query->needingTagging();
        }

        if ($limit !== null) {
            $query->limit($limit);
        }

        $raw = $site->recommender_vertical;
        $vertical = VerticalDictionary::for(
            $raw instanceof CatalogVertical
                ? $raw
                : (CatalogVertical::tryFrom((string) $raw) ?? CatalogVertical::Generic),
        );

        $total = (clone $query)->count();

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $count = 0;

        foreach ($query->lazy() as $product) {
            /** @var CatalogProduct $product */
            $tagger->tagAndSave($product, $vertical);
            $bar->advance();
            $count++;
        }

        $bar->finish();
        $this->newLine();
        $this->info("Tagged {$count} products.");

        return self::SUCCESS;
    }
}
