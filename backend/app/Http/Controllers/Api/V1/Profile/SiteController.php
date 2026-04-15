<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Api\V1\BaseController;
use App\Models\Site;
use App\Services\Site\ScriptBuilderService;
use App\Services\Site\SiteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SiteController extends BaseController
{
    public function __construct(
        private readonly SiteService $siteService,
        private readonly ScriptBuilderService $scriptBuilder,
    ) {
    }

    public function index(): JsonResponse
    {
        $user = $this->currentUser();
        $sites = $user->sites()->with('script')->orderByDesc('created_at')->get();
        $plan = $user->currentPlan();

        return $this->success([
            'data' => $sites->map(fn (Site $site) => [
                'id' => $site->id,
                'name' => $site->name,
                'domain' => $site->domain,
                'url' => $site->url,
                'platform' => $site->platform,
                'status' => $site->status->value,
                'script_installed' => $site->script_installed,
                'widgets_count' => $site->widgets()->where('is_enabled', true)->count(),
                'connected_at' => $site->connected_at?->toIso8601String(),
                'created_at' => $site->created_at->toIso8601String(),
            ]),
            'limits' => [
                'used' => $sites->count(),
                'max' => $plan?->max_sites ?? 1,
                'plan' => $plan?->slug,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'url' => ['required', 'url', 'max:500'],
            'platform' => ['required', 'string', 'in:horoshop,shopify,woocommerce,opencart,wordpress,other'],
            'name' => ['nullable', 'string', 'max:255'],
        ]);

        $site = $this->siteService->create(
            $this->currentUser(),
            $request->input('url'),
            $request->input('platform'),
            $request->input('name'),
        );

        $this->ensureScriptBuilt($site);

        return $this->created([
            'data' => [
                'id' => $site->id,
                'domain' => $site->domain,
                'status' => $site->status->value,
                'script' => [
                    'token' => $site->script->token,
                    'script_tag' => $site->script->script_tag,
                    'script_url' => $site->script->script_url,
                ],
                'install_instructions' => $this->siteService->getInstallInstructions($site->platform),
            ],
        ]);
    }

    private function ensureScriptBuilt(Site $site): void
    {
        if ($site->script === null) {
            return;
        }

        try {
            $this->scriptBuilder->ensureBuilt($site);
        } catch (\Throwable $e) {
            Log::error('Profile\\SiteController: ensureBuilt failed.', [
                'site_id' => $site->id,
                'domain' => $site->domain,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function show(string $id): JsonResponse
    {
        $site = $this->currentUser()->sites()
            ->with(['script', 'widgets.product'])
            ->findOrFail($id);

        $this->ensureScriptBuilt($site);

        return $this->success([
            'data' => [
                'id' => $site->id,
                'name' => $site->name,
                'domain' => $site->domain,
                'url' => $site->url,
                'platform' => $site->platform,
                'status' => $site->status->value,
                'script_installed' => $site->script_installed,
                'connected_at' => $site->connected_at?->toIso8601String(),
                'script' => $site->script ? [
                    'token' => $site->script->token,
                    'script_tag' => $site->script->script_tag,
                    'is_active' => $site->script->is_active,
                ] : null,
                'widgets' => $site->widgets->map(fn ($w) => [
                    'product_id' => $w->product_id,
                    'slug' => $w->product?->slug,
                    'name' => $w->product?->translated('name'),
                    'icon' => $w->product?->icon,
                    'is_enabled' => $w->is_enabled,
                    'config' => $w->config,
                ]),
            ],
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $site = $this->currentUser()->sites()->findOrFail($id);
        $site->delete();

        return $this->noContent();
    }

    public function verify(string $id): JsonResponse
    {
        $site = $this->currentUser()->sites()->with('script')->findOrFail($id);

        $verified = $site->script !== null;

        if ($verified && !$site->script_installed) {
            $site->update([
                'script_installed' => true,
                'script_installed_at' => now(),
                'status' => 'active',
                'connected_at' => now(),
            ]);
        }

        return $this->success([
            'verified' => $verified,
            'message' => $verified
                ? 'Script verified. Site is now active.'
                : 'Script not found. Please install the script and try again.',
        ]);
    }

    public function script(string $id): JsonResponse
    {
        $site = $this->currentUser()->sites()->with('script')->findOrFail($id);

        if (!$site->script) {
            return $this->error('NO_SCRIPT', 'No script generated for this site.', 404);
        }

        $this->ensureScriptBuilt($site);

        return $this->success([
            'data' => [
                'token' => $site->script->token,
                'script_tag' => $site->script->script_tag,
                'script_url' => $site->script->script_url,
                'install_instructions' => $this->siteService->getInstallInstructions($site->platform),
            ],
        ]);
    }

    public function updateWidget(Request $request, string $siteId, int $productId): JsonResponse
    {
        $request->validate([
            'config' => ['required', 'array'],
        ]);

        $user = $this->currentUser();
        $site = $user->sites()->findOrFail($siteId);

        /** @var array<string, mixed> $config */
        $config = $request->input('config');

        $siteWidget = $this->siteService->applyWidgetConfig($user, $site, $productId, $config);

        return $this->success([
            'data' => [
                'product_id' => $siteWidget->product_id,
                'is_enabled' => $siteWidget->is_enabled,
                'config' => $siteWidget->config,
            ],
        ]);
    }
}
