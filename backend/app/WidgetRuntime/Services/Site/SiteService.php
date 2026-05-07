<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Site;

use App\Enums\SiteStatus;
use App\Exceptions\PlanLimitExceededException;
use App\Exceptions\ScriptNotInstalledException;
use App\Exceptions\SubscriptionRequiredException;
use App\Shared\Contracts\SiteOwnershipInterface;
use App\Shared\Contracts\SubscriptionGateInterface;
use App\Shared\ValueObjects\UserId;
use App\WidgetRuntime\Jobs\RebuildSiteScriptJob;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Models\SiteScript;
use App\WidgetRuntime\Models\SiteWidget;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class SiteService
{
    public function __construct(
        private readonly SubscriptionGateInterface $subscriptionGate,
        private readonly SiteOwnershipInterface $siteOwnership,
    ) {
    }

    public function create(UserId $userId, string $url, string $platform, ?string $name = null): Site
    {
        Log::info('site.create.in', [
            'user_id' => $userId->value,
            'url' => $url,
            'platform' => $platform,
            'name' => $name,
        ]);

        $domain = Site::domainFromUrl($url);

        $takenByAnother = Site::query()
            ->whereRaw('LOWER(domain) = ?', [$domain])
            ->where('user_id', '!=', $userId->value)
            ->exists();

        if ($takenByAnother) {
            Log::warning('site.create.out', [
                'user_id' => $userId->value,
                'domain' => $domain,
                'result' => 'domain_taken_by_another_account',
            ]);
            throw ValidationException::withMessages([
                'url' => [__('messages.site_taken_by_another_account')],
            ]);
        }

        $alreadyConnected = Site::query()
            ->where('user_id', $userId->value)
            ->whereRaw('LOWER(domain) = ?', [$domain])
            ->exists();

        if ($alreadyConnected) {
            Log::warning('site.create.out', [
                'user_id' => $userId->value,
                'domain' => $domain,
                'result' => 'domain_already_connected',
            ]);
            throw ValidationException::withMessages([
                'url' => [__('messages.site_already_connected')],
            ]);
        }

        $this->checkSiteLimit($userId);

        $site = DB::transaction(function () use ($userId, $url, $platform, $name, $domain) {
            $site = Site::create([
                'user_id' => $userId->value,
                'name' => $name ?? $domain,
                'domain' => $domain,
                'url' => $url,
                'platform' => $platform,
                'status' => SiteStatus::Pending,
            ]);

            SiteScript::create([
                'site_id' => $site->id,
                'token' => SiteScript::generateToken(),
                'is_active' => false,
            ]);

            if ($this->subscriptionGate->activePlanSlugFor($userId) !== null) {
                RebuildSiteScriptJob::dispatch($site->id);
            }

            return $site->load('script');
        });

        Log::info('site.create.out', [
            'user_id' => $userId->value,
            'site_id' => $site->id,
            'domain' => $site->domain,
            'status' => is_string($site->status) ? $site->status : $site->status->value,
            'result' => 'success',
        ]);

        return $site;
    }

    public function checkSiteLimit(UserId $userId): void
    {
        $planSlug = $this->subscriptionGate->activePlanSlugFor($userId);
        // Default max_sites = 1 if no plan; resolve plan max_sites via plan slug
        $maxSites = $this->resolveSiteLimit($planSlug);
        $currentCount = $this->siteOwnership->siteCountForUser($userId);

        Log::info('site.limit.check.in', [
            'user_id' => $userId->value,
            'current_count' => $currentCount,
            'max_sites' => $maxSites,
        ]);

        if ($currentCount >= $maxSites) {
            Log::warning('site.limit.check.out', [
                'user_id' => $userId->value,
                'current_count' => $currentCount,
                'max_sites' => $maxSites,
                'result' => 'limit_exceeded',
            ]);
            throw new PlanLimitExceededException(
                trans('messages.site_limit_reached', ['current' => $currentCount, 'max' => $maxSites]),
            );
        }

        Log::info('site.limit.check.out', [
            'user_id' => $userId->value,
            'current_count' => $currentCount,
            'max_sites' => $maxSites,
            'result' => 'ok',
        ]);
    }

    public function checkWidgetLimit(UserId $userId): void
    {
        $planSlug = $this->subscriptionGate->activePlanSlugFor($userId);
        $maxWidgets = $this->resolveWidgetLimit($planSlug);
        $currentCount = SiteWidget::whereHas('site', fn ($q) => $q->where('user_id', $userId->value))
            ->where('is_enabled', true)
            ->count();

        Log::info('site.widget_limit.check.in', [
            'user_id' => $userId->value,
            'current_count' => $currentCount,
            'max_widgets' => $maxWidgets,
        ]);

        if ($currentCount >= $maxWidgets) {
            Log::warning('site.widget_limit.check.out', [
                'user_id' => $userId->value,
                'current_count' => $currentCount,
                'max_widgets' => $maxWidgets,
                'result' => 'limit_exceeded',
            ]);
            throw new PlanLimitExceededException(
                trans('messages.widget_limit_reached', ['current' => $currentCount, 'max' => $maxWidgets]),
            );
        }

        Log::info('site.widget_limit.check.out', [
            'user_id' => $userId->value,
            'current_count' => $currentCount,
            'max_widgets' => $maxWidgets,
            'result' => 'ok',
        ]);
    }

    /**
     * Apply a partial config patch from the user to a site widget.
     *
     * @param array<string, mixed> $patch
     */
    public function applyWidgetConfig(
        UserId $userId,
        Site $site,
        int $productId,
        array $patch,
    ): SiteWidget {
        Log::info('site.widget_config.apply.in', [
            'user_id' => $userId->value,
            'site_id' => $site->id,
            'product_id' => $productId,
            'patch_keys' => array_keys($patch),
        ]);

        $planSlug = $this->subscriptionGate->activePlanSlugFor($userId);

        if ($planSlug === null) {
            Log::warning('site.widget_config.apply.out', [
                'user_id' => $userId->value,
                'site_id' => $site->id,
                'product_id' => $productId,
                'result' => 'subscription_required',
            ]);
            throw new SubscriptionRequiredException(
                trans('messages.subscription_required'),
            );
        }

        $canFullConfig = in_array($planSlug, ['pro', 'max'], strict: true);

        $filtered = $canFullConfig
            ? $patch
            : array_intersect_key($patch, ['enabled' => true]);

        $isEnabled = isset($filtered['enabled']) ? (bool) $filtered['enabled'] : null;

        if ($isEnabled === true) {
            if (! $site->script_installed) {
                Log::warning('site.widget_config.apply.out', [
                    'user_id' => $userId->value,
                    'site_id' => $site->id,
                    'product_id' => $productId,
                    'result' => 'script_not_installed',
                ]);
                throw new ScriptNotInstalledException(
                    trans('messages.script_not_installed'),
                );
            }

            $this->checkWidgetLimit($userId);
        }

        /** @var SiteWidget $siteWidget */
        $siteWidget = $site->widgets()->firstOrNew(['product_id' => $productId]);

        $existing = $siteWidget->config ?? [];
        $merged = $this->deepMerge($existing, $filtered);
        $siteWidget->config = $merged;

        if ($isEnabled !== null) {
            $siteWidget->is_enabled = $isEnabled;
            $siteWidget->enabled_at = $isEnabled ? now() : $siteWidget->enabled_at;
            $siteWidget->disabled_at = $isEnabled ? $siteWidget->disabled_at : now();
        }

        $siteWidget->save();

        RebuildSiteScriptJob::dispatch($site->id);

        Log::info('site.widget_config.apply.out', [
            'user_id' => $userId->value,
            'site_id' => $site->id,
            'product_id' => $productId,
            'site_widget_id' => $siteWidget->id,
            'is_enabled' => $siteWidget->is_enabled,
            'config_keys' => array_keys($siteWidget->config ?? []),
            'result' => 'success',
        ]);

        return $siteWidget;
    }

    /**
     * @param array<string, mixed> $base
     * @param array<string, mixed> $override
     * @return array<string, mixed>
     */
    private function deepMerge(array $base, array $override): array
    {
        foreach ($override as $key => $value) {
            if (is_array($value) && isset($base[$key]) && is_array($base[$key])) {
                $base[$key] = $this->deepMerge($base[$key], $value);
            } else {
                $base[$key] = $value;
            }
        }

        return $base;
    }

    /**
     * @return list<array{step: int, title: string, description: string}>
     */
    public function getInstallInstructions(string $platform): array
    {
        Log::info('site.install_instructions.in', ['platform' => $platform]);

        $instructions = match ($platform) {
            'horoshop' => [
                ['step' => 1, 'title' => 'Open Horoshop admin panel', 'description' => 'Go to your store admin at admin.horoshop.ua'],
                ['step' => 2, 'title' => 'Navigate to Scripts', 'description' => 'Go to Settings → Scripts → Scripts before </body>'],
                ['step' => 3, 'title' => 'Paste the code', 'description' => 'Paste the copied script into the field'],
                ['step' => 4, 'title' => 'Save', 'description' => 'Click Save and wait up to 5 minutes for activation'],
            ],
            default => [
                ['step' => 1, 'title' => 'Open site admin', 'description' => 'Go to your site admin panel'],
                ['step' => 2, 'title' => 'Find script injection', 'description' => 'Find the section for adding custom scripts'],
                ['step' => 3, 'title' => 'Paste before </body>', 'description' => 'Paste the script before the closing </body> tag'],
                ['step' => 4, 'title' => 'Save', 'description' => 'Save changes'],
            ],
        };

        Log::info('site.install_instructions.out', ['platform' => $platform, 'steps_count' => count($instructions)]);

        return $instructions;
    }

    private function resolveSiteLimit(?string $planSlug): int
    {
        // Plan limits are defined in the Core domain; WidgetRuntime reads them
        // via a simple map rather than importing the Plan model directly.
        return match ($planSlug) {
            'basic' => 1,
            'pro' => 3,
            'max' => 10,
            default => 1,
        };
    }

    private function resolveWidgetLimit(?string $planSlug): int
    {
        return match ($planSlug) {
            'basic' => 2,
            'pro' => 5,
            'max' => 20,
            default => 2,
        };
    }
}
