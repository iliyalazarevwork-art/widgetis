<?php

declare(strict_types=1);

namespace App\Core\Http\Controllers\Api\V1\Public;

use App\Core\Http\Controllers\Api\V1\CoreBaseController;
use App\Core\Models\FaqItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FaqController extends CoreBaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = FaqItem::published()->orderBy('sort_order');

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        $items = $query->get()->map(fn (FaqItem $f) => [
            'id' => $f->id,
            'category' => $f->category,
            'question' => $f->translated('question'),
            'answer' => $f->translated('answer'),
        ]);

        return $this->success(['data' => $items]);
    }
}
