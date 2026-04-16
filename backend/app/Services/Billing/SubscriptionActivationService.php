<?php

declare(strict_types=1);

namespace App\Services\Billing;

use App\Enums\BillingPeriod;
use App\Enums\OrderStatus;
use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\SubscriptionStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Subscription;

/**
 * Shared state-transition logic for every payment provider's webhook path.
 *
 * Each provider (LiqPay, Monobank, WayForPay) delivers slightly different
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
        // If the user started a new checkout after abandoning this one, the
        // order was cancelled. Do not activate — flag for manual review.
        if ($order->status === OrderStatus::Cancelled) {
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
        } else {
            Payment::create(array_merge($paymentAttributes, [
                'user_id' => $order->user_id,
                'order_id' => $order->id,
                'type' => PaymentType::Charge->value,
                'amount' => $amountUah,
                'currency' => 'UAH',
                'payment_provider' => $provider,
                'description' => $description ?? [],
            ]));
        }

        $subscription = Subscription::where('user_id', $order->user_id)->first();

        if ($subscription === null) {
            return null;
        }

        $billingPeriod = BillingPeriod::from($order->billing_period);

        // On renewal, extend from the existing period_end so any paid-for
        // tail isn't thrown away (a monthly cycle fired at T-1d would
        // otherwise silently lose 24h every renewal).
        $isRenewal = $subscription->status === SubscriptionStatus::Active
            && $subscription->current_period_end->isFuture();

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

        return $subscription->refresh();
    }

    /**
     * Activate a trial period: record a zero-amount TrialActivation payment
     * and flip the subscription to Trial state with the configured window.
     *
     * Used by providers that capture a recurring token up front and defer
     * the first real charge until the trial ends (LiqPay, WayForPay). Monobank
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

        return $subscription->refresh();
    }
}
