<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Console\Commands\Catalog;

use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Services\Catalog\Embedding\BatchEmbedder;
use App\WidgetRuntime\Services\Catalog\Embedding\EmbeddingService;
use App\WidgetRuntime\Services\Catalog\Exceptions\SiteNotFoundException;
use Illuminate\Console\Command;

final class EmbedCommand extends Command
{
    protected $signature = 'catalog:embed
        {site : Site domain or site_key}
        {--limit= : Maximum number of products to process}
        {--force : Re-embed all tagged products, not just those missing embeddings}
        {--sync : Run synchronously instead of dispatching to queue}';

    protected $description = 'Embed catalog products using OpenAI text-embedding-3-small.';

    public function handle(EmbeddingService $embedder, BatchEmbedder $batchEmbedder): int
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
            return $this->runSync($site, $embedder, $limit, $force);
        }

        $count = $batchEmbedder->dispatchForSite($site, $limit, $force);
        $batchSize = (int) config('recommender.embedding.batch_size', 100);

        $this->info("Dispatched {$count} products in batches of {$batchSize}.");

        return self::SUCCESS;
    }

    private function runSync(Site $site, EmbeddingService $embedder, ?int $limit, bool $force): int
    {
        $batchSize = (int) config('recommender.embedding.batch_size', 100);

        $query = CatalogProduct::query()->where('site_id', $site->getKey());

        if (! $force) {
            $query->needingEmbedding();
        } else {
            $query->whereNotNull('ai_tagged_at');
        }

        if ($limit !== null) {
            $query->limit($limit);
        }

        $total = (clone $query)->count();

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $count = 0;
        $batch = [];

        foreach ($query->lazy() as $product) {
            /** @var CatalogProduct $product */
            $batch[] = $product;
            $count++;

            if (count($batch) >= $batchSize) {
                $embedder->embedBatch($batch);
                $bar->advance(count($batch));
                $batch = [];
            }
        }

        if (count($batch) > 0) {
            $embedder->embedBatch($batch);
            $bar->advance(count($batch));
        }

        $bar->finish();
        $this->newLine();
        $this->info("Embedded {$count} products.");

        return self::SUCCESS;
    }
}
