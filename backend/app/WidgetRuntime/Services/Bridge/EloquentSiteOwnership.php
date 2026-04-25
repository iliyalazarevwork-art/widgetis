<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Bridge;

use App\Shared\Contracts\SiteOwnershipInterface;
use App\Shared\ValueObjects\SiteId;
use App\Shared\ValueObjects\UserId;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Models\SiteWidget;

final class EloquentSiteOwnership implements SiteOwnershipInterface
{
    public function userOwnsSite(UserId $userId, SiteId $siteId): bool
    {
        return Site::where('id', $siteId->value)
            ->where('user_id', $userId->value)
            ->exists();
    }

    public function siteCountForUser(UserId $userId): int
    {
        return Site::where('user_id', $userId->value)->count();
    }

    public function enabledWidgetCountForUser(UserId $userId): int
    {
        return SiteWidget::whereHas('site', fn ($q) => $q->where('user_id', $userId->value))
            ->where('is_enabled', true)
            ->count();
    }

    /** @return list<string> */
    public function siteIdsForUser(UserId $userId): array
    {
        return Site::where('user_id', $userId->value)
            ->pluck('id')
            ->all();
    }
}
