<?php

declare(strict_types=1);

namespace App\Core\Services\Billing;

use App\Core\Events\Billing\PaymentSucceeded;
use App\Core\Events\Billing\SubscriptionActivated;
use App\Core\Events\Billing\SubscriptionRenewed;
use App\Core\Events\Billing\SubscriptionTrialStarted;
use App\Core\Models\Order;
use App\Core\Models\Payment;
use App\Core\Models\Plan;
use App\Core\Models\Subscription;
use App\Core\Models\User;
use App\Core\Services\Plan\FoundingService;
use App\Enums\BillingPeriod;
use App\Enums\OrderStatus;
use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\SubscriptionStatus;
use App\Exceptions\Plan\AlreadyFoundingException;
use App\Exceptions\Plan\FoundingSlotsExhaustedException;
use Illuminate\Support\Facades\Log;

/**
 * Shared state-transition logic for every payment provider's webhook path.
 *
 * Each provider (Monobank, WayForPay) delivers slightly different
 * webhook shapes but performs the same underlying action: "charge confirmed,
 * activate or renew the subscription, record the payment, mark the order
 * as paid". Keeping that logic in one place prevents the three providers
 * from drifting apart on period-extension math, idempotency rules, or
 * which fields get reset on a successful renewal.
 *
 * Callers are expected to run inside an open DB transaction — this service
 * performs multiple writes and depends on the caller's transaction boundary
 * to stay atomic against concurrent webhook retries.
 */
class SubscriptionActivationService
{
    /**
     * Lazy-resolved to break the circular dependency:
     * MonobankWebhookService → SubscriptionActivationService → SubscriptionService → PaymentProviderRegistry → MonobankProvider → MonobankWebhookService
     */
    public function __construct(
        private readonly \Closure $subscriptionServiceResolver,
        private readonly FoundingService $foundingService,
    ) {
    }

    private function subscriptionService(): SubscriptionService
    {
        return ($this->subscriptionServiceResolver)();
    }

    /**
     * Detect whether an order represents a plan upgrade paid in full.
     *
     * The upgrade flow marks the pending Payment row with PaymentType::Upgrade
     * at checkout time; webhook handlers consult this before routing to the
     * standard activate/renew path so the old plan's recurring binding can
     * be cancelled and the subscription swapped atomically.
     */
    public function isUpgradeOrder(Order $order): bool
    {
        Log::channel('payments')->info('subscription_activation.is_upgrade_order.in', [
            'order_id' => $order->id,
        ]);

        $isUpgrade = Payment::where('order_id', $order->id)
            ->where('type', PaymentType::Upgrade->value)
            ->exists();

        Log::channel('payments')->info('subscription_activation.is_upgrade_order.out', [
            'order_id' => $order->id,
            'is_upgrade_order' => $isUpgrade,
        ]);

        return $isUpgrade;
    }

    /**
     * Finalize an upgrade after a confirmed charge: record the payment as
     * success, mark the order paid, then let SubscriptionService swap the
     * subscription to the target plan (which also cancels the old provider
     * binding and restarts the period from now).
     *
     * @param array<string, mixed> $metadata
     * @param array<string, string>|null $description
     */
    public function applyUpgrade(
        Order $order,
        string $transactionId,
        float $amountUah,
        PaymentProvider $provider,
        ?string $paymentMethod,
        array $metadata,
        ?string $providerSubscriptionId = null,
        ?string $monobankCardToken = null,
        ?string $wayforpayRecToken = null,
        ?array $description = null,
    ): ?Subscription {
        Log::channel('payments')->info('subscription_activation.apply_upgrade.in', [
            'order_id' => $order->id,
            'user_id' => $order->user_id,
            'provider' => $provider->value,
            'transaction_id' => $transactionId,
            'amount_uah' => $amountUah,
        ]);

        if ($order->status === OrderStatus::Cancelled) {
            Log::channel('payments')->warning('subscription_activation.apply_upgrade.out', [
                'order_id' => $order->id,
                'result' => 'skipped_cancelled_order',
            ]);
            return null;
        }

        $order->update([
            'status' => OrderStatus::Paid,
            'transaction_id' => $transactionId,
            'paid_at' => now(),
        ]);

        $payment = Payment::where('order_id', $order->id)
            ->whereIn('status', [PaymentStatus::Pending->value, PaymentStatus::Success->value])
            ->first();

        $paymentAttributes = [
            'status' => PaymentStatus::Success->value,
            'payment_method' => $paymentMethod,
            'transaction_id' => $transactionId,
            'metadata' => $metadata,
        ];

        if ($payment !== null) {
            $payment->update($paymentAttributes);
            $payment->refresh();
        } else {
            $payment = Payment::create(array_merge($paymentAttributes, [
                'user_id' => $order->user_id,
                'order_id' => $order->id,
                'type' => PaymentType::Upgrade->value,
                'amount' => $amountUah,
                'currency' => 'UAH',
                'payment_provider' => $provider,
                'description' => $description ?? [],
            ]));
        }

        PaymentSucceeded::dispatch($payment, $order);

        $subscription = Subscription::where('user_id', $order->user_id)->first();

        if ($subscription === null) {
            Log::channel('payments')->warning('subscription_activation.apply_upgrade.out', [
                'order_id' => $order->id,
                'user_id' => $order->user_id,
                'result' => 'subscription_not_found',
            ]);
            return null;
        }

        $newPlan = Plan::findOrFail($order->plan_id);
        $billingPeriod = BillingPeriod::from($order->billing_period);

        // Notes were populated by the /upgrade controller before the provider
        // could overwrite the subscription's recurring tokens, so they are
        // the trustworthy view of the pre-upgrade provider binding.
        /** @var array<string, mixed> $notes */
        $notes = is_array($order->notes) ? $order->notes : [];
        $snapshot = [
            'old_payment_provider' => isset($notes['old_payment_provider']) ? (string) $notes['old_payment_provider'] : null,
            'old_payment_provider_subscription_id' => isset($notes['old_payment_provider_subscription_id']) ? (string) $notes['old_payment_provider_subscription_id'] : null,
            'old_monobank_card_token' => isset($notes['old_monobank_card_token']) ? (string) $notes['old_monobank_card_token'] : null,
            'old_wayforpay_rec_token' => isset($notes['old_wayforpay_rec_token']) ? (string) $notes['old_wayforpay_rec_token'] : null,
        ];

        $upgradedSubscription = $this->subscriptionService()->applyUpgrade(
            subscription: $subscription,
            newPlan: $newPlan,
            newBillingPeriod: $billingPeriod,
            paymentProvider: $provider,
            providerSubscriptionId: $providerSubscriptionId,
            monobankCardToken: $monobankCardToken,
            wayforpayRecToken: $wayforpayRecToken,
            oldProviderSnapshot: $snapshot,
        );

        Log::channel('payments')->info('subscription_activation.apply_upgrade.out', [
            'order_id' => $order->id,
            'user_id' => $order->user_id,
            'subscription_id' => $upgradedSubscription->id,
            'plan_id' => $upgradedSubscription->plan_id,
            'result' => 'success',
        ]);

        return $upgradedSubscription;
    }

    /**
     * Idempotently activate (first charge) or renew (subsequent charge) a
     * subscription after a confirmed provider-side success. Returns the
     * refreshed Subscription, or null if the user has no subscription row
     * (which only happens on orders from the legacy flow).
     *
     * Metadata scrubbing of sensitive fields (card tokens, wallet data)
     * stays on the caller side because each provider carries different
     * shapes — we accept an already-scrubbed array here.
     *
     * @param array<string, mixed> $metadata
     * @param array<string, string>|null $description
     */
    public function activateOrRenew(
        Order $order,
        string $transactionId,
        float $amountUah,
        PaymentProvider $provider,
        ?string $paymentMethod,
        array $metadata,
        ?string $providerSubscriptionId = null,
        ?string $monobankCardToken = null,
        ?string $wayforpayRecToken = null,
        ?array $description = null,
    ): ?Subscription {
        Log::channel('payments')->info('subscription_activation.activate_or_renew.in', [
            'order_id' => $order->id,
            'user_id' => $order->user_id,
            'provider' => $provider->value,
            'transaction_id' => $transactionId,
            'amount_uah' => $amountUah,
            'metadata_keys' => array_keys($metadata),
        ]);

        // If the user started a new checkout after abandoning this one, the
        // order was cancelled. Do not activate — flag for manual review.
        if ($order->status === OrderStatus::Cancelled) {
            Log::channel('payments')->warning('subscription_activation.activate_or_renew.out', [
                'order_id' => $order->id,
                'result' => 'skipped_cancelled_order',
            ]);
            return null;
        }

        $order->update([
            'status' => OrderStatus::Paid,
            'transaction_id' => $transactionId,
            'paid_at' => now(),
        ]);

        // Idempotent payment upsert: providers retry success webhooks, so
        // matching BOTH pending and prior-success rows prevents a duplicate
        // when a retry lands after the original already advanced the row.
        $payment = Payment::where('order_id', $order->id)
            ->whereIn('status', [PaymentStatus::Pending->value, PaymentStatus::Success->value])
            ->first();

        $paymentAttributes = [
            'status' => PaymentStatus::Success->value,
            'payment_method' => $paymentMethod,
            'transaction_id' => $transactionId,
            'metadata' => $metadata,
        ];

        if ($payment !== null) {
            $payment->update($paymentAttributes);
            $payment->refresh();
        } else {
            $payment = Payment::create(array_merge($paymentAttributes, [
                'user_id' => $order->user_id,
                'order_id' => $order->id,
                'type' => PaymentType::Charge->value,
                'amount' => $amountUah,
                'currency' => 'UAH',
                'payment_provider' => $provider,
                'description' => $description ?? [],
            ]));
        }

        PaymentSucceeded::dispatch($payment, $order);

        $subscription = Subscription::where('user_id', $order->user_id)->first();

        if ($subscription === null) {
            Log::channel('payments')->warning('subscription_activation.activate_or_renew.out', [
                'order_id' => $order->id,
                'user_id' => $order->user_id,
                'result' => 'subscription_not_found',
            ]);
            return null;
        }

        $billingPeriod = BillingPeriod::from($order->billing_period);

        // On renewal, extend from the existing period_end so any paid-for
        // tail isn't thrown away. A subscription counts as a renewal as
        // long as the paid-for window has not fully elapsed — including
        // PastDue rows (a failed charge followed by a successful retry
        // must still honour the days the customer already paid for) and
        // Trial rows (the first scheduled regular charge lands while the
        // trial is still nominally active and must extend the clock
        // instead of resetting it).
        $isRenewal = in_array(
            $subscription->status,
            [
                SubscriptionStatus::Active,
                SubscriptionStatus::PastDue,
                SubscriptionStatus::Trial,
            ],
            true,
        ) && $subscription->current_period_end->isFuture();

        if ($isRenewal) {
            $periodStart = $subscription->current_period_end;
            $periodEnd = $billingPeriod === BillingPeriod::Yearly
                ? $periodStart->copy()->addYear()
                : $periodStart->copy()->addMonth();
        } else {
            $periodStart = now();
            $periodEnd = $billingPeriod === BillingPeriod::Yearly
                ? now()->addYear()
                : now()->addMonth();
        }

        $updates = [
            'status' => SubscriptionStatus::Active,
            'is_trial' => false,
            'trial_ends_at' => null,
            'current_period_start' => $periodStart,
            'current_period_end' => $periodEnd,
            'payment_provider' => $provider,
            'payment_retry_count' => 0,
            'next_payment_retry_at' => null,
            'grace_period_ends_at' => null,
        ];

        if ($providerSubscriptionId !== null && $providerSubscriptionId !== '') {
            $updates['payment_provider_subscription_id'] = $providerSubscriptionId;
        }

        if ($monobankCardToken !== null && $monobankCardToken !== '') {
            $updates['monobank_card_token'] = $monobankCardToken;
        }

        if ($wayforpayRecToken !== null && $wayforpayRecToken !== '') {
            $updates['wayforpay_rec_token'] = $wayforpayRecToken;
        }

        $subscription->update($updates);

        // Founding offer: claim a slot for first-time Pro activations that were
        // charged at the founding price (order.notes.founding_price = true).
        // Idempotent: AlreadyFoundingException is swallowed so webhook retries
        // cannot break the ACK. FoundingSlotsExhaustedException is also swallowed
        // — the slot count may have dropped between checkout and payment confirm;
        // the user already paid the discounted amount so we honour it silently.
        if (! $isRenewal && $subscription->plan?->slug === 'pro') {
            $rawNotes = $order->notes;
            /** @var array<string, mixed> $notes */
            $notes = is_array($rawNotes) ? $rawNotes : [];
            if (! empty($notes['founding_price'])) {
                $user = User::find($order->user_id);
                if ($user !== null) {
                    try {
                        $this->foundingService->claimSlot($user);
                        Log::channel('payments')->info('founding.slot_claimed', [
                            'user_id' => $user->id,
                            'order_id' => $order->id,
                        ]);
                    } catch (AlreadyFoundingException) {
                        // User already has a founding slot — idempotent, ignore.
                    } catch (FoundingSlotsExhaustedException) {
                        // Race condition: slots ran out between checkout and webhook.
                        // User paid founding price; honour the discount, skip the flag.
                        Log::channel('payments')->warning('founding.slots_exhausted_on_claim', [
                            'user_id' => $order->user_id,
                            'order_id' => $order->id,
                        ]);
                    }
                }
            }
        }

        if ($isRenewal) {
            SubscriptionRenewed::dispatch($subscription);
        } else {
            SubscriptionActivated::dispatch($subscription);
        }

        $updatedSubscription = $subscription->refresh();

        Log::channel('payments')->info('subscription_activation.activate_or_renew.out', [
            'order_id' => $order->id,
            'user_id' => $order->user_id,
            'subscription_id' => $updatedSubscription->id,
            'status' => $updatedSubscription->status->value,
            'result' => $isRenewal ? 'renewed' : 'activated',
        ]);

        return $updatedSubscription;
    }

    /**
     * Activate a trial period: record a zero-amount TrialActivation payment
     * and flip the subscription to Trial state with the configured window.
     *
     * Used by providers that capture a recurring token up front and defer
     * the first real charge until the trial ends (WayForPay). Monobank
     * goes straight from Pending → Active via activateOrRenew since there is
     * no trial path on its side.
     *
     * @param array<string, string> $description i18n payload description
     */
    public function activateTrial(
        Subscription $subscription,
        PaymentProvider $provider,
        int $trialDays,
        ?string $providerSubscriptionId = null,
        ?string $wayforpayRecToken = null,
        array $description = ['en' => 'Trial activation', 'uk' => 'Активація тріалу'],
    ): Subscription {
        Log::channel('payments')->info('subscription_activation.activate_trial.in', [
            'subscription_id' => $subscription->id,
            'user_id' => $subscription->user_id,
            'provider' => $provider->value,
            'trial_days' => $trialDays,
        ]);

        $trialEnd = now()->addDays(max(0, $trialDays));

        $updates = [
            'status' => SubscriptionStatus::Trial,
            'is_trial' => true,
            'trial_ends_at' => $trialEnd,
            'current_period_start' => now(),
            'current_period_end' => $trialEnd,
            'payment_provider' => $provider,
        ];

        if ($providerSubscriptionId !== null && $providerSubscriptionId !== '') {
            $updates['payment_provider_subscription_id'] = $providerSubscriptionId;
        }

        if ($wayforpayRecToken !== null && $wayforpayRecToken !== '') {
            $updates['wayforpay_rec_token'] = $wayforpayRecToken;
        }

        $subscription->update($updates);

        // Zero-amount Payment row marks the trial start in the user's
        // payment history without affecting any accounting totals.
        Payment::firstOrCreate(
            [
                'user_id' => $subscription->user_id,
                'type' => PaymentType::TrialActivation->value,
            ],
            [
                'subscription_id' => $subscription->id,
                'amount' => 0,
                'currency' => 'UAH',
                'status' => PaymentStatus::Success->value,
                'payment_provider' => $provider,
                'description' => $description,
            ],
        );

        SubscriptionTrialStarted::dispatch($subscription);

        $updatedSubscription = $subscription->refresh();

        Log::channel('payments')->info('subscription_activation.activate_trial.out', [
            'subscription_id' => $updatedSubscription->id,
            'user_id' => $updatedSubscription->user_id,
            'status' => $updatedSubscription->status->value,
            'trial_ends_at' => $updatedSubscription->trial_ends_at?->toIso8601String(),
            'result' => 'success',
        ]);

        return $updatedSubscription;
    }

    /**
     * Renew a subscription from a recurring charge that arrives without an
     * Order (e.g. Monobank scheduled renewals carry no reference).
     *
     * Records the payment against the subscription directly and extends
     * the billing period using the same logic as activateOrRenew().
     *
     * @param array<string, mixed> $metadata
     * @param array<string, string>|null $description
     */
    public function renewBySubscription(
        Subscription $subscription,
        string $transactionId,
        float $amountUah,
        PaymentProvider $provider,
        ?string $paymentMethod,
        array $metadata,
        ?array $description = null,
    ): Subscription {
        Log::channel('payments')->info('subscription_activation.renew_by_subscription.in', [
            'subscription_id' => $subscription->id,
            'user_id' => $subscription->user_id,
            'provider' => $provider->value,
            'transaction_id' => $transactionId,
            'amount_uah' => $amountUah,
            'metadata_keys' => array_keys($metadata),
        ]);

        $payment = Payment::create([
            'user_id' => $subscription->user_id,
            'subscription_id' => $subscription->id,
            'type' => PaymentType::Charge->value,
            'amount' => $amountUah,
            'currency' => 'UAH',
            'status' => PaymentStatus::Success->value,
            'payment_provider' => $provider,
            'payment_method' => $paymentMethod,
            'transaction_id' => $transactionId,
            'description' => $description ?? [],
            'metadata' => $metadata,
        ]);

        PaymentSucceeded::dispatch($payment);

        $billingPeriod = BillingPeriod::from($subscription->billing_period);

        $isRenewal = in_array(
            $subscription->status,
            [
                SubscriptionStatus::Active,
                SubscriptionStatus::PastDue,
                SubscriptionStatus::Trial,
            ],
            true,
        ) && $subscription->current_period_end->isFuture();

        if ($isRenewal) {
            $periodStart = $subscription->current_period_end;
            $periodEnd = $billingPeriod === BillingPeriod::Yearly
                ? $periodStart->copy()->addYear()
                : $periodStart->copy()->addMonth();
        } else {
            $periodStart = now();
            $periodEnd = $billingPeriod === BillingPeriod::Yearly
                ? now()->addYear()
                : now()->addMonth();
        }

        $subscription->update([
            'status' => SubscriptionStatus::Active,
            'is_trial' => false,
            'trial_ends_at' => null,
            'current_period_start' => $periodStart,
            'current_period_end' => $periodEnd,
            'payment_provider' => $provider,
            'payment_retry_count' => 0,
            'next_payment_retry_at' => null,
            'grace_period_ends_at' => null,
        ]);

        if ($isRenewal) {
            SubscriptionRenewed::dispatch($subscription);
        } else {
            SubscriptionActivated::dispatch($subscription);
        }

        $updatedSubscription = $subscription->refresh();

        Log::channel('payments')->info('subscription_activation.renew_by_subscription.out', [
            'subscription_id' => $updatedSubscription->id,
            'user_id' => $updatedSubscription->user_id,
            'status' => $updatedSubscription->status->value,
            'result' => $isRenewal ? 'renewed' : 'activated',
        ]);

        return $updatedSubscription;
    }
}
