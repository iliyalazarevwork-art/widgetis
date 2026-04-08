<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Api\V1\BaseController;
use App\Models\CustomerCase;
use Illuminate\Http\JsonResponse;

class CaseController extends BaseController
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
                'platform' => $c->platform,
                'description' => $c->translated('description'),
                'review_rating' => $c->review_rating,
                'widgets' => $c->widgets,
            ]);

        return $this->success(['data' => $cases]);
    }
}
