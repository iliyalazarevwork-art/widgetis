<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Widget;

use App\Enums\ProductAvailability;
use App\Shared\Contracts\SubscriptionGateInterface;
use App\Shared\Contracts\WidgetCatalogInterface;
use App\Shared\ValueObjects\UserId;
use App\WidgetRuntime\Models\UserWidgetGrant;

final class WidgetAccessService
{
    public function __construct(
        private readonly SubscriptionGateInterface $subscriptionGate,
        private readonly WidgetCatalogInterface $widgetCatalog,
    ) {
    }

    /**
     * Check if a user can access a widget by slug.
     * Uses subscription gate to resolve plan, widget catalog for plan access,
     * and product_id for grant checks (product_id must be provided by caller).
     */
    public function canAccessBySlug(UserId $userId, string $slug, string $availability, int $productId): bool
    {
        if ($availability !== ProductAvailability::Available->value) {
            return false;
        }

        if ($this->hasActiveGrantByProductId($userId, $productId)) {
            return true;
        }

        return $this->isInActivePlanBySlug($userId, $slug);
    }

    public function isInActivePlanBySlug(UserId $userId, string $slug): bool
    {
        $planSlug = $this->subscriptionGate->activePlanSlugFor($userId);

        if ($planSlug === null) {
            return false;
        }

        return in_array($slug, $this->widgetCatalog->availableSlugsForPlan($planSlug), strict: true);
    }

    public function hasActiveGrantByProductId(UserId $userId, int $productId): bool
    {
        return UserWidgetGrant::where('user_id', $userId->value)
            ->where('product_id', $productId)
            ->active()
            ->exists();
    }

    /** @return list<int> product IDs accessible to the user */
    public function accessibleProductIds(UserId $userId): array
    {
        $planSlug = $this->subscriptionGate->activePlanSlugFor($userId);
        $planProductSlugs = $planSlug !== null
            ? $this->widgetCatalog->availableSlugsForPlan($planSlug)
            : [];

        $grantedProductIds = UserWidgetGrant::where('user_id', $userId->value)
            ->active()
            ->pluck('product_id')
            ->all();

        return array_values(array_unique($grantedProductIds));
    }

    public function getAccessState(?UserId $userId, string $slug, string $availability, int $productId): ProductAccessState
    {
        if ($availability === ProductAvailability::ComingSoon->value) {
            return ProductAccessState::ComingSoon;
        }

        if ($availability === ProductAvailability::Archived->value) {
            return ProductAccessState::Archived;
        }

        if ($userId === null) {
            return ProductAccessState::Locked;
        }

        return $this->canAccessBySlug($userId, $slug, $availability, $productId)
            ? ProductAccessState::Available
            : ProductAccessState::Locked;
    }
}
