<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Controllers\Api\V1\Profile;

use App\Core\Models\User;
use App\Core\Services\Plan\PlanLimitGate;
use App\Http\Controllers\Api\V1\BaseController;
use App\Shared\Contracts\SiteOwnershipInterface;
use App\Shared\Contracts\SubscriptionGateInterface;
use App\Shared\ValueObjects\SiteId;
use App\Shared\ValueObjects\UserId;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Services\Site\ScriptBuilderService;
use App\WidgetRuntime\Services\Site\SiteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SiteController extends BaseController
{
    public function __construct(
        private readonly SiteService $siteService,
        private readonly ScriptBuilderService $scriptBuilder,
        private readonly SiteOwnershipInterface $siteOwnership,
        private readonly SubscriptionGateInterface $subscriptionGate,
        private readonly PlanLimitGate $planLimitGate,
    ) {
    }

    public function index(): JsonResponse
    {
        $userId = UserId::fromString($this->authedUserId());
        $sites = Site::where('user_id', $userId->value)->with('script')->orderByDesc('created_at')->get();
        $planSlug = $this->subscriptionGate->activePlanSlugFor($userId);

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
                'max' => $this->resolveSiteLimit($planSlug),
                'plan' => $planSlug,
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

        $userId = UserId::fromString($this->authedUserId());

        $user = User::findOrFail($userId->value);

        if (! $this->planLimitGate->canAddSite($user)) {
            return $this->error(
                'PLAN_LIMIT_EXCEEDED',
                'Your plan does not allow adding more sites. Upgrade to add more.',
                403,
            );
        }

        $site = $this->siteService->create(
            $userId,
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
        $site = $this->findOwnedSite($id);

        if ($site === null) {
            return $this->error('NOT_FOUND', 'Site not found.', 404);
        }

        $site->load(['script', 'widgets']);
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
                    'is_enabled' => $w->is_enabled,
                    'config' => $w->config,
                ]),
            ],
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $site = $this->findOwnedSite($id);

        if ($site === null) {
            return $this->error('NOT_FOUND', 'Site not found.', 404);
        }

        $site->delete();

        return $this->noContent();
    }

    public function verify(string $id): JsonResponse
    {
        $site = $this->findOwnedSite($id);

        if ($site === null) {
            return $this->error('NOT_FOUND', 'Site not found.', 404);
        }

        $site->loadMissing('script');
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
        $site = $this->findOwnedSite($id);

        if ($site === null) {
            return $this->error('NOT_FOUND', 'Site not found.', 404);
        }

        $site->loadMissing('script');

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

        $userId = UserId::fromString($this->authedUserId());
        $site = $this->findOwnedSiteByUserId($siteId, $userId);

        if ($site === null) {
            return $this->error('NOT_FOUND', 'Site not found.', 404);
        }

        /** @var array<string, mixed> $config */
        $config = $request->input('config');

        $siteWidget = $this->siteService->applyWidgetConfig($userId, $site, $productId, $config);

        return $this->success([
            'data' => [
                'product_id' => $siteWidget->product_id,
                'is_enabled' => $siteWidget->is_enabled,
                'config' => $siteWidget->config,
            ],
        ]);
    }

    private function findOwnedSite(string $siteId): ?Site
    {
        $userId = UserId::fromString($this->authedUserId());
        return $this->findOwnedSiteByUserId($siteId, $userId);
    }

    private function findOwnedSiteByUserId(string $siteId, UserId $userId): ?Site
    {
        if ($siteId === '') {
            return null;
        }

        if (! $this->siteOwnership->userOwnsSite($userId, SiteId::fromString($siteId))) {
            return null;
        }

        return Site::find($siteId);
    }

    private function resolveSiteLimit(?string $planSlug): int
    {
        return match ($planSlug) {
            'basic' => 1,
            'pro' => 3,
            'max' => 10,
            default => 1,
        };
    }
}
