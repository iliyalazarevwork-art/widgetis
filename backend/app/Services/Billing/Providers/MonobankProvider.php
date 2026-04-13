<?php

declare(strict_types=1);

namespace App\Services\Billing\Providers;

use App\Enums\BillingPeriod;
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
use AratKruglik\Monobank\Contracts\ClientInterface as MonobankClient;
use AratKruglik\Monobank\DTO\CartItemDTO;
use AratKruglik\Monobank\DTO\InvoiceRequestDTO;
use AratKruglik\Monobank\Exceptions\MonobankException;
use AratKruglik\Monobank\Monobank;
use AratKruglik\Monobank\Services\PubKeyProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Monobank payment provider.
 *
 * Uses the aratkruglik/monobank-laravel facade for documented endpoints
 * (invoice/create, pubkey) and hits /wallet/payment directly for
 * merchant-initiated recurring charges, which the package does not cover.
 *
 * Monobank has no server-side "subscription" entity: we create an initial
 * invoice with saveCardData=true, persist the walletId+cardToken from the
 * webhook that confirms success, then charge that token on renewal via
 * chargeRecurring().
 */
class MonobankProvider implements PaymentProviderInterface
{
    public function __construct(
        private readonly Monobank $monobank,
        private readonly MonobankClient $client,
        private readonly PubKeyProvider $pubKeyProvider,
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
    ): CheckoutResult {
        $order = Order::where('order_number', $reference)->firstOrFail();

        if ($user->monobank_wallet_id === null) {
            $user->monobank_wallet_id = (string) Str::uuid();
            $user->save();
        }

        $amount = $billingPeriod === BillingPeriod::Yearly
            ? (float) $plan->price_yearly
            : (float) $plan->price_monthly;

        $label = 'Widgetis: ' . $plan->slug . ' (' . $billingPeriod->value . ')';

        $dto = new InvoiceRequestDTO(
            amount: $amount,
            redirectUrl: (string) config('monobank.redirect_url'),
            webHookUrl: (string) config('monobank.webhook_url'),
            validity: 86400,
            saveCardData: [
                'saveCard' => true,
                'walletId' => $user->monobank_wallet_id,
            ],
            cartItems: [
                new CartItemDTO(name: $label, qty: 1, sum: $amount),
            ],
            destination: $label,
            reference: $order->order_number,
        );

        try {
            $response = $this->monobank->createInvoice($dto);
        } catch (MonobankException $e) {
            Log::channel('payments')->error('monobank.invoice.create_failed', [
                'user_id' => $user->id,
                'order_number' => $order->order_number,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }

        Subscription::where('user_id', $user->id)->update([
            'payment_provider' => PaymentProvider::Monobank,
            'payment_provider_subscription_id' => $response->invoiceId,
        ]);

        Log::channel('payments')->info('monobank.invoice.created', [
            'user_id' => $user->id,
            'order_number' => $order->order_number,
            'invoice_id' => $response->invoiceId,
        ]);

        return CheckoutResult::redirect(
            url: $response->pageUrl,
            providerReference: $response->invoiceId,
        );
    }

    public function chargeRecurring(Subscription $subscription): ChargeResult
    {
        if ($subscription->monobank_card_token === null) {
            return ChargeResult::fail(
                code: 'NO_CARD_TOKEN',
                message: 'Subscription has no saved Monobank card token.',
            );
        }

        $plan = $subscription->plan;
        $billingPeriod = BillingPeriod::from($subscription->billing_period);
        $amount = $billingPeriod === BillingPeriod::Yearly
            ? (float) $plan->price_yearly
            : (float) $plan->price_monthly;

        $reference = sprintf('sub_%d_%d', $subscription->id, now()->timestamp);
        $destination = 'Widgetis renewal: ' . $plan->slug . ' (' . $billingPeriod->value . ')';

        try {
            $response = $this->client->post('wallet/payment', [
                'cardToken' => $subscription->monobank_card_token,
                'amount' => (int) round($amount * 100),
                'ccy' => 980,
                'initiationKind' => 'merchant',
                'merchantPaymInfo' => [
                    'reference' => $reference,
                    'destination' => $destination,
                ],
            ]);
        } catch (MonobankException $e) {
            Log::channel('payments')->warning('monobank.recurring.failed', [
                'subscription_id' => $subscription->id,
                'error' => $e->getMessage(),
            ]);

            return ChargeResult::fail(code: 'MONOBANK_ERROR', message: $e->getMessage());
        }

        $body = (array) $response->json();
        $status = (string) ($body['status'] ?? 'processing');
        $invoiceId = (string) ($body['invoiceId'] ?? '');

        Log::channel('payments')->info('monobank.recurring.dispatched', [
            'subscription_id' => $subscription->id,
            'invoice_id' => $invoiceId,
            'status' => $status,
        ]);

        // /wallet/payment may settle synchronously ("success") or move to
        // "processing" and finalise via webhook. Treat both as successfully
        // dispatched — final state lands through handleWebhook().
        return ChargeResult::ok($invoiceId);
    }

    public function cancelSubscription(Subscription $subscription): bool
    {
        // Monobank has no server-side subscription entity. Cancelling on our
        // side means "stop scheduling future wallet/payment calls", which
        // happens implicitly once the Subscription row is marked Cancelled.
        // Nothing to tell the bank — they never knew about a subscription.
        Log::channel('payments')->info('monobank.subscription.cancelled', [
            'subscription_id' => $subscription->id,
        ]);

        return true;
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
        // Idempotency: skip if we already recorded a success for this invoice.
        $existing = Payment::where('transaction_id', $invoiceId)
            ->where('status', PaymentStatus::Success->value)
            ->first();

        if ($existing !== null) {
            return WebhookResult::ignored($reference, 'success');
        }

        $order = $reference !== null
            ? Order::where('order_number', $reference)->first()
            : null;

        if ($order === null) {
            Log::channel('payments')->error('monobank.webhook.order_not_found', [
                'invoice_id' => $invoiceId,
                'reference' => $reference,
            ]);

            return WebhookResult::ignored($reference, 'success');
        }

        $amountCents = (int) ($payload['finalAmount'] ?? $payload['amount'] ?? 0);
        $amountUah = $amountCents / 100;

        Payment::create([
            'user_id' => $order->user_id,
            'order_id' => $order->id,
            'type' => 'charge',
            'amount' => $amountUah,
            'currency' => 'UAH',
            'status' => PaymentStatus::Success->value,
            'payment_provider' => PaymentProvider::Monobank,
            'payment_method' => (string) ($payload['paymentInfo']['paymentSystem'] ?? 'card'),
            'transaction_id' => $invoiceId,
            'description' => ['monobank_destination' => (string) ($payload['destination'] ?? '')],
            'metadata' => $payload,
        ]);

        $subscription = Subscription::where('user_id', $order->user_id)->first();

        if ($subscription !== null) {
            $billingPeriod = BillingPeriod::from($order->billing_period);
            $periodEnd = $billingPeriod === BillingPeriod::Yearly
                ? now()->addYear()
                : now()->addMonth();

            $cardToken = isset($payload['walletData']['cardToken'])
                ? (string) $payload['walletData']['cardToken']
                : $subscription->monobank_card_token;

            $subscription->update([
                'status' => SubscriptionStatus::Active,
                'is_trial' => false,
                'trial_ends_at' => null,
                'current_period_start' => now(),
                'current_period_end' => $periodEnd,
                'payment_provider' => PaymentProvider::Monobank,
                'payment_provider_subscription_id' => $invoiceId,
                'monobank_card_token' => $cardToken,
                'payment_retry_count' => 0,
                'next_payment_retry_at' => null,
                'grace_period_ends_at' => null,
            ]);
        }

        $order->update([
            'status' => \App\Enums\OrderStatus::Paid,
            'transaction_id' => $invoiceId,
            'paid_at' => now(),
        ]);

        Log::channel('payments')->info('monobank.payment.success', [
            'user_id' => $order->user_id,
            'order_number' => $order->order_number,
            'invoice_id' => $invoiceId,
            'amount_uah' => $amountUah,
        ]);

        return WebhookResult::processed($reference, 'success');
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function handleFailure(string $invoiceId, ?string $reference, string $status, array $payload): WebhookResult
    {
        $order = $reference !== null
            ? Order::where('order_number', $reference)->first()
            : null;

        if ($order === null) {
            return WebhookResult::ignored($reference, $status);
        }

        Payment::firstOrCreate(
            [
                'transaction_id' => $invoiceId,
                'status' => PaymentStatus::Failed->value,
            ],
            [
                'user_id' => $order->user_id,
                'order_id' => $order->id,
                'type' => 'charge',
                'amount' => ((int) ($payload['amount'] ?? 0)) / 100,
                'currency' => 'UAH',
                'payment_provider' => PaymentProvider::Monobank,
                'description' => ['monobank_status' => $status],
                'metadata' => $payload,
            ],
        );

        $subscription = Subscription::where('user_id', $order->user_id)->first();

        if ($subscription !== null && $subscription->status !== SubscriptionStatus::Active) {
            $subscription->update([
                'status' => SubscriptionStatus::PastDue,
                'grace_period_ends_at' => now()->addDays(3),
            ]);
        }

        Log::channel('payments')->warning('monobank.payment.failed', [
            'user_id' => $order->user_id,
            'order_number' => $order->order_number,
            'invoice_id' => $invoiceId,
            'status' => $status,
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

        $body = $request->getContent();
        $result = openssl_verify($body, $signature, $pubKey, OPENSSL_ALGO_SHA256);

        return $result === 1;
    }
}
