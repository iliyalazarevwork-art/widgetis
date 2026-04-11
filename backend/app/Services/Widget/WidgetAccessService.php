<?php

declare(strict_types=1);

namespace App\Services\Widget;

use App\Enums\ProductAvailability;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class WidgetAccessService
{
    public function canAccess(User $user, Product $product): bool
    {
        if ($product->availability !== ProductAvailability::Available) {
            return false;
        }

        if ($this->hasActiveGrant($user, $product)) {
            return true;
        }

        return $this->isInActivePlan($user, $product);
    }

    public function hasActiveGrant(User $user, Product $product): bool
    {
        return $user->widgetGrants()
            ->where('product_id', $product->id)
            ->active()
            ->exists();
    }

    public function isInActivePlan(User $user, Product $product): bool
    {
        $subscription = $user->subscription;

        if ($subscription === null || ! $subscription->isActive()) {
            return false;
        }

        $plan = $subscription->plan;

        if ($plan === null) {
            return false;
        }

        return $plan->products()
            ->where('products.id', $product->id)
            ->exists();
    }

    /**
     * @return Collection<int, Product>
     */
    public function accessibleProducts(User $user): Collection
    {
        $planProductIds = [];
        $subscription = $user->subscription;

        if ($subscription !== null && $subscription->isActive() && $subscription->plan !== null) {
            $planProductIds = $subscription->plan->products()->pluck('products.id')->toArray();
        }

        $grantedProductIds = $user->widgetGrants()
            ->active()
            ->pluck('product_id')
            ->toArray();

        $ids = array_values(array_unique([...$planProductIds, ...$grantedProductIds]));

        if ($ids === []) {
            return new Collection();
        }

        return Product::query()
            ->whereIn('id', $ids)
            ->where('availability', ProductAvailability::Available->value)
            ->get();
    }

    public function getAccessState(?User $user, Product $product): ProductAccessState
    {
        if ($product->availability === ProductAvailability::ComingSoon) {
            return ProductAccessState::ComingSoon;
        }

        if ($product->availability === ProductAvailability::Archived) {
            return ProductAccessState::Archived;
        }

        if ($user === null) {
            return ProductAccessState::Locked;
        }

        return $this->canAccess($user, $product)
            ? ProductAccessState::Available
            : ProductAccessState::Locked;
    }
}
