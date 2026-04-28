<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Catalog\Tagging;

use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Services\Catalog\Exceptions\TaggerException;
use App\WidgetRuntime\Services\Catalog\Exceptions\TaggerRefusalException;
use Illuminate\Support\Facades\DB;
use OpenAI\Contracts\ClientContract;
use OpenAI\Exceptions\ErrorException;
use OpenAI\Exceptions\TransporterException;
use Psr\Log\LoggerInterface;

final class AiTaggerService
{
    public function __construct(
        private readonly ClientContract $openai,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * Tag a single product and return the tags array.
     * Retries on transient errors up to config('recommender.tagging.max_retries').
     *
     * @return array<string, mixed>
     *
     * @throws TaggerRefusalException
     * @throws TaggerException
     */
    public function tag(CatalogProduct $product, VerticalDictionary $vertical): array
    {
        $promptBuilder = new TaggerPromptBuilder($vertical);
        $maxRetries    = (int) config('recommender.tagging.max_retries', 3);
        $model         = (string) config('recommender.models.tagger', 'gpt-4o-mini');
        $attempt       = 0;
        $lastException = null;

        while ($attempt <= $maxRetries) {
            try {
                $response = $this->openai->chat()->create([
                    'model'           => $model,
                    'temperature'     => 0,
                    'max_tokens'      => 500,
                    'response_format' => [
                        'type'        => 'json_schema',
                        'json_schema' => $vertical->toJsonSchema(),
                    ],
                    'messages' => [
                        [
                            'role'    => 'system',
                            'content' => $promptBuilder->systemMessage(),
                        ],
                        [
                            'role'    => 'user',
                            'content' => $promptBuilder->userMessage($product),
                        ],
                    ],
                ]);

                $choice = $response->choices[0];

                $content = $choice->message->content ?? '';

                // Structured-output refusals surface as finish_reason='content_filter'
                // and empty content (null coalesced to '').
                if ($content === '') {
                    $finishReason = $choice->finishReason ?? '';
                    throw new TaggerRefusalException(
                        "Model refused to tag product #{$product->id} (finish_reason={$finishReason})",
                    );
                }

                /** @var array<string, mixed>|null $tags */
                $tags = json_decode($content, true);

                if (! is_array($tags)) {
                    throw new TaggerException("Invalid JSON in OpenAI response for product #{$product->id}: {$content}");
                }

                return $tags;

            } catch (TaggerRefusalException $e) {
                throw $e;
            } catch (TaggerException $e) {
                throw $e;
            } catch (ErrorException $e) {
                $statusCode = $e->getStatusCode();

                // Non-retryable 4xx (except 429 rate limit)
                if ($statusCode >= 400 && $statusCode < 500 && $statusCode !== 429) {
                    throw new TaggerException(
                        "Non-retryable OpenAI error for product #{$product->id}: {$e->getMessage()}",
                        previous: $e,
                    );
                }

                // Retryable: rate limit (429) or server error (5xx)
                $lastException = $e;
                $attempt++;

                $this->logger->warning('AiTaggerService: transient error, retrying', [
                    'product_id' => $product->id,
                    'attempt'    => $attempt,
                    'status'     => $statusCode,
                    'message'    => $e->getMessage(),
                ]);

                if ($attempt > $maxRetries) {
                    break;
                }

                // Exponential backoff: 1s, 2s, 4s
                sleep(2 ** ($attempt - 1));

                continue;
            } catch (TransporterException $e) {
                // Network / connection errors — retryable
                $lastException = $e;
                $attempt++;

                $this->logger->warning('AiTaggerService: network error, retrying', [
                    'product_id' => $product->id,
                    'attempt'    => $attempt,
                    'message'    => $e->getMessage(),
                ]);

                if ($attempt > $maxRetries) {
                    break;
                }

                sleep(2 ** ($attempt - 1));

                continue;
            }
        }

        throw new TaggerException(
            "Failed to tag product #{$product->id} after {$maxRetries} retries",
            previous: $lastException instanceof \Throwable ? $lastException : null,
        );
    }

    /**
     * Tag a product and persist the result.
     * Clears embedded_at because embedding text depends on tags.
     */
    public function tagAndSave(CatalogProduct $product, VerticalDictionary $vertical): void
    {
        $tags = $this->tag($product, $vertical);

        $product->forceFill([
            'ai_tags'      => $tags,
            'ai_tagged_at' => now(),
            'embedded_at'  => null,
        ])->save();

        $connectionName = $product->getConnectionName();

        if (DB::connection($connectionName)->getDriverName() === 'pgsql') {
            DB::connection($connectionName)
                ->table('wgt_catalog_products')
                ->where('id', $product->id)
                ->update(['embedding' => null]);
        }
    }
}
