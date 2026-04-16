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
use App\Services\Billing\DTO\WebhookResult;
use AratKruglik\Monobank\Services\PubKeyProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Handles Monobank webhook callbacks (success, failure, reversed, expired).
 *
 * Mirrors the WayForPayWebhookService pattern: the MonobankProvider adapter
 * delegates all webhook processing here so the provider stays a thin adapter
 * focused on checkout creation, cancellation, and recurring no-ops.
 *
 * State transitions for payments with an Order are delegated to
 * SubscriptionActivationService for consistency with the WayForPay flow.
 * Recurring charges without an Order (Monobank sends no reference on
 * scheduled renewals) use SubscriptionActivationService::renewBySubscription().
 */
class MonobankWebhookService
{
    public function __construct(
        private readonly PubKeyProvider $pubKeyProvider,
        private readonly SubscriptionActivationService $activation,
        private readonly PaymentFailureHandler $failureHandler,
    ) {
    }

    public function process(Request $request): WebhookResult
    {
        if (! $this->verifySignature($request)) {
            Log::channel('payments')->warning('monobank.webhook.invalid_signature', [
                'ip' => $request->ip(),
            ]);

            return WebhookResult::invalidSignature();
        }

        $payload = (array) $request->json()->all();
        $invoiceId = isset($payload['invoiceId']) ? (string) $payload['invoiceId'] : null;
        $status = isset($payload['status']) ? (string) $payload['status'] : null;
        $reference = isset($payload['reference']) ? (string) $payload['reference'] : null;

        Log::channel('payments')->info('monobank.webhook.received', [
            'invoice_id' => $invoiceId,
            'status' => $status,
            'reference' => $reference,
            'has_subscription_id' => isset($payload['subscriptionId']),
        ]);

        if ($invoiceId === null || $status === null) {
            return WebhookResult::ignored($reference, $status);
        }

        return DB::transaction(function () use ($payload, $invoiceId, $status, $reference): WebhookResult {
            return match ($status) {
                'success' => $this->handleSuccess($invoiceId, $reference, $payload),
                'failure', 'reversed', 'expired' => $this->handleFailure($invoiceId, $reference, $status, $payload),
                default => WebhookResult::ignored($reference, $status),
            };
        });
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function handleSuccess(string $invoiceId, ?string $reference, array $payload): WebhookResult
    {
        $existing = Payment::where('transaction_id', $invoiceId)
            ->where('status', PaymentStatus::Success->value)
            ->first();

        if ($existing !== null) {
            return WebhookResult::ignored($reference, 'success');
        }

        $scrubbed = $payload;
        unset($scrubbed['walletData']);

        $amountCents = (int) ($payload['finalAmount'] ?? $payload['amount'] ?? 0);
        $amountUah = $amountCents / 100;
        $paymentMethod = (string) ($payload['paymentInfo']['paymentSystem'] ?? 'card');
        $providerSubscriptionId = isset($payload['subscriptionId']) ? (string) $payload['subscriptionId'] : null;

        // Order-based path: initial checkout or upgrade payment.
        $order = $reference !== null && $reference !== ''
            ? Order::where('order_number', $reference)->first()
            : null;

        if ($order !== null) {
            return $this->handleOrderBasedSuccess(
                $order,
                $invoiceId,
                $amountUah,
                $paymentMethod,
                $scrubbed,
                $providerSubscriptionId,
                $reference,
            );
        }

        // Recurring charge webhook — no order reference. Find subscription
        // by the Monobank subscriptionId.
        return $this->handleRecurringSuccess(
            $invoiceId,
            $amountUah,
            $paymentMethod,
            $scrubbed,
            $providerSubscriptionId,
            $reference,
            $payload,
        );
    }

    /**
     * @param array<string, mixed> $scrubbed
     */
    private function handleOrderBasedSuccess(
        Order $order,
        string $invoiceId,
        float $amountUah,
        string $paymentMethod,
        array $scrubbed,
        ?string $providerSubscriptionId,
        ?string $reference,
    ): WebhookResult {
        if ($order->status === OrderStatus::Cancelled) {
            Log::channel('payments')->warning('monobank.payment.success_for_cancelled_order', [
                'user_id' => $order->user_id,
                'order_number' => $order->order_number,
                'invoice_id' => $invoiceId,
            ]);

            return WebhookResult::ignored($reference, 'success');
        }

        // Upgrade orders route through the shared applyUpgrade path.
        if ($this->activation->isUpgradeOrder($order)) {
            $this->activation->applyUpgrade(
                order: $order,
                transactionId: $invoiceId,
                amountUah: $amountUah,
                provider: PaymentProvider::Monobank,
                paymentMethod: $paymentMethod,
                metadata: $scrubbed,
                providerSubscriptionId: $providerSubscriptionId,
                description: ['monobank_destination' => (string) ($scrubbed['destination'] ?? 'upgrade')],
            );

            Log::channel('payments')->info('monobank.payment.upgrade_applied', [
                'user_id' => $order->user_id,
                'order_number' => $order->order_number,
                'invoice_id' => $invoiceId,
            ]);

            return WebhookResult::processed($reference, 'success');
        }

        // Standard activate or renew via the shared service.
        $this->activation->activateOrRenew(
            order: $order,
            transactionId: $invoiceId,
            amountUah: $amountUah,
            provider: PaymentProvider::Monobank,
            paymentMethod: $paymentMethod,
            metadata: $scrubbed,
            providerSubscriptionId: $providerSubscriptionId,
            description: ['monobank_destination' => (string) ($scrubbed['destination'] ?? '')],
        );

        Log::channel('payments')->info('monobank.payment.success', [
            'user_id' => $order->user_id,
            'order_number' => $order->order_number,
            'invoice_id' => $invoiceId,
            'amount_uah' => $amountUah,
            'is_renewal' => false,
        ]);

        return WebhookResult::processed($reference, 'success');
    }

    /**
     * @param array<string, mixed> $scrubbed
     * @param array<string, mixed> $payload
     */
    private function handleRecurringSuccess(
        string $invoiceId,
        float $amountUah,
        string $paymentMethod,
        array $scrubbed,
        ?string $providerSubscriptionId,
        ?string $reference,
        array $payload,
    ): WebhookResult {
        $monoSubId = $providerSubscriptionId;

        $subscription = $monoSubId !== null
            ? Subscription::where('payment_provider_subscription_id', $monoSubId)->first()
            : null;

        if ($subscription === null) {
            Log::channel('payments')->error('monobank.webhook.subscription_not_found', [
                'invoice_id' => $invoiceId,
                'reference' => $reference,
                'subscription_id_from_payload' => $monoSubId,
            ]);

            return WebhookResult::ignored($reference, 'success');
        }

        $this->activation->renewBySubscription(
            subscription: $subscription,
            transactionId: $invoiceId,
            amountUah: $amountUah,
            provider: PaymentProvider::Monobank,
            paymentMethod: $paymentMethod,
            metadata: $scrubbed,
            description: ['monobank_destination' => (string) ($payload['destination'] ?? '')],
        );

        Log::channel('payments')->info('monobank.payment.success', [
            'user_id' => $subscription->user_id,
            'invoice_id' => $invoiceId,
            'amount_uah' => $amountUah,
            'is_renewal' => true,
        ]);

        return WebhookResult::processed($reference, 'success');
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function handleFailure(string $invoiceId, ?string $reference, string $status, array $payload): WebhookResult
    {
        $order = $reference !== null && $reference !== ''
            ? Order::where('order_number', $reference)->first()
            : null;

        $subscription = null;

        if ($order !== null) {
            $subscription = Subscription::where('user_id', $order->user_id)->first();
        } else {
            $monoSubId = isset($payload['subscriptionId']) ? (string) $payload['subscriptionId'] : null;

            if ($monoSubId !== null) {
                $subscription = Subscription::where('payment_provider_subscription_id', $monoSubId)->first();
            }

            if ($subscription === null) {
                return WebhookResult::ignored($reference, $status);
            }
        }

        $userId = $order !== null ? $order->user_id : $subscription->user_id;

        Payment::firstOrCreate(
            [
                'transaction_id' => $invoiceId,
                'status' => PaymentStatus::Failed->value,
            ],
            [
                'user_id' => $userId,
                'order_id' => $order?->id,
                'subscription_id' => $subscription->id,
                'type' => PaymentType::Charge->value,
                'amount' => ((int) ($payload['amount'] ?? 0)) / 100,
                'currency' => 'UAH',
                'payment_provider' => PaymentProvider::Monobank,
                'description' => ['monobank_status' => $status],
                'metadata' => $payload,
            ],
        );

        if ($order !== null) {
            $this->failureHandler->handle($order);
        } else {
            $subscription->update([
                'status' => SubscriptionStatus::PastDue,
                'grace_period_ends_at' => now()->addDays(PaymentFailureHandler::GRACE_PERIOD_DAYS),
            ]);
        }

        Log::channel('payments')->warning('monobank.payment.failed', [
            'user_id' => $userId,
            'order_number' => $order?->order_number,
            'invoice_id' => $invoiceId,
            'status' => $status,
            'is_renewal' => $order === null,
        ]);

        return WebhookResult::processed($reference, $status);
    }

    private function verifySignature(Request $request): bool
    {
        $xSign = $request->header('X-Sign');

        if (! is_string($xSign) || $xSign === '') {
            return false;
        }

        $signature = base64_decode($xSign, true);

        if ($signature === false) {
            return false;
        }

        try {
            $pubKey = $this->pubKeyProvider->getKey();
        } catch (\Throwable $e) {
            Log::channel('payments')->error('monobank.webhook.pubkey_failed', [
                'error' => $e->getMessage(),
            ]);

            return false;
        }

        $pemKey = base64_decode($pubKey, strict: true);

        if ($pemKey === false) {
            return false;
        }

        $body = $request->getContent();

        try {
            $result = openssl_verify($body, $signature, $pemKey, OPENSSL_ALGO_SHA256);
        } catch (\Throwable) {
            return false;
        }

        return $result === 1;
    }
}
