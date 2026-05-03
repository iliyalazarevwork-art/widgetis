<?php

declare(strict_types=1);

namespace App\Core\Http\Controllers\Api\V1\Public;

use App\Core\Http\Controllers\Api\V1\CoreBaseController;
use App\Core\Http\Resources\Api\V1\WidgetTagResource;
use App\Core\Models\WidgetTag;
use App\Enums\ProductStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class TagController extends CoreBaseController
{
    public function index(): JsonResponse
    {
        /** @param Builder<\App\Core\Models\Product> $q */
        $onlyActive = static function (Builder $q): void {
            $q->where('status', ProductStatus::Active->value);
        };

        $tags = WidgetTag::withCount(['products as products_count' => $onlyActive])
            ->whereHas('products', $onlyActive)
            ->orderBy('sort_order')
            ->get();

        return $this->success([
            'data' => WidgetTagResource::collection($tags),
        ]);
    }
}
