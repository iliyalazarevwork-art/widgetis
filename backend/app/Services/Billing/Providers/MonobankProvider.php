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
use App\Services\Billing\UniqueOrderNumberProvider;
use AratKruglik\Monobank\Contracts\ClientInterface as MonobankClient;
use AratKruglik\Monobank\DTO\CartItemDTO;
use AratKruglik\Monobank\DTO\InvoiceRequestDTO;
use AratKruglik\Monobank\DTO\InvoiceResponseDTO;
use AratKruglik\Monobank\Exceptions\MonobankException;
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
        private readonly MonobankClient $client,
        private readonly PubKeyProvider $pubKeyProvider,
        private readonly UniqueOrderNumberProvider $orderNumbers,
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
        // Scope by user_id — defense in depth against cross-user hijack
        // if any future caller passes a user-supplied $reference.
        $order = Order::where('order_number', $reference)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if ($user->monobank_wallet_id === null) {
            $user->monobank_wallet_id = (string) Str::uuid();
            $user->save();
        }

        $amount = $billingPeriod === BillingPeriod::Yearly
            ? (float) $plan->price_yearly
            : (float) $plan->price_monthly;

        // Ukrainian label for the Monobank payment page (the bank shows
        // destination / cart item name as-is to the end user).
        $planName = $plan->getTranslation('name', 'uk');
        $periodLabel = $billingPeriod === BillingPeriod::Yearly ? 'річна підписка' : 'щомісячна підписка';
        $label = 'Widgetis: ' . $planName . ' — ' . $periodLabel;

        // Per-plan icon: Monobank's /invoice/create accepts a public URL
        // for the cart item icon and renders it on the payment page in
        // place of the generic placeholder.
        $iconUrl = $this->planIconUrl($plan->slug);

        // Fail fast on missing config — Monobank rejects empty redirect/webhook
        // URLs or missing token with a generic 400, which historically buried
        // the real cause inside its ValidationException.
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

        $dto = new InvoiceRequestDTO(
            amount: $amount,
            redirectUrl: $effectiveRedirect,
            webHookUrl: $configuredWebhook,
            validity: 86400,
            saveCardData: [
                'saveCard' => true,
                'walletId' => $user->monobank_wallet_id,
            ],
            cartItems: [
                new CartItemDTO(
                    name: $label,
                    qty: 1,
                    sum: $amount,
                    icon: $iconUrl,
                    unit: 'шт',
                ),
            ],
            destination: $label,
            reference: $order->order_number,
        );

        // InvoiceRequestDTO does not expose a lang field, so we merge it
        // into the raw payload ourselves. Monobank defaults to English
        // without this field, which surfaces as "Cart items" / "1 pcs".
        $payload = array_merge($dto->toArray(), ['lang' => 'uk']);

        try {
            $raw = $this->client->post('invoice/create', $payload);
            $response = InvoiceResponseDTO::fromArray($raw->json());
        } catch (MonobankException $e) {
            Log::channel('payments')->error('monobank.invoice.create_failed', [
                'user_id' => $user->id,
                'order_number' => $order->order_number,
                'error' => $e->getMessage(),
                'api_error' => $e->getApiErrorDetails(),
            ]);

            throw $e;
        }

        // Note: we deliberately do NOT write Subscription state here.
        // The checkout endpoint already persisted a pending Subscription
        // row, and the real transition (to Active, with the final
        // invoice id) lands via handleWebhook when Monobank confirms
        // the charge. Writing here would race with the webhook and
        // make idempotency reasoning harder.
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

    /**
     * Resolve the absolute URL of the plan icon shown on the Monobank
     * payment page. Falls back to the merchant logo if the plan slug
     * has no dedicated icon file (guards against future plans added
     * without a corresponding asset).
     */
    private function planIconUrl(string $planSlug): ?string
    {
        $knownPlans = ['basic', 'pro', 'max'];

        if (in_array($planSlug, $knownPlans, true)) {
            return asset('images/plans/' . $planSlug . '.svg');
        }

        return config('monobank.logo_url') ?: null;
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

        $planName = $plan->getTranslation('name', 'uk');
        $periodLabel = $billingPeriod === BillingPeriod::Yearly ? 'річна підписка' : 'щомісячна підписка';
        $destination = 'Widgetis: поновлення — ' . $planName . ' — ' . $periodLabel;

        // Create a fresh Order row so the webhook can locate it by its
        // unique order_number reference (same contract as the checkout
        // flow). Without this step, /wallet/payment's reference would
        // not map to any merchant-side entity and handleSuccess would
        // drop every renewal webhook as "order_not_found".
        $siteDomain = $subscription->user->sites()->orderBy('id')->value('domain');
        $order = Order::create([
            'order_number' => $this->orderNumbers->get($siteDomain, $plan->slug),
            'user_id' => $subscription->user_id,
            'plan_id' => $plan->id,
            'billing_period' => $billingPeriod->value,
            'amount' => $amount,
            'discount_amount' => 0,
            'currency' => 'UAH',
            'status' => OrderStatus::Pending,
            'payment_provider' => PaymentProvider::Monobank,
        ]);

        try {
            $response = $this->client->post('wallet/payment', [
                'cardToken' => $subscription->monobank_card_token,
                'amount' => (int) round($amount * 100),
                'ccy' => 980,
                'initiationKind' => 'merchant',
                'merchantPaymInfo' => [
                    'reference' => $order->order_number,
                    'destination' => $destination,
                ],
            ]);
        } catch (MonobankException $e) {
            Log::channel('payments')->warning('monobank.recurring.failed', [
                'subscription_id' => $subscription->id,
                'order_number' => $order->order_number,
                'error' => $e->getMessage(),
            ]);

            return ChargeResult::fail(code: 'MONOBANK_ERROR', message: $e->getMessage());
        }

        $body = (array) $response->json();
        $status = (string) ($body['status'] ?? 'processing');
        $invoiceId = (string) ($body['invoiceId'] ?? '');

        // Monobank may return HTTP 200 with a terminal failure status
        // ("failure" / "reversed" / "expired"). The HTTP success only
        // means "request accepted"; the charge state lives in $status.
        if (in_array($status, ['failure', 'reversed', 'expired'], true)) {
            Log::channel('payments')->warning('monobank.recurring.sync_failure', [
                'subscription_id' => $subscription->id,
                'order_number' => $order->order_number,
                'invoice_id' => $invoiceId,
                'status' => $status,
            ]);

            return ChargeResult::fail(
                code: 'MONOBANK_' . strtoupper($status),
                message: "Monobank rejected the recurring charge with status={$status}",
            );
        }

        Log::channel('payments')->info('monobank.recurring.dispatched', [
            'subscription_id' => $subscription->id,
            'order_number' => $order->order_number,
            'invoice_id' => $invoiceId,
            'status' => $status,
        ]);

        // /wallet/payment may settle synchronously ("success") or move to
        // "processing" and finalise via webhook. Both non-terminal paths
        // land through handleWebhook() which picks the Order row up by
        // its order_number reference and advances the subscription.
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

        // If the user started a new checkout after abandoning this one, the
        // order was cancelled. Do not activate — flag for manual review.
        if ($order->status === OrderStatus::Cancelled) {
            Log::channel('payments')->warning('monobank.payment.success_for_cancelled_order', [
                'user_id' => $order->user_id,
                'order_number' => $order->order_number,
                'invoice_id' => $invoiceId,
            ]);

            return WebhookResult::ignored($reference, 'success');
        }

        $amountCents = (int) ($payload['finalAmount'] ?? $payload['amount'] ?? 0);
        $amountUah = $amountCents / 100;

        // Strip walletData from metadata: cardToken is stored on the
        // Subscription row as the canonical recurring-charge credential,
        // no need to duplicate it inside payments.metadata (widens the
        // blast radius on any DB leak).
        $scrubbed = $payload;
        unset($scrubbed['walletData']);

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
            'metadata' => $scrubbed,
        ]);

        $subscription = Subscription::where('user_id', $order->user_id)->first();

        if ($subscription !== null) {
            $billingPeriod = BillingPeriod::from($order->billing_period);

            // On renewal, extend from the existing period_end so paid-for
            // time is never thrown away. On first activation (no Active
            // sub, or its period has already lapsed), start a fresh clock
            // from now. This matches SubscriptionService::renew().
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

            $cardToken = isset($payload['walletData']['cardToken'])
                ? (string) $payload['walletData']['cardToken']
                : $subscription->monobank_card_token;

            $subscription->update([
                'status' => SubscriptionStatus::Active,
                'is_trial' => false,
                'trial_ends_at' => null,
                'current_period_start' => $periodStart,
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
            'status' => OrderStatus::Paid,
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

        $this->failureHandler->handle($order);

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

        // Monobank's /pubkey endpoint returns the key as base64-encoded PEM
        // (including headers). Decode to get the full PEM string and pass
        // it directly to openssl_verify.
        $pemKey = base64_decode($pubKey, strict: true);

        if ($pemKey === false) {
            return false;
        }

        $body = $request->getContent();
        $result = openssl_verify($body, $signature, $pemKey, OPENSSL_ALGO_SHA256);

        return $result === 1;
    }
}
