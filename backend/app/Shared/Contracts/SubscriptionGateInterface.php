<?php

declare(strict_types=1);

namespace App\Shared\Contracts;

use App\Shared\ValueObjects\UserId;

interface SubscriptionGateInterface
{
    /** Returns active plan slug or null if no active subscription. */
    public function activePlanSlugFor(UserId $id): ?string;

    public function hasFeature(UserId $id, string $featureSlug): bool;
}
