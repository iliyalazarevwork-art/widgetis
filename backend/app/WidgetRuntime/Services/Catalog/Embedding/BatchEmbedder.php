<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Catalog\Embedding;

use App\WidgetRuntime\Jobs\EmbedCatalogProductBatchJob;
use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Models\Site;
use Illuminate\Contracts\Bus\Dispatcher;

final class BatchEmbedder
{
    public function __construct(private readonly Dispatcher $bus)
    {
    }

    /**
     * Dispatch embedding jobs for all products needing embedding for the site.
     *
     * @return int Total number of products dispatched.
     */
    public function dispatchForSite(Site $site, ?int $limit = null, bool $force = false): int
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

        $count = 0;
        $batch = [];

        foreach ($query->lazy() as $product) {
            /** @var CatalogProduct $product */
            $batch[] = $product->id;
            $count++;

            if (count($batch) >= $batchSize) {
                $this->bus->dispatch(new EmbedCatalogProductBatchJob($batch));
                $batch = [];
            }
        }

        if (count($batch) > 0) {
            $this->bus->dispatch(new EmbedCatalogProductBatchJob($batch));
        }

        return $count;
    }
}
