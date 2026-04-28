<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseController;
use App\WidgetRuntime\Http\Requests\Admin\OnePlusOne\StorePromoRequest;
use App\WidgetRuntime\Http\Requests\Admin\OnePlusOne\UpdatePromoRequest;
use App\WidgetRuntime\Models\OnePlusOnePromo;
use App\WidgetRuntime\Services\Widget\OnePlusOne\CatalogReaderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class OnePlusOnePromoController extends BaseController
{
    public function __construct(
        private readonly CatalogReaderService $catalogReader,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 20), 100);
        $promos = OnePlusOnePromo::query()
            ->with('site:id,domain,name')
            ->orderByDesc('updated_at')
            ->paginate($perPage);

        return $this->paginated($promos);
    }

    public function show(string $id): JsonResponse
    {
        $promo = OnePlusOnePromo::query()->with('site:id,domain,name')->findOrFail($id);

        return $this->success($promo);
    }

    public function store(StorePromoRequest $request): JsonResponse
    {
        $promo = OnePlusOnePromo::create($request->validated());

        return $this->created($promo);
    }

    public function update(UpdatePromoRequest $request, string $id): JsonResponse
    {
        $promo = OnePlusOnePromo::query()->findOrFail($id);
        $promo->update($request->validated());

        return $this->success($promo->fresh());
    }

    public function destroy(string $id): JsonResponse
    {
        $promo = OnePlusOnePromo::query()->findOrFail($id);
        $this->catalogReader->clearCache((string) $promo->site_id);
        $promo->delete();

        return $this->noContent();
    }

    /**
     * Force-refresh the cached catalog and rebuild the product_map / article_categories
     * from the catalog by article suffix.
     */
    public function rebuildMap(string $id): JsonResponse
    {
        $promo = OnePlusOnePromo::query()->findOrFail($id);

        $this->catalogReader->clearCache((string) $promo->site_id);

        $catalog = $this->catalogReader->getCatalog(
            (string) $promo->site_id,
            $promo->catalog_url,
            $promo->catalog_format,
        );

        $built = $this->catalogReader->buildProductMap($catalog, $promo->article_suffix);

        $promo->update([
            'product_map'        => $built['product_map'],
            'article_categories' => $built['article_categories'],
        ]);

        return $this->success([
            'pairs_found'    => count($built['product_map']),
            'total_products' => count($catalog),
            'promo'          => $promo->fresh(),
        ]);
    }

    public function clearCache(string $id): JsonResponse
    {
        $promo = OnePlusOnePromo::query()->findOrFail($id);
        $this->catalogReader->clearCache((string) $promo->site_id);

        return $this->success(['ok' => true]);
    }
}
