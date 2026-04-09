<?php

declare(strict_types=1);

namespace App\Services\Billing;

use App\Enums\BillingPeriod;
use App\Enums\SubscriptionStatus;
use App\Jobs\RebuildSiteScriptJob;
use App\Models\ActivityLog;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\SiteWidget;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SubscriptionService
{
    public function createTrial(User $user, Plan $plan): Subscription
    {
        return DB::transaction(function () use ($user, $plan) {
            $trialDays = max(0, (int) ($plan->trial_days ?? 7));
            $trialEnd = now()->addDays($trialDays);

            $subscription = Subscription::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'plan_id' => $plan->id,
                    'billing_period' => BillingPeriod::Monthly->value,
                    'status' => SubscriptionStatus::Trial,
                    'is_trial' => true,
                    'trial_ends_at' => $trialEnd,
                    'current_period_start' => now(),
                    'current_period_end' => $trialEnd,
                ],
            );

            Payment::create([
                'user_id' => $user->id,
                'subscription_id' => $subscription->id,
                'type' => 'trial_activation',
                'amount' => 0,
                'currency' => 'UAH',
                'status' => 'success',
                'description' => ['en' => 'Trial activation', 'uk' => 'Активація тріалу'],
            ]);

            Log::channel('payments')->info('trial.created', [
                'user_id' => $user->id,
                'plan' => $plan->slug,
                'trial_ends_at' => $subscription->trial_ends_at->toIso8601String(),
            ]);

            foreach ($user->sites as $site) {
                RebuildSiteScriptJob::dispatch($site->id);
            }

            return $subscription;
        });
    }

    public function activate(
        User $user,
        Plan $plan,
        BillingPeriod $billingPeriod,
        ?string $paymentProvider = null,
        ?string $providerSubscriptionId = null,
    ): Subscription {
        return DB::transaction(function () use ($user, $plan, $billingPeriod, $paymentProvider, $providerSubscriptionId) {
            $periodEnd = $billingPeriod === BillingPeriod::Yearly
                ? now()->addYear()
                : now()->addMonth();

            $subscription = Subscription::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'plan_id' => $plan->id,
                    'billing_period' => $billingPeriod->value,
                    'status' => SubscriptionStatus::Active,
                    'is_trial' => false,
                    'trial_ends_at' => null,
                    'current_period_start' => now(),
                    'current_period_end' => $periodEnd,
                    'cancelled_at' => null,
                    'cancel_reason' => null,
                    'grace_period_ends_at' => null,
                    'payment_retry_count' => 0,
                    'next_payment_retry_at' => null,
                    'payment_provider' => $paymentProvider,
                    'payment_provider_subscription_id' => $providerSubscriptionId,
                ],
            );

            Log::channel('payments')->info('subscription.activated', [
                'user_id' => $user->id,
                'plan' => $plan->slug,
                'billing_period' => $billingPeriod->value,
            ]);

            return $subscription;
        });
    }

    public function changePlan(Subscription $subscription, Plan $newPlan): Subscription
    {
        return DB::transaction(function () use ($subscription, $newPlan) {
            $oldPlan = $subscription->plan;

            $subscription->update([
                'plan_id' => $newPlan->id,
            ]);

            Log::channel('payments')->info('subscription.plan_changed', [
                'user_id' => $subscription->user_id,
                'old_plan' => $oldPlan->slug,
                'new_plan' => $newPlan->slug,
            ]);

            return $subscription->fresh('plan');
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function calculateProration(Subscription $subscription, Plan $targetPlan): array
    {
        $currentPlan = $subscription->plan;
        $billingPeriod = BillingPeriod::from($subscription->billing_period);

        $currentPrice = $billingPeriod === BillingPeriod::Yearly
            ? (float) $currentPlan->price_yearly / 12
            : (float) $currentPlan->price_monthly;

        $targetPrice = $billingPeriod === BillingPeriod::Yearly
            ? (float) $targetPlan->price_yearly / 12
            : (float) $targetPlan->price_monthly;

        $daysRemaining = $subscription->daysRemainingInPeriod();
        $daysTotal = $subscription->daysInPeriod();
        $proratePercentage = $daysTotal > 0 ? $daysRemaining / $daysTotal : 0;

        $priceDifference = $targetPrice - $currentPrice;
        $amountDueNow = max(0, round($priceDifference * $proratePercentage, 2));

        return [
            'current_plan' => $currentPlan->slug,
            'target_plan' => $targetPlan->slug,
            'price_difference_monthly' => round($priceDifference, 2),
            'days_remaining' => $daysRemaining,
            'days_total' => $daysTotal,
            'prorate_percentage' => round($proratePercentage * 100, 1),
            'amount_due_now' => $amountDueNow,
            'next_billing_amount' => $billingPeriod === BillingPeriod::Yearly
                ? (float) $targetPlan->price_yearly
                : (float) $targetPlan->price_monthly,
            'next_billing_date' => $subscription->current_period_end->toIso8601String(),
        ];
    }

    public function cancel(Subscription $subscription, ?string $reason = null): Subscription
    {
        // If the subscription is backed by LiqPay, cancel it on their side first.
        if (
            $subscription->payment_provider === 'liqpay'
            && $subscription->payment_provider_subscription_id !== null
        ) {
            $liqpay  = new LiqPayService();
            $success = $liqpay->cancelSubscription($subscription->payment_provider_subscription_id);

            if (!$success) {
                Log::channel('payments')->warning('liqpay.unsubscribe_failed', [
                    'user_id'                          => $subscription->user_id,
                    'payment_provider_subscription_id' => $subscription->payment_provider_subscription_id,
                ]);
            }
        }

        $subscription->update([
            'status' => SubscriptionStatus::Cancelled,
            'cancelled_at' => now(),
            'cancel_reason' => $reason,
        ]);

        ActivityLog::create([
            'user_id' => $subscription->user_id,
            'action' => 'subscription.cancelled',
            'entity_type' => 'subscription',
            'entity_id' => $subscription->id,
            'description' => [
                'en' => 'Subscription cancelled',
                'uk' => 'Підписку скасовано',
            ],
            'metadata' => [
                'plan' => $subscription->plan->slug,
                'reason' => $reason,
            ],
            'created_at' => now(),
        ]);

        Log::channel('payments')->info('subscription.cancelled', [
            'user_id' => $subscription->user_id,
            'plan' => $subscription->plan->slug,
            'reason' => $reason,
        ]);

        return $subscription;
    }

    public function expire(Subscription $subscription): void
    {
        $subscription->update([
            'status' => SubscriptionStatus::Expired,
        ]);

        // Disable all widgets for all sites of this user
        $widgetIds = SiteWidget::whereHas('site', function ($q) use ($subscription) {
            $q->where('user_id', $subscription->user_id);
        })
            ->where('is_enabled', true)
            ->pluck('id');

        if ($widgetIds->isNotEmpty()) {
            SiteWidget::whereIn('id', $widgetIds)->update([
                'is_enabled' => false,
                'disabled_at' => now(),
            ]);

            // Rebuild scripts for affected sites
            $subscription->user->sites()->pluck('id')->each(
                fn (int $siteId) => RebuildSiteScriptJob::dispatch($siteId),
            );
        }

        ActivityLog::create([
            'user_id' => $subscription->user_id,
            'action' => 'subscription.expired',
            'entity_type' => 'subscription',
            'entity_id' => $subscription->id,
            'description' => [
                'en' => 'Subscription expired',
                'uk' => 'Підписка закінчилась',
            ],
            'metadata' => [
                'plan' => $subscription->plan?->slug,
            ],
            'created_at' => now(),
        ]);

        Log::channel('payments')->info('subscription.expired', [
            'user_id' => $subscription->user_id,
        ]);
    }

    public function renew(Subscription $subscription): Subscription
    {
        $billingPeriod = BillingPeriod::from($subscription->billing_period);

        $newPeriodEnd = $billingPeriod === BillingPeriod::Yearly
            ? $subscription->current_period_end->addYear()
            : $subscription->current_period_end->addMonth();

        $subscription->update([
            'status' => SubscriptionStatus::Active,
            'current_period_start' => $subscription->current_period_end,
            'current_period_end' => $newPeriodEnd,
            'grace_period_ends_at' => null,
            'payment_retry_count' => 0,
            'next_payment_retry_at' => null,
        ]);

        return $subscription;
    }
}
