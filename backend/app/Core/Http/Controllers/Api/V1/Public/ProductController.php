<?php

declare(strict_types=1);

namespace App\Core\Http\Controllers\Api\V1\Public;

use App\Core\Enums\Widget\WidgetSlug;
use App\Core\Http\Controllers\Api\V1\CoreBaseController;
use App\Core\Http\Resources\Api\V1\ProductDetailResource;
use App\Core\Http\Resources\Api\V1\ProductResource;
use App\Core\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class ProductController extends CoreBaseController
{
    private const WIDGETS_PAGE_SEQUENCE = [
        WidgetSlug::PhotoVideoReviews->value,
        WidgetSlug::CartRecommender->value,
        WidgetSlug::ProgressiveDiscount->value,
        WidgetSlug::VideoPreview->value,
        WidgetSlug::StickyBuyButton->value,
        WidgetSlug::DeliveryDate->value,
        WidgetSlug::PromoLine->value,
        WidgetSlug::OnePlusOne->value,
    ];

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
        $perPage = min((int) $request->input('per_page', 50), 50);
        $page = max((int) $request->input('page', 1), 1);

        if ($sort === 'widgets-page') {
            $products = $query->orderBy('sort_order')->get();
            $ordered = $this->orderForWidgetsPage($products);
            $paginator = $this->paginateCollection($ordered, $perPage, $page, $request);

            return $this->paginated(
                $paginator,
                ['data' => ProductResource::collection($paginator->items())],
            );
        }

        $query = match ($sort) {
            'popular' => $query->orderByDesc('is_popular')->orderBy('sort_order'),
            'new' => $query->orderByDesc('is_new')->orderBy('sort_order'),
            default => $query->orderBy('sort_order'),
        };

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

    /**
     * @param Collection<int, Product> $products
     * @return Collection<int, Product>
     */
    private function orderForWidgetsPage(Collection $products): Collection
    {
        $bySlug = $products->keyBy('slug');
        $pinned = collect(self::WIDGETS_PAGE_SEQUENCE)
            ->map(fn (string $slug): ?Product => $bySlug->get($slug))
            ->filter();

        $pinnedSlugs = $pinned->pluck('slug')->all();
        $remaining = $products->reject(
            fn (Product $product): bool => in_array($product->slug, $pinnedSlugs, true),
        )->values();

        return $pinned->concat($remaining)->values();
    }

    /**
     * @param Collection<int, Product> $items
     * @return LengthAwarePaginator<int, Product>
     */
    private function paginateCollection(
        Collection $items,
        int $perPage,
        int $page,
        Request $request,
    ): LengthAwarePaginator {
        return new LengthAwarePaginator(
            $items->forPage($page, $perPage)->values()->all(),
            $items->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()],
        );
    }
}
