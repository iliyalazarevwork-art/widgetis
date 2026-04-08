<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Resources\Api\V1\ProductDetailResource;
use App\Http\Resources\Api\V1\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::active()->with('tag');

        if ($request->filled('platform')) {
            $query->forPlatform($request->input('platform'));
        }

        if ($request->filled('tag')) {
            $query->byTag($request->input('tag'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $locale = $this->locale();
            $query->where(function ($q) use ($search, $locale) {
                $q->whereRaw('name->>? ILIKE ?', [$locale, "%{$search}%"])
                  ->orWhereRaw('description->>? ILIKE ?', [$locale, "%{$search}%"]);
            });
        }

        $sort = $request->input('sort', 'default');
        $query = match ($sort) {
            'popular' => $query->orderByDesc('is_popular')->orderBy('sort_order'),
            'new' => $query->orderByDesc('is_new')->orderBy('sort_order'),
            default => $query->orderBy('sort_order'),
        };

        $perPage = min((int) $request->input('per_page', 12), 50);
        $paginator = $query->paginate($perPage);

        return $this->paginated(
            $paginator,
            ['data' => ProductResource::collection($paginator->items())],
        );
    }

    public function show(string $slug): JsonResponse
    {
        $product = Product::active()
            ->with('tag')
            ->where('slug', $slug)
            ->firstOrFail();

        return $this->success([
            'data' => new ProductDetailResource($product),
        ]);
    }
}
