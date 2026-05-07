<?php

declare(strict_types=1);

namespace App\Core\Services\Plan;

use App\Core\Enums\Widget\WidgetSlug;
use App\Core\Models\Plan;
use App\Core\Models\Subscription;
use App\Core\Models\User;
use App\Enums\SubscriptionStatus;
use App\WidgetRuntime\Models\Site;

final class PlanLimitGate
{
    /**
     * True if user's current plan still has site capacity.
     */
    public function canAddSite(User $user): bool
    {
        $plan = $this->resolvePlan($user);

        if ($plan === null) {
            return false;
        }

        $maxSites = (int) ($plan->max_sites ?? 0);
        if ($maxSites <= 0) {
            return false;
        }

        return $this->activeSitesCount($user) < $maxSites;
    }

    /**
     * True if the given locale is in user's plan languages_supported.
     */
    public function canUseLocale(User $user, string $locale): bool
    {
        $plan = $this->resolvePlan($user);

        if ($plan === null) {
            return false;
        }

        $supported = $plan->languages_supported ?? [];

        return in_array($locale, $supported, true);
    }

    /**
     * Widget limits config for a given widget on user's plan.
     * Returns the config array if the plan has limits (e.g. Free),
     * or null if no limits apply (Pro/Max).
     *
     * @return array<string, mixed>|null
     */
    public function getWidgetLimits(User $user, WidgetSlug $widget): ?array
    {
        $plan = $this->resolvePlan($user);

        if ($plan === null) {
            return null;
        }

        $limitsConfig = $plan->widget_limits_config;

        if (! is_array($limitsConfig)) {
            return null;
        }

        $entry = $limitsConfig[$widget->value] ?? null;

        if (! is_array($entry)) {
            return null;
        }

        /** @var array<string, mixed> */
        return $entry;
    }

    /**
     * Number of active sites currently registered for the user.
     */
    public function activeSitesCount(User $user): int
    {
        return Site::where('user_id', $user->id)
            ->active()
            ->count();
    }

    private function resolvePlan(User $user): ?Plan
    {
        $subscription = $user->subscription;

        if ($subscription === null) {
            $subscription = Subscription::where('user_id', $user->id)
                ->whereIn('status', SubscriptionStatus::accessGranting())
                ->first();
        }

        if ($subscription !== null && $subscription->isActive()) {
            return $subscription->plan;
        }

        return Plan::where('slug', 'free')->first();
    }
}
