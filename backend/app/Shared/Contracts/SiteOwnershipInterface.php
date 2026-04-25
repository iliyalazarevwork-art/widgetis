<?php

declare(strict_types=1);

namespace App\Shared\Contracts;

use App\Shared\ValueObjects\SiteId;
use App\Shared\ValueObjects\UserId;

interface SiteOwnershipInterface
{
    public function userOwnsSite(UserId $userId, SiteId $siteId): bool;

    public function siteCountForUser(UserId $userId): int;

    public function enabledWidgetCountForUser(UserId $userId): int;

    /** @return list<string> raw site IDs owned by user */
    public function siteIdsForUser(UserId $userId): array;
}
