<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Profile;

use App\Enums\BillingPeriod;
use App\Enums\OrderStatus;
use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Resources\Api\V1\SubscriptionResource;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\Billing\PaymentProviderRegistry;
use App\Services\Billing\SubscriptionService;
use App\Services\Billing\UniqueOrderNumberProvider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SubscriptionController extends BaseController
{
    public function __construct(
        private readonly SubscriptionService $subscriptionService,
        private readonly PaymentProviderRegistry $providers,
        private readonly UniqueOrderNumberProvider $orderNumbers,
    ) {
    }

    public function startTrial(Request $request): JsonResponse
    {
        $request->validate([
            'plan_slug' => ['required', 'string', 'exists:plans,slug'],
        ]);

        $user = $this->currentUser();

        if ($user->subscription) {
            return $this->error('ALREADY_SUBSCRIBED', 'User already has a subscription.', 409);
        }

        $plan = Plan::where('slug', $request->input('plan_slug'))->firstOrFail();

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

    /**
     * Start a paid subscription checkout against a specific provider.
     *
     * Creates Order + pending Subscription + pending Payment rows up
     * front, then asks the chosen provider to build a checkout session.
     * The frontend reads `method` + `url` (+ `form_fields` when POST) to
     * decide whether to redirect the user (Monobank) or to submit a
     * signed form (LiqPay).
     */
    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan_slug' => ['required', 'string', 'exists:plans,slug'],
            'billing_period' => ['required', 'string', 'in:monthly,yearly'],
            'provider' => ['required', 'string', 'in:liqpay,monobank'],
        ]);

        $user = $this->currentUser();
        $plan = Plan::where('slug', $validated['plan_slug'])->where('is_active', true)->firstOrFail();
        $billingPeriod = BillingPeriod::from($validated['billing_period']);
        $provider = PaymentProvider::from($validated['provider']);

        if ($user->subscription?->isActive()) {
            return $this->error('ALREADY_SUBSCRIBED', 'User already has an active subscription.', 422);
        }

        $siteDomain = $user->sites()->orderBy('id')->value('domain');

        /** @var array{reference: string} $pending */
        $pending = DB::transaction(function () use ($user, $plan, $billingPeriod, $siteDomain): array {
            $amount = $billingPeriod === BillingPeriod::Yearly
                ? $plan->price_yearly
                : $plan->price_monthly;

            $order = Order::create([
                'order_number' => $this->orderNumbers->get($siteDomain, $plan->slug),
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'billing_period' => $billingPeriod->value,
                'amount' => $amount,
                'discount_amount' => 0,
                'currency' => 'UAH',
                'status' => OrderStatus::Pending,
                'payment_provider' => null,
            ]);

            Subscription::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'plan_id' => $plan->id,
                    'billing_period' => $billingPeriod->value,
                    'status' => SubscriptionStatus::Pending,
                    'is_trial' => false,
                    'trial_ends_at' => null,
                    'current_period_start' => now(),
                    'current_period_end' => now()->addDays((int) ($plan->trial_days ?? 7)),
                    'payment_provider' => null,
                    'payment_provider_subscription_id' => null,
                    'payment_retry_count' => 0,
                ],
            );

            $subscription = Subscription::where('user_id', $user->id)->first();

            Payment::create([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'subscription_id' => $subscription?->id,
                'type' => PaymentType::Charge->value,
                'amount' => (float) $amount,
                'currency' => 'UAH',
                'status' => PaymentStatus::Pending->value,
                'payment_provider' => null,
                'description' => [
                    'en' => "Subscription: {$plan->slug} ({$billingPeriod->value})",
                    'uk' => "Підписка: {$plan->slug} ({$billingPeriod->value})",
                ],
            ]);

            return ['reference' => $order->order_number];
        });

        // Stamp the selected provider onto all pending rows so logs and
        // admin views immediately show which gateway owns this checkout.
        Order::where('order_number', $pending['reference'])->update(['payment_provider' => $provider]);
        Payment::where('order_id', Order::where('order_number', $pending['reference'])->value('id'))
            ->where('status', PaymentStatus::Pending->value)
            ->update(['payment_provider' => $provider]);

        $result = $this->providers->get($provider)->createSubscriptionCheckout(
            user: $user,
            plan: $plan,
            billingPeriod: $billingPeriod,
            reference: $pending['reference'],
        );

        return $this->success([
            'data' => [
                'provider' => $provider->value,
                'reference' => $pending['reference'],
                'method' => $result->method,
                'url' => $result->url,
                'form_fields' => (object) $result->formFields,
                'provider_reference' => $result->providerReference,
            ],
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
