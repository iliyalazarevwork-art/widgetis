<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Widget\CartRecommender\Composer;

use App\WidgetRuntime\Enums\CartRecommenderRelationSource;
use App\WidgetRuntime\Models\CartRecommenderRelation;
use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Services\Widget\CartRecommender\Exceptions\ComposerException;
use OpenAI\Contracts\ClientContract;
use Psr\Log\LoggerInterface;

final class OnDemandComposer implements ComposerInterface
{
    public function __construct(
        private readonly ClientContract $openai,
        private readonly CandidateRetriever $retriever,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * Compose top-N relations for a single source product.
     * Persists them in wgt_cart_recommender_relations and returns them.
     *
     * @return list<CartRecommenderRelation>
     *
     * @throws ComposerException
     */
    public function composeFor(CatalogProduct $source): array
    {
        $poolSize = (int) config('recommender.composer.candidate_pool_size', 50);
        $topN     = (int) config('recommender.composer.top_n', 4);

        $candidates = $this->retriever->retrieve($source, $poolSize);

        if (count($candidates) === 0) {
            $this->logger->info('OnDemandComposer: no candidates found, skipping composition', [
                'source_product_id' => $source->id,
                'site_id'           => $source->site_id,
            ]);

            return [];
        }

        // Trim candidate list for prompt budget (~3500 chars)
        $promptCandidates = array_slice($candidates, 0, 30);

        $model  = (string) config('recommender.models.composer', 'gpt-4o-mini');
        $schema = $this->buildJsonSchema(count($promptCandidates), $topN);

        $messages = [
            [
                'role'    => 'system',
                'content' => 'You are a professional stylist. Given a hero product and a numbered list of candidate products, pick the '
                    . $topN . ' that best COMPLETE THE LOOK with the hero. '
                    . 'Prefer complementary types over similar types. Match style and colour palette. '
                    . 'Provide a short rationale (one sentence) per pick in both Ukrainian and English.',
            ],
            [
                'role'    => 'user',
                'content' => $this->buildUserMessage($source, $promptCandidates),
            ],
        ];

        try {
            $response = $this->openai->chat()->create([
                'model'           => $model,
                'temperature'     => 0.3,
                'max_tokens'      => 600,
                'response_format' => [
                    'type'        => 'json_schema',
                    'json_schema' => $schema,
                ],
                'messages' => $messages,
            ]);
        } catch (\Throwable $e) {
            throw new ComposerException(
                "OnDemandComposer: OpenAI call failed for product #{$source->id}: {$e->getMessage()}",
                previous: $e,
            );
        }

        $content = $response->choices[0]->message->content ?? '';

        if ($content === '') {
            throw new ComposerException(
                "OnDemandComposer: empty response from OpenAI for product #{$source->id}",
            );
        }

        /** @var array<string, mixed>|null $parsed */
        $parsed = json_decode($content, true);

        if (! is_array($parsed) || ! isset($parsed['picks']) || ! is_array($parsed['picks'])) {
            throw new ComposerException(
                "OnDemandComposer: invalid JSON structure for product #{$source->id}: {$content}",
            );
        }

        /** @var list<array{index: int, rationale_ua: string, rationale_en: string}> $picks */
        $picks = array_values($parsed['picks']);

        $relations = [];
        $total     = count($picks);

        foreach ($picks as $idx => $pick) {
            $pickIndex = (int) ($pick['index'] ?? 0);

            if ($pickIndex < 1 || $pickIndex > count($promptCandidates)) {
                $this->logger->warning('OnDemandComposer: pick index out of range, skipping', [
                    'pick_index'        => $pickIndex,
                    'candidate_count'   => count($promptCandidates),
                    'source_product_id' => $source->id,
                ]);

                continue;
            }

            $candidate = $promptCandidates[$pickIndex - 1];
            $score     = $total > 1 ? 1.0 - ($idx / $total) : 1.0;

            $ttl = (int) config('recommender.cache.relations_ttl_seconds', 7 * 24 * 60 * 60);

            /** @var CartRecommenderRelation $relation */
            $relation = CartRecommenderRelation::on($source->getConnectionName() ?? 'pgsql_runtime')
                ->updateOrCreate(
                    [
                        'site_id'            => $source->site_id,
                        'source_product_id'  => $source->id,
                        'related_product_id' => $candidate->id,
                    ],
                    [
                        'score'        => $score,
                        'rationale_ua' => trim((string) ($pick['rationale_ua'] ?? '')),
                        'rationale_en' => trim((string) ($pick['rationale_en'] ?? '')),
                        'source'       => CartRecommenderRelationSource::LazyAi,
                        'computed_at'  => now(),
                        'expires_at'   => now()->addSeconds($ttl),
                    ],
                );

            $relation->setRelation('relatedProduct', $candidate);

            $relations[] = $relation;
        }

        $this->logger->info('OnDemandComposer: composed relations', [
            'source_product_id' => $source->id,
            'site_id'           => $source->site_id,
            'relations_count'   => count($relations),
        ]);

        return $relations;
    }

    /**
     * Build the OpenAI JSON schema for the picker response.
     *
     * @return array<string, mixed>
     */
    public function buildJsonSchema(int $candidateCount, int $topN): array
    {
        return [
            'name'   => 'cart_recommender_picks',
            'strict' => true,
            'schema' => [
                'type'                 => 'object',
                'additionalProperties' => false,
                'required'             => ['picks'],
                'properties'           => [
                    'picks' => [
                        'type'     => 'array',
                        'minItems' => 1,
                        'maxItems' => $topN,
                        'items'    => [
                            'type'                 => 'object',
                            'additionalProperties' => false,
                            'required'             => ['index', 'rationale_ua', 'rationale_en'],
                            'properties'           => [
                                'index' => [
                                    'type'    => 'integer',
                                    'minimum' => 1,
                                    'maximum' => $candidateCount,
                                ],
                                'rationale_ua' => [
                                    'type'      => 'string',
                                    'maxLength' => 240,
                                ],
                                'rationale_en' => [
                                    'type'      => 'string',
                                    'maxLength' => 240,
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];
    }

    /**
     * @param list<CatalogProduct> $candidates
     */
    private function buildUserMessage(CatalogProduct $source, array $candidates): string
    {
        $tags = $source->ai_tags ?? [];

        $heroTitle = $source->title_ua ?? $source->title_en ?? "Product #{$source->id}";

        $lines   = [];
        $lines[] = 'HERO PRODUCT:';
        $lines[] = "Title: {$heroTitle}";
        $lines[] = 'Price: ' . ($source->price ?? 'N/A');
        $lines[] = 'Primary type: ' . ($tags['primary_type'] ?? 'N/A');
        $lines[] = 'Role: ' . ($tags['role'] ?? 'N/A');
        $lines[] = 'Color family: ' . ($tags['color_family'] ?? 'N/A');
        $lines[] = 'Style: ' . (is_array($tags['style'] ?? null) ? implode(', ', $tags['style']) : ($tags['style'] ?? 'N/A'));
        $lines[] = '';
        $lines[] = 'CANDIDATES (pick the best ' . config('recommender.composer.top_n', 4) . ' to complete the look):';

        foreach ($candidates as $i => $product) {
            $pTags   = $product->ai_tags ?? [];
            $title   = $product->title_ua ?? $product->title_en ?? "Product #{$product->id}";
            $num     = $i + 1;
            $style   = is_array($pTags['style'] ?? null)
                ? implode(', ', $pTags['style'])
                : ($pTags['style'] ?? 'N/A');

            $lines[] = "{$num}. {$title} | price: " . ($product->price ?? 'N/A')
                . ' | type: ' . ($pTags['primary_type'] ?? 'N/A')
                . ' | role: ' . ($pTags['role'] ?? 'N/A')
                . ' | color: ' . ($pTags['color_family'] ?? 'N/A')
                . " | style: {$style}";
        }

        return implode("\n", $lines);
    }
}
