<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Jobs;

use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Services\Catalog\Embedding\EmbeddingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class EmbedCatalogProductBatchJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public int $backoff = 5;

    /**
     * @param  list<int>  $productIds
     */
    public function __construct(public readonly array $productIds)
    {
    }

    public function handle(EmbeddingService $svc): void
    {
        /** @var list<CatalogProduct> $products */
        $products = CatalogProduct::query()
            ->whereIn('id', $this->productIds)
            ->get()
            ->all();

        if (count($products) === 0) {
            return;
        }

        $svc->embedBatch($products);
    }
}
