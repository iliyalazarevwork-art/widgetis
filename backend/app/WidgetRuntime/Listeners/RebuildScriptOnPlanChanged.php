<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Listeners;

use App\Shared\Contracts\SiteOwnershipInterface;
use App\Shared\Events\Subscription\PlanChanged;
use App\WidgetRuntime\Jobs\RebuildSiteScriptJob;
use App\WidgetRuntime\Models\SiteWidget;

final class RebuildScriptOnPlanChanged
{
    public function __construct(
        private readonly SiteOwnershipInterface $siteOwnership,
    ) {
    }

    public function handle(PlanChanged $event): void
    {
        $siteIds = $this->siteOwnership->siteIdsForUser($event->userId);

        // When the new plan is null (subscription expired), disable all widgets first.
        if ($event->newPlanSlug === null && $siteIds !== []) {
            SiteWidget::whereIn('site_id', $siteIds)
                ->where('is_enabled', true)
                ->update([
                    'is_enabled' => false,
                    'disabled_at' => now(),
                ]);
        }

        foreach ($siteIds as $siteId) {
            RebuildSiteScriptJob::dispatch($siteId);
        }
    }
}
