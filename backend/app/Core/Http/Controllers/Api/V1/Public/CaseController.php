<?php

declare(strict_types=1);

namespace App\Core\Http\Controllers\Api\V1\Public;

use App\Core\Http\Controllers\Api\V1\CoreBaseController;
use App\Core\Models\CustomerCase;
use Illuminate\Http\JsonResponse;

class CaseController extends CoreBaseController
{
    public function index(): JsonResponse
    {
        $cases = CustomerCase::where('is_published', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (CustomerCase $c) => [
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
                'widgets' => array_map(
                    static fn (array $w) => ['name' => $w['name'], 'slug' => $w['slug'] ?? null],
                    $c->widgets ?? []
                ),
            ]);

        return $this->success(['data' => $cases]);
    }
}
