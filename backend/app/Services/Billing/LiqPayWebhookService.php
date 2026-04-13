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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LiqPayWebhookService
{
    public function __construct(
        private readonly LiqPayService $liqPayService,
    ) {
    }

    /**
     * Process an incoming LiqPay callback.
     * Returns false if signature is invalid.
     */
    public function process(string $data, string $signature): bool
    {
        if (! $this->liqPayService->verifySignature($data, $signature)) {
            return false;
        }

        $payload = $this->liqPayService->decodeCallbackData($data);
        $this->dispatch($payload);

        return true;
    }

    /**
     * Simulate a successful LiqPay webhook for a given order.
     * Only call this in local/testing environments.
     *
     * Fires `subscribed` (card linked → trial starts) then
     * `success` (charge confirmed → subscription active).
     */
    public function simulateSuccess(Order $order): void
    {
        $subscribedPayload = $this->buildFakePayload($order, 'subscribed');
        $successPayload = $this->buildFakePayload($order, 'success');

        Log::channel('payments')->info('liqpay.emulator.simulate', [
            'order_id' => $order->order_number,
        ]);

        DB::transaction(function () use ($order, $subscribedPayload, $successPayload): void {
            $this->handleSubscribed($order, $subscribedPayload);
            $this->handleSuccess($order, $successPayload);
        });
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function dispatch(array $payload): void
    {
        $status = (string) ($payload['status'] ?? '');
        $orderNumber = (string) ($payload['order_id'] ?? '');

        Log::channel('payments')->info('liqpay.webhook.received', [
            'order_id' => $orderNumber,
            'status' => $status,
            'action' => $payload['action'] ?? null,
            'amount' => $payload['amount'] ?? null,
        ]);

        if ($orderNumber === '') {
            return;
        }

        $order = Order::where('order_number', $orderNumber)->first();

        if ($order === null) {
            Log::channel('payments')->error('liqpay.webhook.order_not_found', [
                'order_id' => $orderNumber,
            ]);

            return;
        }

        DB::transaction(function () use ($order, $payload, $status): void {
            match ($status) {
                'subscribed' => $this->handleSubscribed($order, $payload),
                'success', 'sandbox' => $this->handleSuccess($order, $payload),
                'failure', 'error' => $this->handleFailure($order, $payload),
                'unsubscribed' => $this->handleUnsubscribed($order, $payload),
                default => null,
            };
        });
    }

    /**
     * Card linked → subscription moves from pending to trial.
     *
     * @param array<string, mixed> $payload
     */
    private function handleSubscribed(Order $order, array $payload): void
    {
        $subscription = Subscription::where('user_id', $order->user_id)->first();

        if ($subscription === null) {
            return;
        }

        $trialDays = (int) ($subscription->plan->trial_days ?? 7);
        $trialEnd = now()->addDays($trialDays);

        $subscription->update([
            'status' => SubscriptionStatus::Trial,
            'is_trial' => true,
            'trial_ends_at' => $trialEnd,
            'current_period_start' => now(),
            'current_period_end' => $trialEnd,
            'payment_provider' => PaymentProvider::LiqPay,
            'payment_provider_subscription_id' => (string) ($payload['subscrId'] ?? ''),
        ]);

        // Record the trial activation as a zero-amount payment
        Payment::firstOrCreate(
            ['user_id' => $order->user_id, 'type' => PaymentType::TrialActivation->value],
            [
                'subscription_id' => $subscription->id,
                'amount' => 0,
                'currency' => 'UAH',
                'status' => PaymentStatus::Success->value,
                'description' => ['en' => 'Trial activation', 'uk' => 'Активація тріалу'],
            ],
        );

        Log::channel('payments')->info('liqpay.subscription.linked', [
            'user_id' => $order->user_id,
            'order_id' => $order->order_number,
            'subscr_id' => $payload['subscrId'] ?? null,
            'trial_ends_at' => $trialEnd->toIso8601String(),
        ]);
    }

    /**
     * Charge succeeded → mark payment success, activate subscription.
     *
     * @param array<string, mixed> $payload
     */
    private function handleSuccess(Order $order, array $payload): void
    {
        $order->update([
            'status' => OrderStatus::Paid,
            'transaction_id' => (string) ($payload['transaction_id'] ?? ''),
            'paid_at' => now(),
        ]);

        // Idempotent lookup: LiqPay retries `success` webhooks freely, so we
        // must match BOTH the original pending row and any prior success row
        // — otherwise a retry leaves no pending payment to update and the
        // fallback branch would create a duplicate.
        $payment = Payment::where('order_id', $order->id)
            ->whereIn('status', [PaymentStatus::Pending->value, PaymentStatus::Success->value])
            ->first();

        if ($payment !== null) {
            $payment->update([
                'status' => PaymentStatus::Success->value,
                'payment_method' => $payload['paytype'] ?? null,
                'transaction_id' => (string) ($payload['transaction_id'] ?? ''),
                'metadata' => $payload,
            ]);
        } else {
            // Fallback: create a new success payment if pending one is missing
            Payment::create([
                'user_id' => $order->user_id,
                'order_id' => $order->id,
                'type' => PaymentType::Charge->value,
                'amount' => $payload['amount'] ?? $order->amount,
                'currency' => $payload['currency'] ?? 'UAH',
                'status' => PaymentStatus::Success->value,
                'payment_provider' => PaymentProvider::LiqPay,
                'payment_method' => $payload['paytype'] ?? null,
                'transaction_id' => (string) ($payload['transaction_id'] ?? ''),
                'description' => ['liqpay_description' => $payload['description'] ?? ''],
                'metadata' => $payload,
            ]);
        }

        $subscription = Subscription::where('user_id', $order->user_id)->first();

        if ($subscription !== null) {
            $billingPeriod = BillingPeriod::from($order->billing_period);

            // On renewal, extend from the existing period_end so any
            // paid-for tail isn't thrown away (a monthly cycle fired at
            // T-1d would otherwise silently lose 24h every renewal).
            $isRenewal = $subscription->status === SubscriptionStatus::Active
                && $subscription->current_period_end?->isFuture();

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
                'payment_provider' => PaymentProvider::LiqPay,
                'payment_provider_subscription_id' => (string) ($payload['subscrId'] ?? $subscription->payment_provider_subscription_id ?? ''),
                'payment_retry_count' => 0,
                'next_payment_retry_at' => null,
                'grace_period_ends_at' => null,
            ]);
        }

        Log::channel('payments')->info('liqpay.payment.success', [
            'user_id' => $order->user_id,
            'order_id' => $order->order_number,
            'amount' => $payload['amount'] ?? null,
            'transaction_id' => $payload['transaction_id'] ?? null,
        ]);
    }

    /**
     * Charge failed → mark payment failed, subscription past_due.
     *
     * @param array<string, mixed> $payload
     */
    private function handleFailure(Order $order, array $payload): void
    {
        $payment = Payment::where('order_id', $order->id)
            ->where('status', PaymentStatus::Pending->value)
            ->first();

        if ($payment !== null) {
            $payment->update([
                'status' => PaymentStatus::Failed->value,
                'transaction_id' => (string) ($payload['transaction_id'] ?? ''),
                'metadata' => $payload,
            ]);
        } else {
            Payment::create([
                'user_id' => $order->user_id,
                'order_id' => $order->id,
                'type' => PaymentType::Charge->value,
                'amount' => $payload['amount'] ?? $order->amount,
                'currency' => $payload['currency'] ?? 'UAH',
                'status' => PaymentStatus::Failed->value,
                'payment_provider' => PaymentProvider::LiqPay,
                'payment_method' => $payload['paytype'] ?? null,
                'transaction_id' => (string) ($payload['transaction_id'] ?? ''),
                'description' => ['err_description' => $payload['err_description'] ?? ''],
                'metadata' => $payload,
            ]);
        }

        $subscription = Subscription::where('user_id', $order->user_id)->first();

        if ($subscription !== null) {
            $subscription->update([
                'status' => SubscriptionStatus::PastDue,
                'grace_period_ends_at' => now()->addDays(3),
            ]);
        }

        Log::channel('payments')->warning('liqpay.payment.failed', [
            'user_id' => $order->user_id,
            'order_id' => $order->order_number,
            'err_description' => $payload['err_description'] ?? null,
        ]);
    }

    /**
     * Subscription cancelled on LiqPay side.
     *
     * @param array<string, mixed> $payload
     */
    private function handleUnsubscribed(Order $order, array $payload): void
    {
        $subscription = Subscription::where('user_id', $order->user_id)->first();

        if ($subscription !== null) {
            $subscription->update([
                'status' => SubscriptionStatus::Cancelled,
                'cancelled_at' => now(),
            ]);
        }

        Log::channel('payments')->info('liqpay.subscription.unsubscribed', [
            'user_id' => $order->user_id,
            'order_id' => $order->order_number,
        ]);
    }

    /**
     * Build a fake signed LiqPay payload for local emulation.
     *
     * @return array<string, mixed>
     */
    private function buildFakePayload(Order $order, string $status): array
    {
        return [
            'order_id' => $order->order_number,
            'status' => $status,
            'action' => 'subscribe',
            'amount' => (float) $order->amount,
            'currency' => $order->currency,
            'transaction_id' => 'EMULATED-' . strtoupper(substr(md5($order->order_number . $status), 0, 12)),
            'subscrId' => 'EMULATED-SUBSCR-' . $order->id,
            'paytype' => 'card',
            'description' => "Widgetis emulator: {$status}",
        ];
    }
}
