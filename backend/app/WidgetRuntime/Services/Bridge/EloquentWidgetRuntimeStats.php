<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Bridge;

use App\Shared\Contracts\WidgetRuntimeStatsInterface;
use App\Shared\ValueObjects\UserId;
use App\WidgetRuntime\Models\DemoSession;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Models\SiteWidget;

final class EloquentWidgetRuntimeStats implements WidgetRuntimeStatsInterface
{
    public function totalSites(): int
    {
        return Site::count();
    }

    public function totalDemoSessions(): int
    {
        return DemoSession::count();
    }

    public function activeSiteWidgets(): int
    {
        return SiteWidget::where('is_enabled', true)->count();
    }

    public function sitesForUser(UserId $id): int
    {
        return Site::where('user_id', $id->value)->count();
    }
}
