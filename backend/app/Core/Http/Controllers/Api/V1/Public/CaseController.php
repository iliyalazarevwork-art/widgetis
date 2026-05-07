<?php

declare(strict_types=1);

namespace App\Core\Http\Controllers\Api\V1\Public;

use App\Core\Http\Controllers\Api\V1\CoreBaseController;
use App\Core\Models\CustomerCase;
use App\Core\Models\Product;
use Illuminate\Http\JsonResponse;

class CaseController extends CoreBaseController
{
    public function index(): JsonResponse
    {
        $casesRaw = CustomerCase::where('is_published', true)->get();

        $cases = $casesRaw->sortBy(function (CustomerCase $c): array {
            return [
                -$this->completenessScore($c),
                -(float) ($c->review_rating ?? 0),
                $c->sort_order,
            ];
        })->values();

        $allSlugs = collect($cases)
            ->flatMap(fn (CustomerCase $c) => $this->normalizeSlugs($c->widgets))
            ->unique()
            ->values()
            ->all();

        $products = Product::query()
            ->whereIn('slug', $allSlugs)
            ->get()
            ->keyBy('slug');

        $data = $cases->map(fn (CustomerCase $c) => [
            'id' => $c->id,
            'store' => $c->store,
            'store_url' => $c->store_url,
            'store_logo_url' => $c->store_logo_url,
            'owner' => $c->owner,
            'platform' => $c->platform,
            'plan' => $c->plan,
            'description' => $c->translated('description'),
            'review_text' => $c->review_text,
            'review_rating' => $c->review_rating,
            'result_metric' => $c->result_metric,
            'result_period' => $c->result_period,
            'color' => $c->color,
            'widgets' => array_values(array_filter(array_map(
                static function (string $slug) use ($products): ?array {
                    $product = $products->get($slug);
                    if ($product === null) {
                        return null;
                    }

                    return ['name' => $product->translated('name'), 'slug' => $slug];
                },
                $this->normalizeSlugs($c->widgets),
            ))),
        ]);

        return $this->success(['data' => $data]);
    }

    private function completenessScore(CustomerCase $c): int
    {
        $score = 0;
        if ($c->result_metric !== null && $c->result_metric !== '') {
            $score += 3;
        }
        if ($c->review_text !== null && $c->review_text !== '') {
            $score += 2;
        }
        if (count($this->normalizeSlugs($c->widgets)) > 0) {
            $score += 1;
        }

        return $score;
    }

    /**
     * Accepts both legacy `[{name, slug}]` and new `[slug, ...]` shapes.
     *
     * @param  array<int, mixed>|null  $widgets
     * @return list<string>
     */
    private function normalizeSlugs(?array $widgets): array
    {
        if ($widgets === null) {
            return [];
        }

        $slugs = [];
        foreach ($widgets as $w) {
            if (is_string($w) && $w !== '') {
                $slugs[] = $w;
            } elseif (is_array($w) && isset($w['slug']) && is_string($w['slug']) && $w['slug'] !== '') {
                $slugs[] = $w['slug'];
            }
        }

        return $slugs;
    }
}
