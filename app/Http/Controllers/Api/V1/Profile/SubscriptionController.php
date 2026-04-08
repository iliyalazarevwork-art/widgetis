<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Resources\Api\V1\SubscriptionResource;
use App\Models\Plan;
use App\Services\Billing\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends BaseController
{
    public function __construct(
        private readonly SubscriptionService $subscriptionService,
    ) {
    }

    public function show(): JsonResponse
    {
        $user = $this->currentUser();
        $subscription = $user->subscription?->load('plan');

        if (!$subscription) {
            return $this->error('NO_SUBSCRIPTION', 'No active subscription.', 404);
        }

        return $this->success([
            'data' => new SubscriptionResource($subscription),
        ]);
    }

    public function prorate(Request $request): JsonResponse
    {
        $request->validate([
            'target_plan_slug' => ['required', 'string', 'exists:plans,slug'],
        ]);

        $subscription = $this->currentUser()->subscription;

        if (!$subscription) {
            return $this->error('NO_SUBSCRIPTION', 'No active subscription.', 404);
        }

        $targetPlan = Plan::where('slug', $request->input('target_plan_slug'))->firstOrFail();
        $proration = $this->subscriptionService->calculateProration($subscription, $targetPlan);

        return $this->success(['data' => $proration]);
    }

    public function change(Request $request): JsonResponse
    {
        $request->validate([
            'plan_slug' => ['required', 'string', 'exists:plans,slug'],
        ]);

        $subscription = $this->currentUser()->subscription;

        if (!$subscription) {
            return $this->error('NO_SUBSCRIPTION', 'No active subscription.', 404);
        }

        $newPlan = Plan::where('slug', $request->input('plan_slug'))->firstOrFail();
        $updated = $this->subscriptionService->changePlan($subscription, $newPlan);

        return $this->success([
            'data' => new SubscriptionResource($updated->load('plan')),
        ]);
    }

    public function cancel(Request $request): JsonResponse
    {
        $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $subscription = $this->currentUser()->subscription;

        if (!$subscription || !$subscription->isActive()) {
            return $this->error('NO_ACTIVE_SUBSCRIPTION', 'No active subscription to cancel.', 404);
        }

        $cancelled = $this->subscriptionService->cancel(
            $subscription,
            $request->input('reason'),
        );

        return $this->success([
            'data' => new SubscriptionResource($cancelled->load('plan')),
            'message' => 'Subscription cancelled. Access continues until ' . $cancelled->current_period_end->toDateString(),
        ]);
    }
}
