<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Resources\Api\V1\WidgetTagResource;
use App\Models\WidgetTag;
use Illuminate\Http\JsonResponse;

class TagController extends BaseController
{
    public function index(): JsonResponse
    {
        $tags = WidgetTag::orderBy('sort_order')->get();

        return $this->success([
            'data' => WidgetTagResource::collection($tags),
        ]);
    }
}
