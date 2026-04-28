<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Catalog\Embedding;

use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Services\Catalog\Exceptions\EmbeddingException;
use Illuminate\Support\Facades\DB;
use OpenAI\Contracts\ClientContract;
use OpenAI\Exceptions\ErrorException;
use OpenAI\Exceptions\TransporterException;
use Pgvector\Vector;
use Psr\Log\LoggerInterface;

final class EmbeddingService
{
    public function __construct(
        private readonly ClientContract $openai,
        private readonly EmbeddingTextBuilder $textBuilder,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * Embed a batch of products: one OpenAI call, then per-product DB update.
     *
     * @param  list<CatalogProduct>  $products
     *
     * @throws EmbeddingException
     */
    public function embedBatch(array $products): void
    {
        if (count($products) === 0) {
            return;
        }

        $inputs = array_map(
            fn (CatalogProduct $p): string => $this->textBuilder->build($p),
            $products,
        );

        try {
            $response = $this->openai->embeddings()->create([
                'model' => (string) config('recommender.models.embedding'),
                'input' => $inputs,
            ]);
        } catch (ErrorException $e) {
            $this->logger->error('EmbeddingService: OpenAI error', [
                'status'  => $e->getStatusCode(),
                'message' => $e->getMessage(),
            ]);

            throw new EmbeddingException(
                "OpenAI embedding request failed: {$e->getMessage()}",
                previous: $e,
            );
        } catch (TransporterException $e) {
            $this->logger->error('EmbeddingService: network error', [
                'message' => $e->getMessage(),
            ]);

            throw new EmbeddingException(
                "OpenAI embedding network failure: {$e->getMessage()}",
                previous: $e,
            );
        }

        foreach ($products as $i => $product) {
            /** @var array<int, float> $vector */
            $vector = $response->embeddings[$i]->embedding;
            $this->writeVector($product, $vector);
        }
    }

    /**
     * Convenience method to embed a single product.
     *
     * @throws EmbeddingException
     */
    public function embed(CatalogProduct $product): void
    {
        $this->embedBatch([$product]);
    }

    /**
     * @param  array<int, float>  $vector
     */
    private function writeVector(CatalogProduct $product, array $vector): void
    {
        $driver = DB::connection('pgsql_runtime')->getDriverName();

        if ($driver !== 'pgsql') {
            // SQLite test path: just stamp embedded_at, skip the vector write.
            $product->forceFill(['embedded_at' => now()])->save();

            return;
        }

        DB::connection('pgsql_runtime')
            ->table('wgt_catalog_products')
            ->where('id', $product->id)
            ->update([
                'embedding'   => new Vector($vector),
                'embedded_at' => now(),
            ]);
    }
}
