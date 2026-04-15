<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Profile;

use App\Enums\BillingPeriod;
use App\Enums\OrderStatus;
use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\SiteStatus;
use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Resources\Api\V1\SubscriptionResource;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Site;
use App\Models\Subscription;
use App\Models\User;
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
        $validated = $request->validate([
            'plan_slug'   => ['required', 'string', 'exists:plans,slug'],
            'site_domain' => ['required', 'string', 'max:255'],
            'platform'    => ['nullable', 'string', 'max:100'],
        ]);

        $user = $this->currentUser();

        if ($user->subscription) {
            return $this->error('ALREADY_SUBSCRIBED', 'User already has a subscription.', 409);
        }

        // Ensure site exists for this user.
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
            'plan_slug'      => ['required', 'string', 'exists:plans,slug'],
            'billing_period' => ['required', 'string', 'in:monthly,yearly'],
            'provider'       => ['required', 'string', 'in:liqpay,monobank'],
            'site_domain'    => ['required', 'string', 'max:255'],
            'platform'       => ['nullable', 'string', 'max:100'],
            'redirect_url'   => ['nullable', 'string', 'max:500'],
        ]);

        $user = $this->currentUser();
        $plan = Plan::where('slug', $validated['plan_slug'])->where('is_active', true)->firstOrFail();
        $billingPeriod = BillingPeriod::from($validated['billing_period']);
        $provider = PaymentProvider::from($validated['provider']);

        if ($user->subscription?->isActive()) {
            return $this->error('ALREADY_SUBSCRIBED', 'User already has an active subscription.', 422);
        }

        // Cancel any abandoned pending orders so the user is never stuck.
        // We keep the duplicate-click guard only for the exact same plan+period
        // within a 5-minute window — that prevents double-invoicing on rapid
        // re-clicks without blocking the user from switching plans.
        $stalePendingOrders = Order::where('user_id', $user->id)
            ->where('status', OrderStatus::Pending)
            ->whereDoesntHave('payments', fn ($q) => $q->where('status', PaymentStatus::Failed->value))
            ->get();

        foreach ($stalePendingOrders as $staleOrder) {
            $isSamePlanAndPeriod = $staleOrder->plan_id === $plan->id
                && $staleOrder->billing_period === $billingPeriod->value;

            $isRecentDuplicate = $isSamePlanAndPeriod
                && $staleOrder->created_at >= now()->subMinutes(5);

            if ($isRecentDuplicate) {
                return $this->error('CHECKOUT_IN_PROGRESS', 'A checkout is already in progress. Please wait a moment before trying again.', 429);
            }

            // Different plan/period or older than 5 minutes — cancel and allow new checkout.
            $staleOrder->update(['status' => OrderStatus::Cancelled]);
            $staleOrder->payments()
                ->where('status', PaymentStatus::Pending->value)
                ->update(['status' => PaymentStatus::Failed->value]);
        }

        // Reset a stuck pending subscription so the new checkout can proceed.
        if ($user->subscription?->status === SubscriptionStatus::Pending) {
            $user->subscription->update(['status' => SubscriptionStatus::Cancelled]);
        }

        $siteDomain = $validated['site_domain'];

        /** @var array{reference: string} $pending */
        $pending = DB::transaction(function () use ($user, $plan, $billingPeriod, $siteDomain, $validated, $provider): array {
            // Lock the user row to serialise concurrent checkout calls.
            User::where('id', $user->id)->lockForUpdate()->first();

            // Ensure site exists for this user.
            Site::firstOrCreate(
                ['user_id' => $user->id, 'domain' => $siteDomain],
                [
                    'name'     => $siteDomain,
                    'url'      => 'https://' . $siteDomain,
                    'platform' => $validated['platform'] ?? 'horoshop',
                    'status'   => SiteStatus::Pending,
                ],
            );

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
                'payment_provider' => $provider,
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
                    'payment_provider' => $provider,
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
                'payment_provider' => $provider,
                'description' => [
                    'en' => "Subscription: {$plan->slug} ({$billingPeriod->value})",
                    'uk' => "Підписка: {$plan->slug} ({$billingPeriod->value})",
                ],
            ]);

            return ['reference' => $order->order_number];
        });

        $result = $this->providers->get($provider)->createSubscriptionCheckout(
            user: $user,
            plan: $plan,
            billingPeriod: $billingPeriod,
            reference: $pending['reference'],
            redirectUrl: isset($validated['redirect_url']) ? (string) $validated['redirect_url'] : null,
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

    /**
     * Cancel any pending (unpaid) checkout so the user can start a new one.
     */
    public function cancelPendingCheckout(): JsonResponse
    {
        $user = $this->currentUser();

        $cancelled = Order::where('user_id', $user->id)
            ->where('status', OrderStatus::Pending)
            ->get();

        if ($cancelled->isEmpty()) {
            return $this->error('NO_PENDING_CHECKOUT', 'No pending checkout to cancel.', 404);
        }

        foreach ($cancelled as $order) {
            $order->update(['status' => OrderStatus::Cancelled]);
            $order->payments()
                ->where('status', PaymentStatus::Pending->value)
                ->update(['status' => PaymentStatus::Failed->value]);
        }

        if ($user->subscription?->status === SubscriptionStatus::Pending) {
            $user->subscription->update(['status' => SubscriptionStatus::Cancelled]);
        }

        return $this->success(['message' => 'Pending checkout cancelled.']);
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
