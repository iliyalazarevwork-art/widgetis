<?php

declare(strict_types=1);

namespace App\Core\Http\Resources\Api\V1;

use App\Core\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Subscription */
class SubscriptionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'plan' => new PlanResource($this->whenLoaded('plan')),
            'billing_period' => $this->billing_period,
            'status' => $this->status->value,
            'is_trial' => $this->is_trial,
            'trial_ends_at' => $this->trial_ends_at?->toIso8601String(),
            'current_period_start' => $this->current_period_start->toIso8601String(),
            'current_period_end' => $this->current_period_end->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'days_remaining' => $this->daysRemainingInPeriod(),
            'effective_monthly_price' => $this->resolveEffectiveMonthlyPrice(),
        ];
    }

    /**
     * Returns the price the user is actually charged each month.
     * Founding Pro users pay their locked price (e.g. 299 ₴) forever,
     * regardless of the plan's current sticker price.
     */
    private function resolveEffectiveMonthlyPrice(): ?float
    {
        $plan = $this->resource->relationLoaded('plan') ? $this->resource->plan : null;

        if ($plan === null) {
            return null;
        }

        $user = $this->resource->user;

        if (
            $user !== null
            && (bool) $user->is_founding
            && $plan->slug === 'pro'
            && $user->founding_locked_price_monthly !== null
        ) {
            return (float) $user->founding_locked_price_monthly;
        }

        return (float) $plan->price_monthly;
    }
}
