<?php

declare(strict_types=1);

namespace App\Core\Http\Controllers\Api\V1\Public;

use App\Core\Models\FaqItem;
use App\Http\Controllers\Api\V1\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FaqController extends BaseController
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
