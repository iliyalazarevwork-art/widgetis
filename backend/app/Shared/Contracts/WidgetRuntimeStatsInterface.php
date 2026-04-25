<?php

declare(strict_types=1);

namespace App\Shared\Contracts;

use App\Shared\ValueObjects\UserId;
use DateTimeInterface;

interface WidgetRuntimeStatsInterface
{
    public function totalSites(): int;

    public function activeSites(): int;

    public function activeSitesCreatedSince(DateTimeInterface $since): int;

    public function totalDemoSessions(): int;

    public function activeSiteWidgets(): int;

    public function activeSiteWidgetsCreatedSince(DateTimeInterface $since): int;

    public function sitesForUser(UserId $id): int;
}
