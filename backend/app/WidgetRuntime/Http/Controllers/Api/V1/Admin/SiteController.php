<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseController;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Models\SiteWidget;
use App\WidgetRuntime\Services\Site\ScriptBuilderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiteController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = Site::with(['user.subscription.plan', 'script'])
            ->orderByDesc('created_at');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('domain', 'like', "%{$search}%")
                  ->orWhereHas('user', fn ($u) => $u->where('email', 'like', "%{$search}%"));
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $sites = $query->paginate($perPage);

        $totalActive = Site::where('status', 'active')->count();
        $totalPending = Site::where('status', 'pending')->count();

        return $this->paginated($sites, [
            'stats' => [
                'total' => Site::count(),
                'active' => $totalActive,
                'pending' => $totalPending,
            ],
            'data' => collect($sites->items())->map(fn (Site $site) => [
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
                'user' => $site->user ? [
                    'id' => $site->user->id,
                    'email' => $site->user->email,
                    'name' => $site->user->name,
                ] : null,
                'plan' => $site->user?->subscription?->plan?->slug,
            ]),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        /** @var Site $site */
        $site = Site::with(['script', 'widgets.product', 'user'])->findOrFail($id);

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
                'widgets' => $site->widgets->map(fn (SiteWidget $w) => [
                    'product_id' => $w->product_id,
                    'name' => $w->product?->translated('name'),
                    'icon' => $w->product?->icon,
                    'is_enabled' => $w->is_enabled,
                    'config' => $w->config,
                ]),
                'user' => $site->user ? [
                    'id' => $site->user->id,
                    'email' => $site->user->email,
                    'name' => $site->user->name,
                ] : null,
            ],
        ]);
    }

    public function deploy(Request $request, string $id, ScriptBuilderService $builder): JsonResponse
    {
        $request->validate([
            'modules' => ['required', 'array'],
            'obfuscate' => ['boolean'],
        ]);

        /** @var Site $site */
        $site = Site::with(['script'])->findOrFail($id);

        /** @var array<string, array{is_enabled: bool, config: array<string, mixed>, i18n: mixed}> $modules */
        $modules = $request->input('modules');
        $obfuscate = $request->boolean('obfuscate', true);

        try {
            $build = $builder->buildFromModules($site, $modules, $obfuscate);
        } catch (\Throwable $e) {
            return $this->error('DEPLOY_FAILED', $e->getMessage(), 500);
        }

        return $this->success([
            'data' => [
                'url' => $build->file_url,
                'version' => $build->version,
                'built_at' => now()->toIso8601String(),
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

        return $this->success([
            'data' => [
                'product_id' => $siteWidget->product_id,
                'is_enabled' => $siteWidget->is_enabled,
                'config' => $siteWidget->config,
            ],
        ]);
    }
}
