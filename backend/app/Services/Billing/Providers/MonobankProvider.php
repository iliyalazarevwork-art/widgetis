<?php

declare(strict_types=1);

namespace App\Services\Billing\Providers;

use App\Enums\BillingPeriod;
use App\Enums\PaymentProvider;
use App\Exceptions\Billing\PaymentProviderConfigException;
use App\Models\Order;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Billing\Contracts\PaymentProviderInterface;
use App\Services\Billing\DTO\ChargeResult;
use App\Services\Billing\DTO\CheckoutResult;
use App\Services\Billing\DTO\WebhookResult;
use App\Services\Billing\MonobankWebhookService;
use AratKruglik\Monobank\Contracts\ClientInterface as MonobankClient;
use AratKruglik\Monobank\DTO\SubscriptionRequestDTO;
use AratKruglik\Monobank\DTO\SubscriptionResponseDTO;
use AratKruglik\Monobank\Facades\Monobank;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Monobank payment provider adapter (thin wrapper).
 *
 * Creates a Monobank subscription via POST /subscription/create with
 * the billing interval (1m / 1y). Monobank handles recurring charges
 * automatically and sends webhooks for each charge event. Our cron
 * does NOT need to call chargeRecurring — Monobank self-schedules.
 *
 * Webhook processing is delegated to MonobankWebhookService (mirrors
 * the WayForPayProvider → WayForPayWebhookService pattern).
 */
class MonobankProvider implements PaymentProviderInterface
{
    public function __construct(
        private readonly MonobankClient $client,
        private readonly MonobankWebhookService $webhookService,
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

        // Trust the Order amount so upgrade checkouts charge the prorated
        // amount_due rather than the full plan price. Falls back to the plan
        // price only if the order has no amount set.
        $orderAmount = (float) $order->amount;
        $amount = $orderAmount > 0
            ? $orderAmount
            : ($billingPeriod === BillingPeriod::Yearly
                ? (float) $plan->price_yearly
                : (float) $plan->price_monthly);

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

            throw PaymentProviderConfigException::monobank();
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
     * provider (same as WayForPay).
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
        return $this->webhookService->process($request);
    }
}
