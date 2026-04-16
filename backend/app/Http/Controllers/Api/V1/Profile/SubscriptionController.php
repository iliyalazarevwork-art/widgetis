<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Profile;

use App\Enums\BillingPeriod;
use App\Enums\OrderStatus;
use App\Enums\PaymentProvider;
use App\Enums\SiteStatus;
use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Api\V1\Billing\CancelSubscriptionRequest;
use App\Http\Requests\Api\V1\Billing\CheckoutRequest;
use App\Http\Requests\Api\V1\Billing\StartTrialRequest;
use App\Http\Requests\Api\V1\Billing\UpgradePreviewRequest;
use App\Http\Requests\Api\V1\Billing\UpgradeRequest;
use App\Http\Resources\Api\V1\SubscriptionResource;
use App\Models\Order;
use App\Models\Plan;
use App\Models\Site;
use App\Services\Billing\CheckoutService;
use App\Services\Billing\SubscriptionService;
use Illuminate\Http\JsonResponse;

class SubscriptionController extends BaseController
{
    public function __construct(
        private readonly SubscriptionService $subscriptionService,
        private readonly CheckoutService $checkoutService,
    ) {
    }

    public function startTrial(StartTrialRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = $this->currentUser();

        if ($user->subscription) {
            return $this->error('ALREADY_SUBSCRIBED', 'User already has a subscription.', 409);
        }

        Site::firstOrCreate(
            ['user_id' => $user->id, 'domain' => $validated['site_domain']],
            [
                'name'     => $validated['site_domain'],
                'url'      => 'https://' . $validated['site_domain'],
                'platform' => $validated['platform'] ?? 'horoshop',
                'status'   => SiteStatus::Pending,
            ],
        );

        $plan = Plan::where('slug', $validated['plan_slug'])->firstOrFail();

        $subscription = $this->subscriptionService->createTrial($user, $plan);

        return $this->success([
            'data' => new SubscriptionResource($subscription->load('plan')),
            'message' => 'Trial started. Expires ' . $subscription->trial_ends_at->toDateString(),
        ], 201);
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

    public function upgradePreview(UpgradePreviewRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $subscription = $this->currentUser()->subscription;

        if (!$subscription) {
            return $this->error('NO_SUBSCRIPTION', 'No active subscription.', 404);
        }

        $targetPlan = Plan::where('slug', $validated['plan_slug'])
            ->where('is_active', true)
            ->firstOrFail();
        $targetPeriod = BillingPeriod::from($validated['billing_period']);

        try {
            $quote = $this->subscriptionService->calculateUpgrade(
                $subscription->load('plan'),
                $targetPlan,
                $targetPeriod,
            );
        } catch (\App\Exceptions\UpgradeNotAllowedException $e) {
            return $this->error($e->reason, $e->getMessage(), 422);
        }

        return $this->success(['data' => $quote->toArray()]);
    }

    public function upgrade(UpgradeRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = $this->currentUser();
        $subscription = $user->subscription;

        if (!$subscription) {
            return $this->error('NO_SUBSCRIPTION', 'No active subscription to upgrade.', 404);
        }

        $targetPlan = Plan::where('slug', $validated['plan_slug'])
            ->where('is_active', true)
            ->firstOrFail();
        $targetPeriod = BillingPeriod::from($validated['billing_period']);
        $provider = PaymentProvider::from($validated['provider']);

        try {
            $quote = $this->subscriptionService->calculateUpgrade(
                $subscription->load('plan'),
                $targetPlan,
                $targetPeriod,
            );
        } catch (\App\Exceptions\UpgradeNotAllowedException $e) {
            return $this->error($e->reason, $e->getMessage(), 422);
        }

        $payload = $this->checkoutService->createUpgradeCheckout(
            user: $user,
            subscription: $subscription,
            targetPlan: $targetPlan,
            targetPeriod: $targetPeriod,
            provider: $provider,
            quote: $quote,
            redirectUrl: isset($validated['redirect_url']) ? (string) $validated['redirect_url'] : null,
        );

        return $this->success(['data' => $payload->toResponseArray()]);
    }

    public function checkout(CheckoutRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = $this->currentUser();
        $plan = Plan::where('slug', $validated['plan_slug'])->where('is_active', true)->firstOrFail();
        $billingPeriod = BillingPeriod::from($validated['billing_period']);
        $provider = PaymentProvider::from($validated['provider']);

        if ($user->subscription?->isActive()) {
            return $this->error('ALREADY_SUBSCRIBED', 'User already has an active subscription.', 422);
        }

        $this->checkoutService->cancelStalePendingOrders($user->id);

        if ($user->subscription?->status === SubscriptionStatus::Pending) {
            $user->subscription->update(['status' => SubscriptionStatus::Cancelled]);
        }

        $payload = $this->checkoutService->createCheckout(
            user: $user,
            plan: $plan,
            billingPeriod: $billingPeriod,
            provider: $provider,
            siteDomain: $validated['site_domain'],
            platform: $validated['platform'] ?? null,
            redirectUrl: isset($validated['redirect_url']) ? (string) $validated['redirect_url'] : null,
        );

        return $this->success(['data' => $payload->toResponseArray()]);
    }

    public function cancelPendingCheckout(): JsonResponse
    {
        $user = $this->currentUser();

        $cancelled = Order::where('user_id', $user->id)
            ->where('status', OrderStatus::Pending)
            ->get();

        if ($cancelled->isEmpty()) {
            return $this->error('NO_PENDING_CHECKOUT', 'No pending checkout to cancel.', 404);
        }

        $this->checkoutService->cancelStalePendingOrders($user->id);

        if ($user->subscription?->status === SubscriptionStatus::Pending) {
            $user->subscription->update(['status' => SubscriptionStatus::Cancelled]);
        }

        return $this->success(['message' => 'Pending checkout cancelled.']);
    }

    public function cancel(CancelSubscriptionRequest $request): JsonResponse
    {
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
