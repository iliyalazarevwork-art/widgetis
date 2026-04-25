<?php

declare(strict_types=1);

namespace App\Core\Services\Bridge;

use App\Core\Models\User;
use App\Shared\Contracts\SubscriptionGateInterface;
use App\Shared\ValueObjects\UserId;

final class EloquentSubscriptionGate implements SubscriptionGateInterface
{
    public function activePlanSlugFor(UserId $id): ?string
    {
        $user = User::with('subscription.plan')->find($id->value);

        if ($user === null) {
            return null;
        }

        $subscription = $user->subscription;

        if ($subscription === null || ! $subscription->isActive()) {
            return null;
        }

        return $subscription->plan?->slug;
    }

    public function hasFeature(UserId $id, string $featureSlug): bool
    {
        $user = User::with('subscription.plan')->find($id->value);
        $subscription = $user?->subscription;

        if ($subscription === null || ! $subscription->isActive()) {
            return false;
        }

        $plan = $subscription->plan;

        if ($plan === null) {
            return false;
        }

        $features = $plan->features ?? [];

        return in_array($featureSlug, (array) $features, strict: true);
    }
}
