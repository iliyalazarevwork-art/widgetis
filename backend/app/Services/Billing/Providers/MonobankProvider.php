<?php

declare(strict_types=1);

namespace App\Services\Billing\Providers;

use App\Enums\BillingPeriod;
use App\Enums\OrderStatus;
use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Billing\Contracts\PaymentProviderInterface;
use App\Services\Billing\DTO\ChargeResult;
use App\Services\Billing\DTO\CheckoutResult;
use App\Services\Billing\DTO\WebhookResult;
use App\Services\Billing\PaymentFailureHandler;
use AratKruglik\Monobank\Contracts\ClientInterface as MonobankClient;
use AratKruglik\Monobank\DTO\SubscriptionRequestDTO;
use AratKruglik\Monobank\DTO\SubscriptionResponseDTO;
use AratKruglik\Monobank\Facades\Monobank;
use AratKruglik\Monobank\Services\PubKeyProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Monobank payment provider using native Subscription API.
 *
 * Creates a Monobank subscription via POST /subscription/create with
 * the billing interval (1m / 1y). Monobank handles recurring charges
 * automatically and sends webhooks for each charge event. Our cron
 * does NOT need to call chargeRecurring — Monobank self-schedules.
 *
 * On cancellation, we call DELETE /subscription/delete to stop future
 * charges on Monobank's side.
 */
class MonobankProvider implements PaymentProviderInterface
{
    public function __construct(
        private readonly MonobankClient $client,
        private readonly PubKeyProvider $pubKeyProvider,
        private readonly PaymentFailureHandler $failureHandler,
    ) {
    }

    public function name(): PaymentProvider
    {
        return PaymentProvider::Monobank;
    }

    public function createSubscriptionCheckout(
        User $user,
        Plan $plan,
        BillingPeriod $billingPeriod,
        string $reference,
        ?string $redirectUrl = null,
    ): CheckoutResult {
        $order = Order::where('order_number', $reference)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $amount = $billingPeriod === BillingPeriod::Yearly
            ? (float) $plan->price_yearly
            : (float) $plan->price_monthly;

        $interval = $billingPeriod === BillingPeriod::Yearly ? '1y' : '1m';

        $configuredRedirect = (string) config('monobank.redirect_url');
        $configuredWebhook = (string) config('monobank.webhook_url');
        $effectiveRedirect = $redirectUrl ?? $configuredRedirect;

        if (config('monobank.token') === null || $configuredWebhook === '' || $effectiveRedirect === '') {
            Log::channel('payments')->error('monobank.config.missing', [
                'user_id' => $user->id,
                'order_number' => $order->order_number,
                'has_token' => config('monobank.token') !== null,
                'has_webhook_url' => $configuredWebhook !== '',
                'has_redirect_url' => $effectiveRedirect !== '',
            ]);

            throw new \RuntimeException(
                'Monobank provider is not fully configured (MONOBANK_TOKEN / MONOBANK_REDIRECT_URL / MONOBANK_WEBHOOK_URL).'
            );
        }

        $dto = new SubscriptionRequestDTO(
            amount: $amount,
            interval: $interval,
            webHookStatusUrl: $configuredWebhook,
            webHookChargeUrl: $configuredWebhook,
            ccy: 980,
            redirectUrl: $effectiveRedirect,
            validity: 86400,
        );

        // SubscriptionRequestDTO does not expose a lang field, so we merge
        // it into the raw payload ourselves. Without this Monobank defaults
        // to English on the payment page ("Every month", "Regular withdrawal…").
        $payload = array_merge($dto->toArray(), ['lang' => 'uk']);

        try {
            $raw = $this->client->post('subscription/create', $payload);
            $response = SubscriptionResponseDTO::fromArray($raw->json());
        } catch (\Throwable $e) {
            Log::channel('payments')->error('monobank.subscription.create_failed', [
                'user_id' => $user->id,
                'order_number' => $order->order_number,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }

        // Store the Monobank subscription ID on our Subscription row so we
        // can cancel it later via deleteSubscription().
        $subscription = Subscription::where('user_id', $user->id)->first();
        $subscription?->update([
            'payment_provider_subscription_id' => $response->subscriptionId,
        ]);

        Log::channel('payments')->info('monobank.subscription.created', [
            'user_id' => $user->id,
            'order_number' => $order->order_number,
            'subscription_id' => $response->subscriptionId,
        ]);

        return CheckoutResult::redirect(
            url: $response->pageUrl,
            providerReference: $response->subscriptionId,
        );
    }

    /**
     * Monobank handles recurring charges automatically via its Subscription
     * API — no merchant-initiated charge needed. The cron should skip this
     * provider (same as LiqPay and WayForPay).
     */
    public function chargeRecurring(Subscription $subscription): ChargeResult
    {
        return ChargeResult::noop();
    }

    public function cancelSubscription(Subscription $subscription): bool
    {
        $subscriptionId = $subscription->payment_provider_subscription_id;

        if ($subscriptionId === null || $subscriptionId === '') {
            Log::channel('payments')->info('monobank.subscription.cancel_skipped', [
                'subscription_id' => $subscription->id,
                'reason' => 'no_provider_subscription_id',
            ]);

            return true;
        }

        try {
            Monobank::deleteSubscription($subscriptionId);

            Log::channel('payments')->info('monobank.subscription.cancelled', [
                'subscription_id' => $subscription->id,
                'monobank_subscription_id' => $subscriptionId,
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::channel('payments')->error('monobank.subscription.cancel_failed', [
                'subscription_id' => $subscription->id,
                'monobank_subscription_id' => $subscriptionId,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    public function handleWebhook(Request $request): WebhookResult
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

        $result = DB::transaction(function () use ($payload, $invoiceId, $status, $reference): WebhookResult {
            return match ($status) {
                'success' => $this->handleSuccess($invoiceId, $reference, $payload),
                'failure', 'reversed', 'expired' => $this->handleFailure($invoiceId, $reference, $status, $payload),
                default => WebhookResult::ignored($reference, $status),
            };
        });

        return $result;
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

        // For recurring charge webhooks from Monobank subscriptions, the
        // reference may be empty. Try to locate the subscription by
        // subscriptionId from the payload.
        $order = $reference !== null && $reference !== ''
            ? Order::where('order_number', $reference)->first()
            : null;

        $subscription = null;

        if ($order !== null) {
            if ($order->status === OrderStatus::Cancelled) {
                Log::channel('payments')->warning('monobank.payment.success_for_cancelled_order', [
                    'user_id' => $order->user_id,
                    'order_number' => $order->order_number,
                    'invoice_id' => $invoiceId,
                ]);

                return WebhookResult::ignored($reference, 'success');
            }

            $subscription = Subscription::where('user_id', $order->user_id)->first();
        } else {
            // Recurring charge webhook — no order reference. Find subscription
            // by the Monobank subscriptionId.
            $monoSubId = isset($payload['subscriptionId']) ? (string) $payload['subscriptionId'] : null;

            if ($monoSubId !== null) {
                $subscription = Subscription::where('payment_provider_subscription_id', $monoSubId)->first();
            }

            if ($subscription === null) {
                Log::channel('payments')->error('monobank.webhook.subscription_not_found', [
                    'invoice_id' => $invoiceId,
                    'reference' => $reference,
                    'subscription_id_from_payload' => $monoSubId,
                ]);

                return WebhookResult::ignored($reference, 'success');
            }
        }

        $amountCents = (int) ($payload['finalAmount'] ?? $payload['amount'] ?? 0);
        $amountUah = $amountCents / 100;

        $userId = $order !== null ? $order->user_id : $subscription->user_id;

        $scrubbed = $payload;
        unset($scrubbed['walletData']);

        Payment::create([
            'user_id' => $userId,
            'order_id' => $order?->id,
            'subscription_id' => $subscription?->id,
            'type' => 'charge',
            'amount' => $amountUah,
            'currency' => 'UAH',
            'status' => PaymentStatus::Success->value,
            'payment_provider' => PaymentProvider::Monobank,
            'payment_method' => (string) ($payload['paymentInfo']['paymentSystem'] ?? 'card'),
            'transaction_id' => $invoiceId,
            'description' => ['monobank_destination' => (string) ($payload['destination'] ?? '')],
            'metadata' => $scrubbed,
        ]);

        if ($subscription !== null) {
            $billingPeriod = $order !== null
                ? BillingPeriod::from($order->billing_period)
                : BillingPeriod::from($subscription->billing_period);

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
                'payment_provider' => PaymentProvider::Monobank,
                'payment_retry_count' => 0,
                'next_payment_retry_at' => null,
                'grace_period_ends_at' => null,
            ]);
        }

        if ($order !== null) {
            $order->update([
                'status' => OrderStatus::Paid,
                'transaction_id' => $invoiceId,
                'paid_at' => now(),
            ]);
        }

        Log::channel('payments')->info('monobank.payment.success', [
            'user_id' => $userId,
            'order_number' => $order?->order_number,
            'invoice_id' => $invoiceId,
            'amount_uah' => $amountUah,
            'is_renewal' => $order === null,
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

        // For recurring charge failures without a reference, find the
        // subscription by Monobank's subscriptionId.
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
                'type' => 'charge',
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
            // Recurring charge failure without an order — move to PastDue
            // with a grace period directly.
            $subscription->update([
                'status' => SubscriptionStatus::PastDue,
                'grace_period_ends_at' => now()->addDays(3),
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
