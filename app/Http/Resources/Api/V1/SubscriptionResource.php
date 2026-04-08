<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Models\Subscription;
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
        ];
    }
}
