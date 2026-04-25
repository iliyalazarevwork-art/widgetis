<?php

declare(strict_types=1);

namespace App\Core\Services\Billing;

use App\Core\Models\Order;
use App\Core\Models\Payment;
use App\Core\Models\Subscription;
use App\Core\Services\Billing\Events\ChargeFailedEvent;
use App\Core\Services\Billing\Events\IgnoredEvent;
use App\Core\Services\Billing\Events\InvalidSignatureEvent;
use App\Core\Services\Billing\Events\PaymentEvent;
use App\Core\Services\Billing\Events\RefundedEvent;
use App\Core\Services\Billing\Events\SubscriptionActivatedEvent;
use App\Core\Services\Billing\Events\SubscriptionCancelledEvent;
use App\Core\Services\Billing\Events\SubscriptionRenewedEvent;
use App\Core\Services\Billing\Results\WebhookHandlingOutcome;
use App\Core\Services\Billing\Webhooks\InboundWebhook;
use App\Enums\OrderStatus;
use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\SubscriptionStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Application-layer dispatcher that routes parsed v2 PaymentEvents to the
 * appropriate state-mutation services.
 *
 * All state mutations that previously lived in WayForPayWebhookService and
 * MonobankWebhookService are delegated here through SubscriptionActivationService
 * and SubscriptionService. The old v1 services remain loadable but are no
 * longer the primary path for webhook processing.
 */
final class WebhookDispatcher
{
    public function __construct(
        private readonly PaymentProviderRegistry $registry,
        private readonly SubscriptionService $subscriptionService,
        private readonly SubscriptionActivationService $activationService,
        private readonly PaymentFailureHandler $failureHandler,
        private readonly WayForPayService $wayForPayService,
    ) {
    }

    /**
     * Parse the raw inbound webhook via the v2 adapter and dispatch to the
     * appropriate mutation handler, returning a structured outcome.
     */
    public function dispatch(PaymentProvider $provider, InboundWebhook $webhook): WebhookHandlingOutcome
    {
        $adapter = $this->registry->get($provider);
        $event = $adapter->parseWebhook($webhook);

        // Safely decode raw payload for metadata storage; defaults to empty
        // array if the body is not valid JSON (InvalidSignature path, etc.)
        try {
            $rawPayload = $webhook->jsonBody();
        } catch (\Throwable) {
            $rawPayload = [];
        }

        // Scrub sensitive token fields that must never appear in stored metadata.
        unset($rawPayload['walletData'], $rawPayload['recToken']);

        return match (true) {
            $event instanceof InvalidSignatureEvent => $this->handleInvalidSignature($provider),
            $event instanceof IgnoredEvent          => $this->handleIgnored($event, $provider),
            $event instanceof SubscriptionActivatedEvent => $this->handleActivated($event, $provider, $rawPayload),
            $event instanceof SubscriptionRenewedEvent   => $this->handleRenewed($event, $provider, $rawPayload),
            $event instanceof SubscriptionCancelledEvent => $this->handleCancelled($event),
            $event instanceof ChargeFailedEvent          => $this->handleChargeFailed($event, $provider),
            $event instanceof RefundedEvent              => $this->handleRefunded($event, $provider, $rawPayload),
            default                                      => $this->handleUnknown($event, $provider),
        };
    }

    private function handleInvalidSignature(PaymentProvider $provider): WebhookHandlingOutcome
    {
        Log::channel('payments')->warning('webhook.invalid_signature', [
            'provider' => $provider->value,
        ]);

        return new WebhookHandlingOutcome(
            signatureValid: false,
            processed: false,
            reference: null,
            event: 'invalid_signature',
        );
    }

    private function handleIgnored(IgnoredEvent $event, PaymentProvider $provider): WebhookHandlingOutcome
    {
        Log::channel('payments')->info('webhook.ignored', [
            'provider' => $provider->value,
            'reference' => $event->reference,
            'reason' => $event->reason,
            'provider_status' => $event->providerStatus,
        ]);

        return new WebhookHandlingOutcome(
            signatureValid: true,
            processed: false,
            reference: $event->reference !== '' ? $event->reference : null,
            event: 'ignored',
        );
    }

    /** @param array<string, mixed> $rawPayload */
    private function handleActivated(SubscriptionActivatedEvent $event, PaymentProvider $provider, array $rawPayload = []): WebhookHandlingOutcome
    {
        $reference = $event->reference;

        $order = Order::where('order_number', $reference)->first();

        if ($order === null) {
            Log::channel('payments')->error('webhook.activation.order_not_found', [
                'provider' => $provider->value,
                'reference' => $reference,
            ]);

            return new WebhookHandlingOutcome(
                signatureValid: true,
                processed: false,
                reference: $reference,
                event: 'activation_order_not_found',
            );
        }

        DB::transaction(function () use ($order, $event, $provider, $rawPayload): void {
            if ($order->status === OrderStatus::Cancelled) {
                Log::channel('payments')->warning('webhook.activation.cancelled_order', [
                    'provider' => $provider->value,
                    'reference' => $event->reference,
                    'user_id' => $order->user_id,
                ]);

                return;
            }

            $subscription = Subscription::where('user_id', $order->user_id)->first();

            if ($subscription === null) {
                Log::channel('payments')->error('webhook.activation.subscription_not_found', [
                    'provider' => $provider->value,
                    'reference' => $event->reference,
                    'user_id' => $order->user_id,
                ]);

                return;
            }

            // Cross-provider guard: if the subscription now belongs to a
            // different provider, do not paint our tokens onto it.
            if (
                $subscription->payment_provider !== null
                && $subscription->payment_provider !== $provider
            ) {
                Log::channel('payments')->warning('webhook.activation.provider_mismatch', [
                    'provider' => $provider->value,
                    'subscription_provider' => $subscription->payment_provider->value,
                    'reference' => $event->reference,
                    'user_id' => $order->user_id,
                ]);

                return;
            }

            // Idempotency: skip if already processed with the same transaction id
            $transactionId = $event->transactionId !== null && $event->transactionId !== ''
                ? $event->transactionId
                : $event->reference;

            if (
                $transactionId !== ''
                && Payment::where('order_id', $order->id)
                    ->where('status', PaymentStatus::Success->value)
                    ->where('transaction_id', $transactionId)
                    ->exists()
            ) {
                return;
            }

            $amountUah = $event->paidAmount->toMajor();
            $wayforpayRecToken = $event->tokens->recurringToken;
            $providerSubscriptionId = $event->tokens->providerSubscriptionId;

            // WayForPay trial: small verify charge with a recToken indicates trial activation
            $isTrialActivation = $provider === PaymentProvider::WayForPay
                && $subscription->status === SubscriptionStatus::Pending
                && ($subscription->wayforpay_rec_token === null || $subscription->wayforpay_rec_token === '');

            if ($isTrialActivation && $wayforpayRecToken !== null && $wayforpayRecToken !== '') {
                $this->applyTrialActivation(
                    order: $order,
                    subscription: $subscription,
                    event: $event,
                    amountUah: $amountUah,
                    transactionId: $transactionId,
                    wayforpayRecToken: $wayforpayRecToken,
                    provider: $provider,
                    rawPayload: $rawPayload,
                );

                return;
            }

            // Standard activate-or-renew path (Monobank initial activation)
            $this->activationService->activateOrRenew(
                order: $order,
                transactionId: $transactionId,
                amountUah: $amountUah,
                provider: $provider,
                paymentMethod: $this->resolvePaymentMethod($rawPayload),
                metadata: $rawPayload,
                providerSubscriptionId: $providerSubscriptionId,
            );

            Log::channel('payments')->info('webhook.activation.processed', [
                'provider' => $provider->value,
                'reference' => $event->reference,
                'user_id' => $order->user_id,
            ]);
        });

        return new WebhookHandlingOutcome(
            signatureValid: true,
            processed: true,
            reference: $reference,
            event: 'activated',
        );
    }

    /** @param array<string, mixed> $rawPayload */
    private function handleRenewed(SubscriptionRenewedEvent $event, PaymentProvider $provider, array $rawPayload = []): WebhookHandlingOutcome
    {
        $reference = $event->reference;

        DB::transaction(function () use ($event, $provider, $rawPayload): void {
            $order = $event->reference !== ''
                ? Order::where('order_number', $event->reference)->first()
                : null;

            if ($order !== null) {
                $this->activationService->activateOrRenew(
                    order: $order,
                    transactionId: $event->transactionId,
                    amountUah: $event->paidAmount->toMajor(),
                    provider: $provider,
                    paymentMethod: $this->resolvePaymentMethod($rawPayload),
                    metadata: $rawPayload,
                );

                Log::channel('payments')->info('webhook.renewed.order_based', [
                    'provider' => $provider->value,
                    'reference' => $event->reference,
                ]);

                return;
            }

            // Renewal without order: Monobank subscription-based path
            $subscription = Subscription::whereNotNull('payment_provider_subscription_id')->get()
                ->first(fn (Subscription $s) => $s->payment_provider === $provider);

            if ($subscription === null) {
                Log::channel('payments')->warning('webhook.renewed.no_subscription', [
                    'provider' => $provider->value,
                    'reference' => $event->reference,
                ]);

                return;
            }

            $this->activationService->renewBySubscription(
                subscription: $subscription,
                transactionId: $event->transactionId,
                amountUah: $event->paidAmount->toMajor(),
                provider: $provider,
                paymentMethod: $this->resolvePaymentMethod($rawPayload),
                metadata: $rawPayload,
            );

            Log::channel('payments')->info('webhook.renewed.subscription_based', [
                'provider' => $provider->value,
                'subscription_id' => $subscription->id,
            ]);
        });

        return new WebhookHandlingOutcome(
            signatureValid: true,
            processed: true,
            reference: $reference !== '' ? $reference : null,
            event: 'renewed',
        );
    }

    private function handleCancelled(SubscriptionCancelledEvent $event): WebhookHandlingOutcome
    {
        $reference = $event->reference;

        DB::transaction(function () use ($event): void {
            $order = $event->reference !== ''
                ? Order::where('order_number', $event->reference)->first()
                : null;

            $subscription = $order !== null
                ? Subscription::where('user_id', $order->user_id)->first()
                : null;

            if ($subscription === null) {
                Log::channel('payments')->warning('webhook.cancelled.subscription_not_found', [
                    'reference' => $event->reference,
                ]);

                return;
            }

            $this->subscriptionService->cancel($subscription, 'provider_initiated');

            Log::channel('payments')->info('webhook.cancelled.processed', [
                'subscription_id' => $subscription->id,
                'reference' => $event->reference,
            ]);
        });

        return new WebhookHandlingOutcome(
            signatureValid: true,
            processed: true,
            reference: $reference !== '' ? $reference : null,
            event: 'cancelled',
        );
    }

    private function handleChargeFailed(ChargeFailedEvent $event, PaymentProvider $provider): WebhookHandlingOutcome
    {
        $reference = $event->reference;
        $processed = false;

        DB::transaction(function () use ($event, $provider, &$processed): void {
            // Try to find order via reference (order number or invoiceId used as fallback ref).
            $order = $event->reference !== ''
                ? Order::where('order_number', $event->reference)->first()
                : null;

            if ($order !== null) {
                $processed = true;
                $subscription = Subscription::where('user_id', $order->user_id)->first();

                // Create or flip the failed payment record so the ledger tracks every attempt.
                if ($event->transactionId !== null && $event->transactionId !== '') {
                    Payment::firstOrCreate(
                        [
                            'transaction_id' => $event->transactionId,
                            'status' => PaymentStatus::Failed->value,
                        ],
                        [
                            'user_id' => $order->user_id,
                            'order_id' => $order->id,
                            'subscription_id' => $subscription?->id,
                            'type' => PaymentType::Charge->value,
                            'amount' => 0,
                            'currency' => 'UAH',
                            'payment_provider' => $provider,
                            'description' => ['reason' => $event->code],
                            'metadata' => [],
                        ],
                    );
                } else {
                    $payment = Payment::where('order_id', $order->id)
                        ->where('status', PaymentStatus::Pending->value)
                        ->first();

                    if ($payment !== null) {
                        $payment->update(['status' => PaymentStatus::Failed->value]);
                    }
                }

                $this->failureHandler->handle($order);

                Log::channel('payments')->warning('webhook.charge_failed.processed', [
                    'reference' => $event->reference,
                    'code' => $event->code,
                    'message' => $event->message,
                    'user_id' => $order->user_id,
                ]);

                return;
            }

            // No order found — try the subscription-only path (Monobank recurring failure
            // without an order reference: the provider sends subscriptionId only).
            if ($event->providerSubscriptionId === null || $event->providerSubscriptionId === '') {
                Log::channel('payments')->warning('webhook.charge_failed.order_not_found', [
                    'reference' => $event->reference,
                    'code' => $event->code,
                    'message' => $event->message,
                ]);

                return;
            }

            $subscription = Subscription::where('payment_provider_subscription_id', $event->providerSubscriptionId)->first();

            if ($subscription === null) {
                Log::channel('payments')->warning('webhook.charge_failed.subscription_not_found', [
                    'provider_subscription_id' => $event->providerSubscriptionId,
                    'code' => $event->code,
                ]);

                return;
            }

            $processed = true;

            Payment::firstOrCreate(
                [
                    'transaction_id' => $event->transactionId ?? $event->reference,
                    'status' => PaymentStatus::Failed->value,
                ],
                [
                    'user_id' => $subscription->user_id,
                    'order_id' => null,
                    'subscription_id' => $subscription->id,
                    'type' => PaymentType::Charge->value,
                    'amount' => 0,
                    'currency' => 'UAH',
                    'payment_provider' => $provider,
                    'description' => ['reason' => $event->code],
                    'metadata' => [],
                ],
            );

            $subscription->update([
                'status' => SubscriptionStatus::PastDue,
                'grace_period_ends_at' => now()->addDays(PaymentFailureHandler::GRACE_PERIOD_DAYS),
            ]);

            Log::channel('payments')->warning('webhook.charge_failed.subscription_only', [
                'subscription_id' => $subscription->id,
                'provider_subscription_id' => $event->providerSubscriptionId,
                'code' => $event->code,
            ]);
        });

        return new WebhookHandlingOutcome(
            signatureValid: true,
            processed: $processed,
            reference: $reference !== '' ? $reference : null,
            event: 'charge_failed',
        );
    }

    /** @param array<string, mixed> $rawPayload */
    private function handleRefunded(RefundedEvent $event, PaymentProvider $provider, array $rawPayload = []): WebhookHandlingOutcome
    {
        $reference = $event->reference;

        DB::transaction(function () use ($event, $provider, $rawPayload): void {
            $order = $event->reference !== ''
                ? Order::where('order_number', $event->reference)->first()
                : null;

            if ($order === null) {
                Log::channel('payments')->warning('webhook.refunded.order_not_found', [
                    'provider' => $provider->value,
                    'reference' => $event->reference,
                ]);

                return;
            }

            $order->update(['status' => OrderStatus::Refunded]);

            Payment::create([
                'user_id' => $order->user_id,
                'order_id' => $order->id,
                'type' => PaymentType::Refund->value,
                'amount' => -1 * $event->amount->toMajor(),
                'currency' => 'UAH',
                'status' => PaymentStatus::Success->value,
                'payment_provider' => $provider,
                'transaction_id' => isset($rawPayload['authCode']) ? (string) $rawPayload['authCode'] : null,
                'description' => ['reason' => 'provider_refund'],
                'metadata' => $rawPayload,
            ]);

            // Cancel any live subscription associated with this refund
            $subscription = Subscription::where('user_id', $order->user_id)->first();

            if ($subscription !== null && $subscription->status === SubscriptionStatus::Active) {
                $subscription->update([
                    'status' => SubscriptionStatus::Cancelled,
                    'cancelled_at' => now(),
                ]);
            }

            Log::channel('payments')->info('webhook.refunded.processed', [
                'provider' => $provider->value,
                'reference' => $event->reference,
                'user_id' => $order->user_id,
                'amount' => $event->amount->toMajor(),
            ]);
        });

        return new WebhookHandlingOutcome(
            signatureValid: true,
            processed: true,
            reference: $reference !== '' ? $reference : null,
            event: 'refunded',
        );
    }

    private function handleUnknown(PaymentEvent $event, PaymentProvider $provider): WebhookHandlingOutcome
    {
        Log::channel('payments')->warning('webhook.unknown_event', [
            'provider' => $provider->value,
            'event_class' => $event::class,
            'reference' => $event->reference,
        ]);

        return new WebhookHandlingOutcome(
            signatureValid: true,
            processed: false,
            reference: $event->reference !== '' ? $event->reference : null,
            event: 'unknown',
        );
    }

    /**
     * Apply WayForPay trial activation: persist rec token, update payment row,
     * mark order paid, call activateTrial, and optionally fire refund.
     *
     * @param array<string, mixed> $rawPayload
     */
    private function applyTrialActivation(
        Order $order,
        Subscription $subscription,
        SubscriptionActivatedEvent $event,
        float $amountUah,
        string $transactionId,
        string $wayforpayRecToken,
        PaymentProvider $provider,
        array $rawPayload = [],
    ): void {
        // Scrub the recToken from metadata — it's stored as a first-class
        // column and must not be duplicated in potentially wide-blast JSON logs.
        $scrubbed = $rawPayload;
        unset($scrubbed['recToken']);
        $subscription->update(['wayforpay_rec_token' => $wayforpayRecToken]);

        $pending = Payment::where('order_id', $order->id)
            ->whereIn('status', [PaymentStatus::Pending->value, PaymentStatus::Success->value])
            ->first();

        if ($pending !== null) {
            $pending->update([
                'status' => PaymentStatus::Success->value,
                'amount' => $amountUah,
                'payment_method' => $this->resolvePaymentMethod($scrubbed),
                'transaction_id' => $transactionId,
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
                'payment_provider' => $provider,
                'payment_method' => $this->resolvePaymentMethod($scrubbed),
                'transaction_id' => $transactionId,
                'description' => ['reason' => 'trial activation'],
                'metadata' => $scrubbed,
            ]);
        }

        $order->update([
            'status' => OrderStatus::Paid,
            'transaction_id' => $transactionId,
            'paid_at' => now(),
        ]);

        $trialDays = (int) ($subscription->plan->trial_days ?? 7);

        $this->activationService->activateTrial(
            subscription: $subscription,
            provider: $provider,
            trialDays: $trialDays,
            providerSubscriptionId: $event->tokens->providerSubscriptionId,
            wayforpayRecToken: $wayforpayRecToken,
        );

        // Fire-and-forget refund so net cost of trial activation is 0.
        // Skip if amount is zero (WFP rejects zero-amount refunds).
        if ($amountUah > 0 && (bool) config('services.wayforpay.auto_refund_trial', true)) {
            $this->wayForPayService->refund(
                orderReference: $order->order_number,
                amount: $amountUah,
                comment: 'Widgetis trial activation auto-refund',
            );
        }

        Log::channel('payments')->info('webhook.trial_activated', [
            'provider' => $provider->value,
            'reference' => $event->reference,
            'user_id' => $order->user_id,
            'trial_ends_at' => $subscription->fresh()?->trial_ends_at?->toIso8601String(),
        ]);
    }

    /**
     * Extract the payment method from a raw webhook payload.
     *
     * Handles both top-level `paymentSystem` (WayForPay) and nested
     * `paymentInfo.paymentSystem` (Monobank) structures.
     *
     * @param array<string, mixed> $payload
     */
    private function resolvePaymentMethod(array $payload): string
    {
        if (isset($payload['paymentSystem']) && is_string($payload['paymentSystem'])) {
            return $payload['paymentSystem'];
        }

        $paymentInfo = $payload['paymentInfo'] ?? null;
        if (is_array($paymentInfo) && isset($paymentInfo['paymentSystem']) && is_string($paymentInfo['paymentSystem'])) {
            return $paymentInfo['paymentSystem'];
        }

        return 'card';
    }
}
