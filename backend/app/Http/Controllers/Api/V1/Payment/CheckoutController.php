<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Payment;

use App\Enums\BillingPeriod;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\SubscriptionStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\Billing\LiqPayService;
use App\Services\Billing\LiqPayWebhookService;
use App\Services\Billing\UniqueOrderNumberProvider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CheckoutController
{
    public function __construct(
        private readonly LiqPayService $liqPayService,
        private readonly LiqPayWebhookService $webhookService,
        private readonly UniqueOrderNumberProvider $orderNumbers,
    ) {
    }

    /**
     * Initiate a subscription checkout via LiqPay.
     *
     * Creates the order, subscription (pending), and payment (pending) immediately.
     * Access is granted only after LiqPay confirms via webhook.
     *
     * On local environment the webhook is emulated automatically.
     */
    public function startTrial(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan_slug' => ['required', 'string', 'exists:plans,slug'],
            'billing_period' => ['required', 'string', 'in:monthly,yearly'],
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();
        $plan = Plan::where('slug', $validated['plan_slug'])->where('is_active', true)->firstOrFail();
        $billingPeriod = BillingPeriod::from($validated['billing_period']);

        $existing = $user->subscription;
        if ($existing && $existing->isActive()) {
            return response()->json([
                'error' => [
                    'code' => 'ALREADY_SUBSCRIBED',
                    'message' => 'User already has an active subscription.',
                ],
            ], 422);
        }

        $siteDomain = $user->sites()->orderBy('id')->value('domain');

        /** @var array{checkout_url: string, data: string, signature: string, order_id: string} $checkout */
        $checkout = DB::transaction(function () use ($user, $plan, $billingPeriod, $siteDomain): array {
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
                'payment_provider' => 'liqpay',
            ]);

            // Subscription starts as pending — access granted only after LiqPay confirms
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

            // Payment starts as pending — updated to success after webhook confirms
            Payment::create([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'subscription_id' => $subscription?->id,
                'type' => PaymentType::Charge->value,
                'amount' => (float) $amount,
                'currency' => 'UAH',
                'status' => PaymentStatus::Pending->value,
                'payment_provider' => 'liqpay',
                'description' => [
                    'en' => "Subscription: {$plan->slug} ({$billingPeriod->value})",
                    'uk' => "Підписка: {$plan->slug} ({$billingPeriod->value})",
                ],
            ]);

            $resultUrl = rtrim((string) config('app.frontend_url', 'http://localhost:5173'), '/')
                . '/signup/success';

            $checkout = $this->liqPayService->createSubscriptionCheckout(
                order: $order,
                plan: $plan,
                billingPeriod: $billingPeriod,
                resultUrl: $resultUrl,
                withTrial: true,
                trialDays: (int) ($plan->trial_days ?? 7),
            );

            Log::channel('payments')->info('checkout.trial.created', [
                'user_id' => $user->id,
                'order_id' => $order->order_number,
                'plan' => $plan->slug,
                'billing_period' => $billingPeriod->value,
                'emulated' => app()->environment('local'),
            ]);

            // On local env LiqPay cannot reach localhost — simulate the webhook immediately
            $emulated = app()->environment('local');
            if ($emulated) {
                $this->webhookService->simulateSuccess($order);
            }

            return array_merge($checkout, ['emulated' => $emulated]);
        });

        return response()->json(['data' => $checkout]);
    }
}
