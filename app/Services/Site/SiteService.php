<?php

declare(strict_types=1);

namespace App\Services\Site;

use App\Enums\SiteStatus;
use App\Exceptions\PlanLimitExceededException;
use App\Models\Site;
use App\Models\SiteScript;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SiteService
{
    public function create(User $user, string $url, string $platform, ?string $name = null): Site
    {
        $this->checkSiteLimit($user);

        $domain = Site::domainFromUrl($url);

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
