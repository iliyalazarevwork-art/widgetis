<?php

declare(strict_types=1);

namespace App\Services\Billing;

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

/**
 * Handles WayForPay serviceUrl callbacks.
 *
 * WayForPay sends a single webhook format for Purchase, CHARGE, and REFUND
 * transactions — the `transactionStatus` field distinguishes them. We
 * dispatch on that value and delegate state transitions to the shared
 * SubscriptionActivationService so LiqPay / Monobank / WayForPay flows stay
 * symmetric and cannot drift apart on period-extension math.
 *
 * After processing, WayForPay expects a signed JSON acknowledgement in
 * the HTTP response body, otherwise it retries for up to 24h. The
 * controller reads buildAcknowledgement() via WayForPayService and ships
 * it back verbatim.
 *
 * Process contract: returns an optional order_reference the controller
 * uses to craft the signed ACK. Signature validation happens BEFORE
 * process() is called — if it fails the controller short-circuits
 * without involving this service.
 */
class WayForPayWebhookService
{
    public function __construct(
        private readonly WayForPayService $wayForPayService,
        private readonly SubscriptionActivationService $activation,
        private readonly PaymentFailureHandler $failureHandler,
    ) {
    }

    /**
     * @param array<string, mixed> $payload
     *
     * @return array{order_reference: ?string, status: string}
     */
    public function process(array $payload): array
    {
        $orderReference = isset($payload['orderReference']) ? (string) $payload['orderReference'] : null;
        $transactionStatus = isset($payload['transactionStatus']) ? (string) $payload['transactionStatus'] : '';

        Log::channel('payments')->info('wayforpay.webhook.received', [
            'order_reference' => $orderReference,
            'transaction_status' => $transactionStatus,
            'reason_code' => $payload['reasonCode'] ?? null,
            'amount' => $payload['amount'] ?? null,
        ]);

        if ($orderReference === null || $orderReference === '') {
            return ['order_reference' => null, 'status' => 'ignored'];
        }

        $order = Order::where('order_number', $orderReference)->first();

        if ($order === null) {
            Log::channel('payments')->error('wayforpay.webhook.order_not_found', [
                'order_reference' => $orderReference,
            ]);

            return ['order_reference' => $orderReference, 'status' => 'ignored'];
        }

        $status = DB::transaction(function () use ($order, $payload, $transactionStatus): string {
            return match ($transactionStatus) {
                'Approved'    => $this->handleApproved($order, $payload),
                'Declined',
                'Expired'     => $this->handleDeclined($order, $payload, $transactionStatus),
                'Refunded',
                'Voided'      => $this->handleRefunded($order, $payload, $transactionStatus),
                'InProcessing',
                'Pending'     => 'pending',
                default       => 'ignored',
            };
        });

        return ['order_reference' => $orderReference, 'status' => $status];
    }

    /**
     * Approved webhook lands in two scenarios:
     *  1. Initial Purchase: the trial activation charge (1 UAH by default)
     *     returned a recToken. We flip the subscription to Trial and, if
     *     the auto-refund setting is on, fire a best-effort REFUND so the
     *     customer's trial stays cost-neutral.
     *  2. Recurring CHARGE: a merchant-initiated charge against the saved
     *     recToken settled. We activate/renew the subscription for the
     *     paid billing period.
     *
     * The distinction is made on the payment row's PaymentType: the
     * checkout handler creates a `charge` row; if we see that same row
     * still Pending AND the subscription has no rec token yet, this
     * webhook is the trial activation. Otherwise it is a renewal.
     *
     * @param array<string, mixed> $payload
     */
    private function handleApproved(Order $order, array $payload): string
    {
        $subscription = Subscription::where('user_id', $order->user_id)->first();

        // Idempotency: if we've already recorded a successful payment for
        // this exact orderReference AND this exact authCode, the webhook
        // is a retry of one we already processed. Drop it.
        $authCode = isset($payload['authCode']) ? (string) $payload['authCode'] : '';
        $existing = Payment::where('order_id', $order->id)
            ->where('status', PaymentStatus::Success->value)
            ->where('transaction_id', $authCode)
            ->first();

        if ($existing !== null) {
            return 'duplicate';
        }

        $recToken = isset($payload['recToken']) ? (string) $payload['recToken'] : '';
        $amountUah = (float) ($payload['amount'] ?? $order->amount);

        // Scrubbed metadata — keep the full payload for ops visibility but
        // strip the duplicate recToken field, which is already stored as a
        // first-class column on the subscription and should not be copied
        // into a wide-blast-radius JSON log.
        $scrubbed = $payload;
        unset($scrubbed['recToken']);

        $isTrialActivation = $subscription !== null
            && $subscription->status === SubscriptionStatus::Pending
            && ($subscription->wayforpay_rec_token === null || $subscription->wayforpay_rec_token === '');

        if ($isTrialActivation) {
            // Persist the rec token right away so a subsequent webhook
            // retry that hits the renewal branch can still find it.
            $subscription->update(['wayforpay_rec_token' => $recToken]);

            // Record the 1 UAH verification charge on the user's payment
            // history, then flip the pending payment row so the history
            // reflects a settled transaction with a transaction id.
            $pending = Payment::where('order_id', $order->id)
                ->whereIn('status', [PaymentStatus::Pending->value, PaymentStatus::Success->value])
                ->first();

            if ($pending !== null) {
                $pending->update([
                    'status' => PaymentStatus::Success->value,
                    'amount' => $amountUah,
                    'payment_method' => (string) ($payload['paymentSystem'] ?? 'card'),
                    'transaction_id' => $authCode,
                    'metadata' => $scrubbed,
                ]);
            } else {
                Payment::create([
                    'user_id' => $order->user_id,
                    'order_id' => $order->id,
                    'subscription_id' => $subscription->id,
                    'type' => PaymentType::Charge->value,
                    'amount' => $amountUah,
                    'currency' => 'UAH',
                    'status' => PaymentStatus::Success->value,
                    'payment_provider' => PaymentProvider::WayForPay,
                    'payment_method' => (string) ($payload['paymentSystem'] ?? 'card'),
                    'transaction_id' => $authCode,
                    'description' => ['wayforpay' => 'trial activation'],
                    'metadata' => $scrubbed,
                ]);
            }

            // Mark order as paid for the 1 UAH verification — the real plan
            // charge happens via a fresh Order created by the renewal cron.
            $order->update([
                'status' => OrderStatus::Paid,
                'transaction_id' => $authCode,
                'paid_at' => now(),
            ]);

            $trialDays = (int) ($subscription->plan->trial_days ?? 7);

            $this->activation->activateTrial(
                subscription: $subscription,
                provider: PaymentProvider::WayForPay,
                trialDays: $trialDays,
                providerSubscriptionId: $authCode,
                wayforpayRecToken: $recToken,
            );

            // Fire-and-forget refund so net cost of trial activation is 0.
            // Failures are logged inside WayForPayService::refund and do
            // not block the trial — the operator can reconcile later.
            //
            // Skip the refund call entirely when the verification charge
            // was zero. WayForPay's RefundWizard rejects zero amounts as
            // "missing argument" and a zero-amount refund has no business
            // meaning anyway (you can't refund what wasn't charged).
            if ($amountUah > 0 && (bool) config('services.wayforpay.auto_refund_trial', true)) {
                $this->wayForPayService->refund(
                    orderReference: $order->order_number,
                    amount: $amountUah,
                    comment: 'Widgetis trial activation auto-refund',
                );
            }

            Log::channel('payments')->info('wayforpay.trial.activated', [
                'user_id' => $order->user_id,
                'order_reference' => $order->order_number,
                'trial_ends_at' => $subscription->fresh()?->trial_ends_at?->toIso8601String(),
            ]);

            return 'trial_activated';
        }

        // Renewal or first real charge — route through the shared service.
        $this->activation->activateOrRenew(
            order: $order,
            transactionId: $authCode !== '' ? $authCode : $order->order_number,
            amountUah: $amountUah,
            provider: PaymentProvider::WayForPay,
            paymentMethod: (string) ($payload['paymentSystem'] ?? 'card'),
            metadata: $scrubbed,
            providerSubscriptionId: $authCode !== '' ? $authCode : null,
            wayforpayRecToken: $recToken !== '' ? $recToken : null,
            description: ['wayforpay' => (string) ($payload['reason'] ?? 'Approved')],
        );

        Log::channel('payments')->info('wayforpay.payment.success', [
            'user_id' => $order->user_id,
            'order_reference' => $order->order_number,
            'auth_code' => $authCode,
            'amount' => $amountUah,
        ]);

        return 'activated';
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function handleDeclined(Order $order, array $payload, string $transactionStatus): string
    {
        $authCode = (string) ($payload['authCode'] ?? '');

        // Flip the pending payment row (created at checkout) to failed rather
        // than inserting a brand new one — otherwise the user ends up with a
        // stale pending row forever and an orphan failed row next to it.
        $payment = Payment::where('order_id', $order->id)
            ->where('status', PaymentStatus::Pending->value)
            ->first();

        $failedAttributes = [
            'status' => PaymentStatus::Failed->value,
            'transaction_id' => $authCode,
            'metadata' => $payload,
        ];

        if ($payment !== null) {
            $payment->update($failedAttributes);
        } else {
            Payment::create(array_merge($failedAttributes, [
                'user_id' => $order->user_id,
                'order_id' => $order->id,
                'type' => PaymentType::Charge->value,
                'amount' => (float) ($payload['amount'] ?? $order->amount),
                'currency' => 'UAH',
                'payment_provider' => PaymentProvider::WayForPay,
                'description' => [
                    'wayforpay_status' => $transactionStatus,
                    'reason' => (string) ($payload['reason'] ?? ''),
                    'reason_code' => (string) ($payload['reasonCode'] ?? ''),
                ],
            ]));
        }

        $this->failureHandler->handle($order);

        Log::channel('payments')->warning('wayforpay.payment.failed', [
            'user_id' => $order->user_id,
            'order_reference' => $order->order_number,
            'transaction_status' => $transactionStatus,
            'reason' => $payload['reason'] ?? null,
        ]);

        return 'failed';
    }

    /**
     * Refunded webhooks come in two shapes: the auto-refund we fire after
     * trial activation (expected, no-op) and an operator-triggered refund
     * against a live subscription (cancel it cleanly).
     *
     * @param array<string, mixed> $payload
     */
    private function handleRefunded(Order $order, array $payload, string $transactionStatus): string
    {
        Payment::create([
            'user_id' => $order->user_id,
            'order_id' => $order->id,
            'type' => PaymentType::Refund->value,
            'amount' => -1 * (float) ($payload['amount'] ?? 0),
            'currency' => 'UAH',
            'status' => PaymentStatus::Success->value,
            'payment_provider' => PaymentProvider::WayForPay,
            'transaction_id' => (string) ($payload['authCode'] ?? ''),
            'description' => [
                'wayforpay_status' => $transactionStatus,
                'reason' => (string) ($payload['reason'] ?? ''),
            ],
            'metadata' => $payload,
        ]);

        // If the refund targets a live (non-trial) subscription, cancel it.
        // Trial auto-refunds leave the subscription in Trial state untouched —
        // they refund only the 1 UAH verification charge.
        $subscription = Subscription::where('user_id', $order->user_id)->first();

        if ($subscription !== null && $subscription->status === SubscriptionStatus::Active) {
            $subscription->update([
                'status' => SubscriptionStatus::Cancelled,
                'cancelled_at' => now(),
            ]);
        }

        Log::channel('payments')->info('wayforpay.payment.refunded', [
            'user_id' => $order->user_id,
            'order_reference' => $order->order_number,
            'transaction_status' => $transactionStatus,
            'amount' => $payload['amount'] ?? null,
        ]);

        return 'refunded';
    }

    /**
     * Emulate a full Approved webhook locally so /api/v1/profile/subscription/checkout
     * can advance the subscription to Trial without needing a reachable
     * serviceUrl. Mirrors LiqPayWebhookService::simulateSuccess.
     */
    public function simulateSuccess(Order $order): void
    {
        $amount = (float) config('services.wayforpay.trial_verify_amount', 1.0);
        $payload = $this->wayForPayService->buildFakeWebhookPayload($order, $amount);

        Log::channel('payments')->info('wayforpay.emulator.simulate', [
            'order_reference' => $order->order_number,
        ]);

        DB::transaction(function () use ($order, $payload): void {
            $this->handleApproved($order, $payload);
        });
    }
}
