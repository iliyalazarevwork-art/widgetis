<?php

declare(strict_types=1);

namespace App\Services\Site;

use App\Enums\SiteStatus;
use App\Exceptions\PlanLimitExceededException;
use App\Jobs\RebuildSiteScriptJob;
use App\Models\Site;
use App\Models\SiteScript;
use App\Models\SiteWidget;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SiteService
{
    public function create(User $user, string $url, string $platform, ?string $name = null): Site
    {
        $domain = Site::domainFromUrl($url);

        $takenByAnother = Site::query()
            ->where('domain', $domain)
            ->where('user_id', '!=', $user->id)
            ->exists();

        if ($takenByAnother) {
            throw ValidationException::withMessages([
                'url' => [__('messages.site_taken_by_another_account')],
            ]);
        }

        $alreadyConnected = Site::query()
            ->where('user_id', $user->id)
            ->where('domain', $domain)
            ->exists();

        if ($alreadyConnected) {
            throw ValidationException::withMessages([
                'url' => [__('messages.site_already_connected')],
            ]);
        }

        $this->checkSiteLimit($user);

        return DB::transaction(function () use ($user, $url, $platform, $name, $domain) {
            $site = Site::create([
                'user_id' => $user->id,
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

            if ($user->hasActivePlan()) {
                RebuildSiteScriptJob::dispatch($site->id);
            }

            return $site->load('script');
        });
    }

    public function checkSiteLimit(User $user): void
    {
        $plan = $user->currentPlan();
        $maxSites = $plan?->max_sites ?? 1;
        $currentCount = $user->sites()->count();

        if ($currentCount >= $maxSites) {
            throw new PlanLimitExceededException(
                "Site limit reached ({$currentCount}/{$maxSites}). Upgrade your plan.",
            );
        }
    }

    public function checkWidgetLimit(User $user): void
    {
        $plan = $user->currentPlan();
        $maxWidgets = $plan?->max_widgets ?? 2;
        $currentCount = $user->siteWidgets()->where('is_enabled', true)->count();

        if ($currentCount >= $maxWidgets) {
            throw new PlanLimitExceededException(
                "Widget limit reached ({$currentCount}/{$maxWidgets}). Upgrade your plan.",
            );
        }
    }

    /**
     * Apply a partial config patch from the user to a site widget.
     *
     * Allowed fields depend on the user's plan:
     *   - pro / max → all fields
     *   - no plan   → only "enabled"
     *
     * The patch is deep-merged into the existing widget config.
     * After saving, a rebuild job is dispatched.
     *
     * @param array<string, mixed> $patch
     */
    public function applyWidgetConfig(
        User $user,
        Site $site,
        int $productId,
        array $patch,
    ): SiteWidget {
        $planSlug = $user->currentPlan()?->slug;
        $canFullConfig = in_array($planSlug, ['pro', 'max'], strict: true);

        // Strip fields the user is not allowed to change
        $filtered = $canFullConfig
            ? $patch
            : array_intersect_key($patch, ['enabled' => true]);

        // Map "enabled" key to the is_enabled column value
        $isEnabled = isset($filtered['enabled']) ? (bool) $filtered['enabled'] : null;

        if ($isEnabled === true) {
            $this->checkWidgetLimit($user);
        }

        // Retrieve or create the widget record
        /** @var SiteWidget $siteWidget */
        $siteWidget = $site->widgets()->firstOrNew(['product_id' => $productId]);

        // Deep-merge incoming patch with existing config
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

        return $siteWidget;
    }

    /**
     * Recursively merge $override into $base.
     * Scalar values in $override replace those in $base.
     *
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
        return match ($platform) {
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
    }
}
