<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Catalog\Tagging;

use App\WidgetRuntime\Enums\CatalogVertical;
use App\WidgetRuntime\Jobs\TagCatalogProductJob;
use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Models\Site;
use Illuminate\Contracts\Bus\Dispatcher;

final class BatchAiTagger
{
    public function __construct(private readonly Dispatcher $bus)
    {
    }

    /**
     * Dispatch tagging jobs for all (or untagged) products of the given site.
     * Returns the count of dispatched jobs.
     */
    public function dispatchForSite(Site $site, ?int $limit = null, bool $force = false): int
    {
        $query = CatalogProduct::query()->where('site_id', $site->getKey());

        if (! $force) {
            $query->needingTagging();
        }

        if ($limit !== null) {
            $query->limit($limit);
        }

        $vertical = $this->resolveVertical($site);

        $count = 0;

        foreach ($query->lazy() as $product) {
            /** @var CatalogProduct $product */
            $this->bus->dispatch(new TagCatalogProductJob($product->id, $vertical));
            $count++;
        }

        return $count;
    }

    private function resolveVertical(Site $site): CatalogVertical
    {
        $raw = $site->recommender_vertical;

        if ($raw instanceof CatalogVertical) {
            return $raw;
        }

        return CatalogVertical::tryFrom((string) $raw) ?? CatalogVertical::Generic;
    }
}
