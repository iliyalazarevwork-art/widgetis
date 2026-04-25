<?php

declare(strict_types=1);

namespace App\Shared\Contracts;

use App\Shared\ValueObjects\UserId;

interface WidgetRuntimeStatsInterface
{
    public function totalSites(): int;

    public function totalDemoSessions(): int;

    public function activeSiteWidgets(): int;

    public function sitesForUser(UserId $id): int;
}
