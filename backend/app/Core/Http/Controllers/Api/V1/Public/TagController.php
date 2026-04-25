<?php

declare(strict_types=1);

namespace App\Core\Http\Controllers\Api\V1\Public;

use App\Core\Http\Resources\Api\V1\WidgetTagResource;
use App\Core\Models\WidgetTag;
use App\Http\Controllers\Api\V1\BaseController;
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
