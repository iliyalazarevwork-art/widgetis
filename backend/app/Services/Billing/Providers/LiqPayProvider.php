<?php

declare(strict_types=1);

namespace App\Services\Billing\Providers;

use App\Enums\BillingPeriod;
use App\Enums\PaymentProvider;
use App\Models\Order;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Billing\Contracts\PaymentProviderInterface;
use App\Services\Billing\DTO\ChargeResult;
use App\Services\Billing\DTO\CheckoutResult;
use App\Services\Billing\DTO\WebhookResult;
use App\Services\Billing\LiqPayService;
use App\Services\Billing\LiqPayWebhookService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Adapter around the pre-existing LiqPayService/LiqPayWebhookService.
 *
 * Does not duplicate logic — the two legacy services remain the source
 * of truth for signing, webhook parsing, and state transitions. This
 * adapter only reshapes the inputs/outputs into the PaymentProvider
 * contract so SubscriptionService and the new checkout endpoint can
 * treat LiqPay and Monobank uniformly.
 */
class LiqPayProvider implements PaymentProviderInterface
{
    public function __construct(
        private readonly LiqPayService $liqPayService,
        private readonly LiqPayWebhookService $webhookService,
    ) {
    }

    public function name(): PaymentProvider
    {
        return PaymentProvider::LiqPay;
    }

    public function createSubscriptionCheckout(
        User $user,
        Plan $plan,
        BillingPeriod $billingPeriod,
        string $reference,
        ?string $redirectUrl = null,
    ): CheckoutResult {
        // Scope the lookup by user_id even though the caller controls
        // $reference — defense in depth against any future caller that
        // passes a user-supplied value, blocking cross-user hijack.
        $order = Order::where('order_number', $reference)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $publicBaseUrl = rtrim((string) config('app.url'), '/');
        $serverUrl = $publicBaseUrl . '/api/v1/payments/liqpay/callback';
        $resultUrl = $redirectUrl ?? ($publicBaseUrl . '/liqpay/return');

        $checkout = $this->liqPayService->createSubscriptionCheckout(
            order: $order,
            plan: $plan,
            billingPeriod: $billingPeriod,
            serverUrl: $serverUrl,
            resultUrl: $resultUrl,
            withTrial: (int) ($plan->trial_days ?? 0) > 0,
            trialDays: (int) ($plan->trial_days ?? 0),
        );

        return CheckoutResult::postForm(
            url: $checkout['checkout_url'],
            formFields: [
                'data' => $checkout['data'],
                'signature' => $checkout['signature'],
            ],
            providerReference: $checkout['order_id'],
        );
    }

    public function chargeRecurring(Subscription $subscription): ChargeResult
    {
        // LiqPay schedules recurring charges on its side and notifies us via
        // the webhook channel, so this method is intentionally a no-op here.
        return ChargeResult::noop();
    }

    public function cancelSubscription(Subscription $subscription): bool
    {
        if ($subscription->payment_provider_subscription_id === null) {
            return true;
        }

        $success = $this->liqPayService->cancelSubscription($subscription->payment_provider_subscription_id);

        if (! $success) {
            Log::channel('payments')->warning('liqpay.unsubscribe_failed', [
                'user_id' => $subscription->user_id,
                'payment_provider_subscription_id' => $subscription->payment_provider_subscription_id,
            ]);
        }

        return $success;
    }

    public function handleWebhook(Request $request): WebhookResult
    {
        $data = (string) $request->input('data', '');
        $signature = (string) $request->input('signature', '');

        $valid = $this->webhookService->process($data, $signature);

        if (! $valid) {
            return WebhookResult::invalidSignature();
        }

        $payload = $this->liqPayService->decodeCallbackData($data);

        return WebhookResult::processed(
            reference: isset($payload['order_id']) ? (string) $payload['order_id'] : null,
            providerStatus: isset($payload['status']) ? (string) $payload['status'] : null,
        );
    }
}
