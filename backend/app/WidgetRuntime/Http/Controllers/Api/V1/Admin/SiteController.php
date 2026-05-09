<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseController;
use App\WidgetRuntime\Jobs\RebuildSiteScriptJob;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Models\SiteWidget;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SiteController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = Site::with(['script'])
            ->orderByDesc('created_at');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('domain', 'like', "%{$search}%")
                  ->orWhere('user_id', function ($sub) use ($search) {
                      $sub->select('id')
                          ->from('users')
                          ->where('email', 'like', "%{$search}%")
                          ->limit(1);
                  });
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $sites = $query->paginate($perPage);

        // Fetch user data for all site owners in one query
        $userIds = collect($sites->items())->pluck('user_id')->unique()->values()->all();
        $users = DB::table('users')
            ->whereIn('id', $userIds)
            ->get(['id', 'email', 'name'])
            ->keyBy('id');

        // Fetch active subscription plan slugs for those users
        $planSlugs = DB::table('subscriptions')
            ->join('plans', 'subscriptions.plan_id', '=', 'plans.id')
            ->whereIn('subscriptions.user_id', $userIds)
            ->whereIn('subscriptions.status', ['active', 'trial'])
            ->pluck('plans.slug', 'subscriptions.user_id');

        $totalActive = Site::where('status', 'active')->count();
        $totalPending = Site::where('status', 'pending')->count();

        return $this->paginated($sites, [
            'stats' => [
                'total' => Site::count(),
                'active' => $totalActive,
                'pending' => $totalPending,
            ],
            'data' => collect($sites->items())->map(function (Site $site) use ($users, $planSlugs) {
                $user = $users->get($site->user_id);

                return [
                    'id' => $site->id,
                    'name' => $site->name,
                    'domain' => $site->domain,
                    'url' => $site->url,
                    'platform' => $site->platform,
                    'status' => $site->status?->value,
                    'script_installed' => $site->script_installed,
                    'widgets_count' => $site->widgets()->where('is_enabled', true)->count(),
                    'connected_at' => $site->connected_at?->toIso8601String(),
                    'created_at' => $site->created_at->toIso8601String(),
                    'user' => $user ? [
                        'id' => $user->id,
                        'email' => $user->email,
                        'name' => $user->name,
                    ] : null,
                    'plan' => $planSlugs->get($site->user_id),
                ];
            }),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        /** @var Site $site */
        $site = Site::with(['script', 'widgets'])->findOrFail($id);

        $user = DB::table('users')
            ->where('id', $site->user_id)
            ->first(['id', 'email', 'name']);

        $allProducts = DB::table('products')
            ->get(['id', 'slug', 'name', 'icon']);
        $productsById = $allProducts->keyBy('id');

        return $this->success([
            'data' => [
                'id' => $site->id,
                'name' => $site->name,
                'domain' => $site->domain,
                'url' => $site->url,
                'platform' => $site->platform,
                'status' => $site->status?->value,
                'script_installed' => $site->script_installed,
                'connected_at' => $site->connected_at?->toIso8601String(),
                'script' => $site->script ? [
                    'token' => $site->script->token,
                    'script_tag' => $site->script->script_tag,
                    'is_active' => $site->script->is_active,
                ] : null,
                'widgets' => $site->widgets->map(function (SiteWidget $w) use ($productsById) {
                    $product = $productsById->get($w->product_id);

                    return [
                        'product_id' => $w->product_id,
                        'slug' => $product?->slug,
                        'name' => $product?->name,
                        'icon' => $product?->icon,
                        'is_enabled' => $w->is_enabled,
                        'config' => $w->config,
                    ];
                }),
                'products' => $allProducts->map(fn ($p) => [
                    'id' => $p->id,
                    'slug' => $p->slug,
                    'name' => $p->name,
                    'icon' => $p->icon,
                ])->values(),
                'user' => $user ? [
                    'id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                ] : null,
            ],
        ]);
    }

    public function updateWidget(Request $request, string $siteId, int $productId): JsonResponse
    {
        $request->validate([
            'is_enabled' => ['sometimes', 'boolean'],
            'config' => ['sometimes', 'array'],
        ]);

        /** @var Site $site */
        $site = Site::findOrFail($siteId);

        $siteWidget = $site->widgets()->updateOrCreate(
            ['product_id' => $productId],
            array_filter([
                'is_enabled' => $request->input('is_enabled'),
                'config' => $request->input('config'),
                'enabled_at' => $request->boolean('is_enabled') ? now() : null,
                'disabled_at' => $request->input('is_enabled') === false ? now() : null,
            ], fn ($v) => $v !== null),
        );

        RebuildSiteScriptJob::dispatch($site->id);

        return $this->success([
            'data' => [
                'product_id' => $siteWidget->product_id,
                'is_enabled' => $siteWidget->is_enabled,
                'config' => $siteWidget->config,
            ],
        ]);
    }

    public function batchUpdateWidgets(Request $request, string $siteId): JsonResponse
    {
        $request->validate([
            'widgets' => ['required', 'array', 'min:1'],
            'widgets.*.product_id' => ['required', 'integer'],
            'widgets.*.is_enabled' => ['sometimes', 'boolean'],
            'widgets.*.config' => ['sometimes', 'array'],
        ]);

        /** @var Site $site */
        $site = Site::findOrFail($siteId);

        foreach ($request->input('widgets') as $widgetData) {
            $isEnabled = $widgetData['is_enabled'] ?? null;
            $site->widgets()->updateOrCreate(
                ['product_id' => $widgetData['product_id']],
                array_filter([
                    'is_enabled' => $isEnabled,
                    'config' => $widgetData['config'] ?? null,
                    'enabled_at' => $isEnabled === true ? now() : null,
                    'disabled_at' => $isEnabled === false ? now() : null,
                ], fn ($v) => $v !== null),
            );
        }

        RebuildSiteScriptJob::dispatch($site->id);

        return $this->success(['data' => ['status' => 'queued']]);
    }
}
