<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Jobs;

use App\WidgetRuntime\Enums\CatalogVertical;
use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Services\Catalog\Tagging\AiTaggerService;
use App\WidgetRuntime\Services\Catalog\Tagging\VerticalDictionary;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class TagCatalogProductJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 8;

    /** @var list<int> */
    public array $backoff = [10, 30, 60, 120, 180, 300, 300];

    public function __construct(
        public readonly int $productId,
        public readonly CatalogVertical $vertical,
    ) {
    }

    public function handle(AiTaggerService $tagger): void
    {
        $product = CatalogProduct::query()->find($this->productId);

        if ($product === null) {
            return;
        }

        $dict = VerticalDictionary::for($this->vertical);

        $tagger->tagAndSave($product, $dict);
    }
}
