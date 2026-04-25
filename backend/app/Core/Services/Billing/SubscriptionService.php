<?php

declare(strict_types=1);

namespace App\Core\Services\Billing;

use App\Core\Events\Billing\SubscriptionCancelled;
use App\Core\Events\Billing\SubscriptionExpired;
use App\Core\Events\Billing\SubscriptionTrialStarted;
use App\Core\Events\Billing\SubscriptionUpgraded;
use App\Core\Models\ActivityLog;
use App\Core\Models\Order;
use App\Core\Models\Payment;
use App\Core\Models\Plan;
use App\Core\Models\Subscription;
use App\Core\Models\User;
use App\Core\Services\Billing\Commands\CancelSubscriptionCommand;
use App\Core\Services\Billing\DTO\UpgradeQuote;
use App\Core\Services\Billing\ValueObjects\ProviderTokens;
use App\Enums\BillingPeriod;
use App\Enums\OrderStatus;
use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\SubscriptionStatus;
use App\Exceptions\UpgradeNotAllowedException;
use App\Shared\Events\Subscription\PlanChanged;
use App\Shared\ValueObjects\UserId;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class SubscriptionService
{
    public function __construct(
        private readonly PaymentProviderRegistry $providers,
    ) {
    }

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
                'type' => PaymentType::TrialActivation->value,
                'amount' => 0,
                'currency' => 'UAH',
                'status' => PaymentStatus::Success->value,
                'description' => ['en' => 'Trial activation', 'uk' => 'Активація тріалу'],
            ]);

            Log::channel('payments')->info('trial.created', [
                'user_id' => $user->id,
                'plan' => $plan->slug,
                'trial_ends_at' => $subscription->trial_ends_at->toIso8601String(),
            ]);

            event(new PlanChanged(UserId::fromString((string) $user->id), null, $plan->slug));

            SubscriptionTrialStarted::dispatch($subscription);

            return $subscription;
        });
    }

    public function activate(
        User $user,
        Plan $plan,
        BillingPeriod $billingPeriod,
        PaymentProvider $paymentProvider,
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
                'provider' => $paymentProvider->value,
            ]);

            event(new PlanChanged(UserId::fromString((string) $user->id), null, $plan->slug));

            return $subscription;
        });
    }

    /**
     * Quote what the user owes to move from their current subscription to a
     * strictly higher plan/period. Credits the unused portion of the last
     * paid order against the target price, floored to whole UAH in the
     * client's favour. Downgrades, no-op transitions, and trial upgrades
     * are rejected here — callers must route them elsewhere.
     */
    public function calculateUpgrade(
        Subscription $subscription,
        Plan $targetPlan,
        BillingPeriod $targetBillingPeriod,
    ): UpgradeQuote {
        if ($subscription->is_trial || $subscription->status === SubscriptionStatus::Trial) {
            throw UpgradeNotAllowedException::trial();
        }

        $currentPlan = $subscription->plan;
        $currentBillingPeriod = BillingPeriod::from($subscription->billing_period);

        if (
            $currentPlan->id === $targetPlan->id
            && $currentBillingPeriod === $targetBillingPeriod
        ) {
            throw UpgradeNotAllowedException::samePlan();
        }

        // Normalize tier comparison by the yearly sticker price — that is
        // the stable signal for "is this plan higher tier". Switching the
        // same plan from monthly to yearly is always allowed (it costs
        // more upfront even though the per-month price drops).
        if (
            $currentPlan->id !== $targetPlan->id
            && (float) $targetPlan->price_yearly <= (float) $currentPlan->price_yearly
        ) {
            throw UpgradeNotAllowedException::downgrade();
        }

        $targetAmount = (int) ($targetBillingPeriod === BillingPeriod::Yearly
            ? (float) $targetPlan->price_yearly
            : (float) $targetPlan->price_monthly);

        $daysRemaining = $subscription->daysRemainingInPeriod();
        $daysTotal = $subscription->daysInPeriod();
        $ratio = $daysTotal > 0 ? min(1.0, max(0.0, $daysRemaining / $daysTotal)) : 0.0;

        $lastPaidOrder = Order::query()
            ->where('user_id', $subscription->user_id)
            ->where('plan_id', $currentPlan->id)
            ->where('billing_period', $currentBillingPeriod->value)
            ->where('status', OrderStatus::Paid)
            ->orderByDesc('paid_at')
            ->first();

        $paidAmount = $lastPaidOrder !== null ? (float) $lastPaidOrder->amount : 0.0;
        $creditApplied = (int) floor($paidAmount * $ratio);
        $amountDue = max(0, $targetAmount - $creditApplied);

        $newPeriodEnd = $targetBillingPeriod === BillingPeriod::Yearly
            ? CarbonImmutable::now()->addYear()
            : CarbonImmutable::now()->addMonth();

        return new UpgradeQuote(
            fromPlanSlug: $currentPlan->slug,
            toPlanSlug: $targetPlan->slug,
            toBillingPeriod: $targetBillingPeriod,
            targetAmount: $targetAmount,
            creditApplied: $creditApplied,
            amountDue: $amountDue,
            daysRemaining: $daysRemaining,
            daysTotal: $daysTotal,
            newPeriodEnd: $newPeriodEnd,
        );
    }

    /**
     * Apply a successful upgrade payment: cancel the previous provider-side
     * recurring subscription (best effort), then swap the existing row to
     * the new plan with a fresh period starting from now.
     *
     * Caller must already have recorded the successful Payment/Order; this
     * method owns only the state transition on the subscription itself.
     */
    /**
     * @param array{
     *     old_payment_provider?: ?string,
     *     old_payment_provider_subscription_id?: ?string,
     *     old_monobank_card_token?: ?string,
     *     old_wayforpay_rec_token?: ?string,
     * }|null $oldProviderSnapshot
     */
    public function applyUpgrade(
        Subscription $subscription,
        Plan $newPlan,
        BillingPeriod $newBillingPeriod,
        PaymentProvider $paymentProvider,
        ?string $providerSubscriptionId = null,
        ?string $monobankCardToken = null,
        ?string $wayforpayRecToken = null,
        ?array $oldProviderSnapshot = null,
    ): Subscription {
        return DB::transaction(function () use (
            $subscription,
            $newPlan,
            $newBillingPeriod,
            $paymentProvider,
            $providerSubscriptionId,
            $monobankCardToken,
            $wayforpayRecToken,
            $oldProviderSnapshot,
        ) {
            $oldPlan = $subscription->plan;

            // The snapshot captured at checkout time is the source of truth
            // for "what recurring was active before this upgrade" — some
            // providers overwrite subscription tokens during their checkout
            // call, so reading them off the row now would be wrong.
            $oldProviderValue = $oldProviderSnapshot['old_payment_provider']
                ?? $subscription->payment_provider?->value;
            $oldProvider = $oldProviderValue !== null
                ? PaymentProvider::tryFrom($oldProviderValue)
                : null;
            $oldProviderSubscriptionId = $oldProviderSnapshot['old_payment_provider_subscription_id']
                ?? $subscription->payment_provider_subscription_id;

            // Best-effort cancellation of the previous recurring binding.
            // We never let a provider error block the upgrade — the user
            // has already paid, and leaving a dangling rec token is a
            // recoverable accounting issue, not a functional failure.
            if ($oldProvider !== null && $this->providers->has($oldProvider)) {
                try {
                    $cancelCmd = new CancelSubscriptionCommand(
                        reference: (string) $subscription->id,
                        tokens: ProviderTokens::of(
                            $oldProviderSubscriptionId,
                            $oldProviderSnapshot['old_wayforpay_rec_token']
                                ?? $subscription->wayforpay_rec_token,
                        ),
                    );

                    $this->providers->get($oldProvider)->cancelSubscription($cancelCmd);
                } catch (Throwable $e) {
                    Log::channel('payments')->warning('subscription.upgrade.old_cancel_failed', [
                        'user_id' => $subscription->user_id,
                        'old_provider' => $oldProvider->value,
                        'old_provider_subscription_id' => $oldProviderSubscriptionId,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            $periodEnd = $newBillingPeriod === BillingPeriod::Yearly
                ? now()->addYear()
                : now()->addMonth();

            $subscription->update([
                'plan_id' => $newPlan->id,
                'billing_period' => $newBillingPeriod->value,
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
                'monobank_card_token' => $monobankCardToken,
                'wayforpay_rec_token' => $wayforpayRecToken,
            ]);

            ActivityLog::create([
                'user_id' => $subscription->user_id,
                'action' => 'subscription.upgraded',
                'entity_type' => 'subscription',
                'entity_id' => $subscription->id,
                'description' => [
                    'en' => 'Subscription upgraded',
                    'uk' => 'Підписку оновлено',
                ],
                'metadata' => [
                    'old_plan' => $oldPlan?->slug,
                    'new_plan' => $newPlan->slug,
                    'new_billing_period' => $newBillingPeriod->value,
                    'provider' => $paymentProvider->value,
                ],
                'created_at' => now(),
            ]);

            Log::channel('payments')->info('subscription.upgraded', [
                'user_id' => $subscription->user_id,
                'old_plan' => $oldPlan?->slug,
                'new_plan' => $newPlan->slug,
                'new_billing_period' => $newBillingPeriod->value,
                'provider' => $paymentProvider->value,
            ]);

            event(new PlanChanged(
                UserId::fromString((string) $subscription->user_id),
                $oldPlan?->slug,
                $newPlan->slug,
            ));

            SubscriptionUpgraded::dispatch($subscription, $oldPlan);

            return $subscription->refresh();
        });
    }

    public function cancel(Subscription $subscription, ?string $reason = null): Subscription
    {
        // Delegate provider-side cancellation through the registry so each
        // adapter owns its own "stop future charges" semantics. Providers
        // without server-side subscriptions (Monobank) simply return true.
        if ($subscription->payment_provider !== null) {
            $cancelCmd = new CancelSubscriptionCommand(
                reference: (string) $subscription->id,
                tokens: ProviderTokens::of(
                    $subscription->payment_provider_subscription_id,
                    $subscription->wayforpay_rec_token,
                ),
            );
            $this->providers->for($subscription)->cancelSubscription($cancelCmd);
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
            'provider' => $subscription->payment_provider?->value,
            'reason' => $reason,
        ]);

        SubscriptionCancelled::dispatch($subscription, $reason);

        return $subscription;
    }

    public function expire(Subscription $subscription): void
    {
        $oldPlanSlug = $subscription->plan?->slug;

        $subscription->update([
            'status' => SubscriptionStatus::Expired,
        ]);

        // Notify WidgetRuntime: plan expired → disable widgets and rebuild scripts.
        // The RebuildScriptOnPlanChanged listener handles this when newPlanSlug is null.
        event(new PlanChanged(
            UserId::fromString((string) $subscription->user_id),
            $oldPlanSlug,
            null,
        ));

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

        SubscriptionExpired::dispatch($subscription);
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
