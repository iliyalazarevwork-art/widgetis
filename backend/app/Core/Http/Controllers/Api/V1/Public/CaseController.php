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
        $cases = CustomerCase::where('is_published', true)
            ->orderByRaw("(CASE WHEN result_metric IS NOT NULL AND result_metric != '' THEN 3 ELSE 0 END + CASE WHEN review_text IS NOT NULL AND review_text != '' THEN 2 ELSE 0 END + CASE WHEN widgets IS NOT NULL AND jsonb_array_length(widgets) > 0 THEN 1 ELSE 0 END) DESC")
            ->orderByRaw('review_rating DESC NULLS LAST')
            ->orderBy('sort_order')
            ->get();

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
