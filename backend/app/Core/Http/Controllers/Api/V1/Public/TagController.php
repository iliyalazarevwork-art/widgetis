<?php

declare(strict_types=1);

namespace App\Core\Http\Controllers\Api\V1\Public;

use App\Core\Http\Controllers\Api\V1\CoreBaseController;
use App\Core\Http\Resources\Api\V1\WidgetTagResource;
use App\Core\Models\WidgetTag;
use Illuminate\Http\JsonResponse;

class TagController extends CoreBaseController
{
    public function index(): JsonResponse
    {
        $tags = WidgetTag::withCount('products')->orderBy('sort_order')->get();

        return $this->success([
            'data' => WidgetTagResource::collection($tags),
        ]);
    }
}
