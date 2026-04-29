<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Widget\CartRecommender\Composer;

use App\WidgetRuntime\Models\CatalogProduct;
use Illuminate\Support\Facades\DB;
use Psr\Log\LoggerInterface;

final class CandidateRetriever
{
    public function __construct(
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * Retrieve candidate products for the given source product.
     *
     * Applies the following filters:
     * - Same site, not the source product
     * - In stock and already AI-tagged
     * - Price band (if source has a price)
     * - Complement semantic filter on ai_tags (PostgreSQL only)
     * - Ordered by vector cosine distance (if embedding exists) or RANDOM() on pgsql; ID order on sqlite
     *
     * @return list<CatalogProduct>
     */
    public function retrieve(CatalogProduct $source, int $limit): array
    {
        $connectionName = $source->getConnectionName() ?? 'pgsql_runtime';
        $driver         = DB::connection($connectionName)->getDriverName();
        $isPgsql        = $driver === 'pgsql';

        $query = CatalogProduct::on($connectionName)
            ->where('site_id', $source->site_id)
            ->where('id', '!=', $source->id)
            ->purchasableForWidget()
            ->whereNotNull('ai_tagged_at');

        // Price band filter (only when source has a meaningful price)
        $sourcePrice = (float) ($source->price ?? 0);
        if ($sourcePrice > 0) {
            $priceMin = $sourcePrice * (float) config('recommender.composer.price_min_ratio', 0.3);
            $priceMax = $sourcePrice * (float) config('recommender.composer.price_max_ratio', 1.5);
            $query->whereBetween('price', [$priceMin, $priceMax]);
        }

        /** @var array<string, mixed> $aiTags */
        $aiTags         = is_array($source->ai_tags) ? $source->ai_tags : [];
        $rawComplements = $aiTags['complements'] ?? [];
        $primaryType    = is_string($aiTags['primary_type'] ?? null) ? $aiTags['primary_type'] : '';

        if ($primaryType !== '') {
            $this->excludeSamePrimaryType($query, $driver, $primaryType);
        }

        // Complement semantic filter — PostgreSQL JSONB only
        if ($isPgsql) {
            $complements = [];
            if (is_array($rawComplements)) {
                /** @var mixed $type */
                foreach ($rawComplements as $type) {
                    if (is_string($type) && $type !== '' && $type !== $primaryType) {
                        $complements[] = $type;
                    }
                }
            }

            $hasComplements = count($complements) > 0;
            $hasPrimaryType = $primaryType !== '';

            if ($hasComplements || $hasPrimaryType) {
                $query->where(function ($q) use ($complements, $primaryType, $hasComplements, $hasPrimaryType): void {
                    if ($hasComplements) {
                        // candidate.primary_type is one of source.complements
                        $q->orWhereRaw(
                            "(ai_tags->>'primary_type') = ANY (SELECT jsonb_array_elements_text(?::jsonb))",
                            [json_encode($complements)],
                        );
                    }

                    if ($hasPrimaryType) {
                        // source.primary_type appears in candidate.complements array
                        $q->orWhereRaw(
                            "ai_tags->'complements' @> to_jsonb(?::text)",
                            [$primaryType],
                        );
                    }
                });
            }
        }

        // Ordering: prefer cosine distance when embedding available; otherwise RANDOM() on pgsql
        if ($isPgsql) {
            // Check if source has an embedding
            $hasEmbedding = (bool) DB::connection($connectionName)
                ->selectOne('SELECT (embedding IS NOT NULL) AS has_emb FROM wgt_catalog_products WHERE id = ?', [$source->id])
                ?->has_emb;

            if ($hasEmbedding) {
                $query->whereRaw('embedding IS NOT NULL')
                    ->orderByRaw('embedding <=> (SELECT embedding FROM wgt_catalog_products WHERE id = ?)', [$source->id]);
            } else {
                $query->orderByRaw('RANDOM()');
            }
        }
        // SQLite (test env): default implicit ID ordering — no extra clause needed

        $results = $query->limit($limit)->get()->all();

        $this->logger->debug('CandidateRetriever: retrieved candidates', [
            'source_product_id' => $source->id,
            'site_id'           => $source->site_id,
            'count'             => count($results),
        ]);

        return $results;
    }

    /**
     * @param \Illuminate\Database\Eloquent\Builder<CatalogProduct> $query
     */
    private function excludeSamePrimaryType(\Illuminate\Database\Eloquent\Builder $query, string $driver, string $primaryType): void
    {
        if ($driver === 'pgsql') {
            $query->whereRaw(
                "((ai_tags->>'primary_type') IS NULL OR (ai_tags->>'primary_type') <> ?)",
                [$primaryType],
            );

            return;
        }

        if ($driver === 'sqlite') {
            $query->whereRaw(
                "(json_extract(ai_tags, '$.primary_type') IS NULL OR json_extract(ai_tags, '$.primary_type') <> ?)",
                [$primaryType],
            );
        }
    }
}
