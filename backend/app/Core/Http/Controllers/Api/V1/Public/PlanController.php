<?php

declare(strict_types=1);

namespace App\Core\Http\Controllers\Api\V1\Public;

use App\Core\Http\Controllers\Api\V1\CoreBaseController;
use App\Core\Http\Resources\Api\V1\PlanResource;
use App\Core\Models\Plan;
use App\Core\Models\PlanFeature;
use Illuminate\Http\JsonResponse;

class PlanController extends CoreBaseController
{
    public function index(): JsonResponse
    {
        $plans = Plan::active()->with('products')->orderBy('sort_order')->get();

        return $this->success([
            'data' => PlanResource::collection($plans),
        ]);
    }

    public function features(): JsonResponse
    {
        $plans = Plan::active()->orderBy('sort_order')->get();
        $features = PlanFeature::with(['values.plan'])
            ->orderBy('sort_order')
            ->get();

        $matrix = $features->map(function (PlanFeature $feature) use ($plans) {
            $row = [
                'key' => $feature->feature_key,
                'name' => $feature->translated('name'),
                'category' => $feature->category,
                'plans' => [],
            ];

            foreach ($plans as $plan) {
                $value = $feature->values->firstWhere('plan_id', $plan->id);
                $row['plans'][$plan->slug] = $value?->value;
            }

            return $row;
        });

        return $this->success(['data' => $matrix]);
    }
}
