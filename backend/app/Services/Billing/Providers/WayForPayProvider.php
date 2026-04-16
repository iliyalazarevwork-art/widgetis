<?php

declare(strict_types=1);

namespace App\Services\Billing\Providers;

use App\Enums\BillingPeriod;
use App\Enums\PaymentProvider;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Billing\Contracts\PaymentProviderInterface;
use App\Services\Billing\DTO\ChargeResult;
use App\Services\Billing\DTO\CheckoutResult;
use App\Services\Billing\DTO\WebhookResult;
use App\Services\Billing\WayForPayService;
use App\Services\Billing\WayForPayWebhookService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Adapter wrapping WayForPayService / WayForPayWebhookService in the
 * PaymentProviderInterface contract so SubscriptionController and the
 * recurring-charge cron can treat providers uniformly.
 *
 * Trial model: the checkout creates a hosted Purchase for the configured
 * verify amount (default 1 UAH). Once the user enters their card, WFP
 * fires an Approved webhook containing a recToken that we persist on the
 * subscription. WayForPayWebhookService then flips the subscription to
 * Trial for the plan's trial_days window and (optionally) refunds the
 * verification charge so the customer's net cost stays zero.
 *
 * Recurring: ChargeRecurringSubscriptions picks up near-expiry Trial /
 * Active subscriptions and calls chargeRecurring() here, which issues a
 * CHARGE against the saved recToken for the real plan amount. The resulting
 * webhook lands as a renewal path through activateOrRenew().
 */
class WayForPayProvider implements PaymentProviderInterface
{
    public function __construct(
        private readonly WayForPayService $wayForPayService,
        private readonly WayForPayWebhookService $webhookService,
    ) {
    }

    public function name(): PaymentProvider
    {
        return PaymentProvider::WayForPay;
    }

    public function createSubscriptionCheckout(
        User $user,
        Plan $plan,
        BillingPeriod $billingPeriod,
        string $reference,
        ?string $redirectUrl = null,
    ): CheckoutResult {
        // Scope by user_id — defense in depth against any caller passing
        // a user-supplied $reference. Mirrors Monobank provider behavior.
        $order = Order::where('order_number', $reference)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $publicBaseUrl = rtrim((string) config('app.url'), '/');
        $serviceUrl = (string) (config('services.wayforpay.webhook_url')
            ?: $publicBaseUrl . '/api/v1/payments/wayforpay/callback');
        $returnUrl = $redirectUrl ?? (string) (config('services.wayforpay.return_url')
            ?: $publicBaseUrl . '/cabinet/plan?payment=processing');

        $verifyAmount = (float) config('services.wayforpay.trial_verify_amount', 1.0);

        $checkout = $this->wayForPayService->createVerifyCheckout(
            user: $user,
            order: $order,
            plan: $plan,
            billingPeriod: $billingPeriod,
            serviceUrl: $serviceUrl,
            returnUrl: $returnUrl,
            verifyAmount: $verifyAmount,
        );

        // On local env WayForPay cannot reach the backend, so we
        // short-circuit to the simulated Approved flow — the customer
        // never sees a real WFP checkout page.
        if (app()->environment('local')) {
            $this->webhookService->simulateSuccess($order);

            Log::channel('payments')->info('wayforpay.checkout.emulated', [
                'user_id' => $user->id,
                'order_reference' => $order->order_number,
            ]);
        }

        // Hosted checkout is a POST form — browser submits signed fields
        // to secure.wayforpay.com/pay.
        /** @var array<string, string> $formFields */
        $formFields = $this->flattenFormFields($checkout['form']);

        return CheckoutResult::postForm(
            url: $checkout['url'],
            formFields: $formFields,
            providerReference: $order->order_number,
        );
    }

    public function chargeRecurring(Subscription $subscription): ChargeResult
    {
        // WayForPay runs its own regular-payment scheduler (set up during
        // the initial checkout via PurchaseWizard::setRegular) and notifies
        // us through the serviceUrl webhook on every charge. Issuing our
        // own merchant-initiated CHARGE in parallel would double-bill the
        // customer. ChargeRecurringSubscriptions already short-circuits
        // this provider — this no-op is a belt-and-braces guard for any
        // future caller that resolves the adapter directly.
        return ChargeResult::noop();
    }

    public function cancelSubscription(Subscription $subscription): bool
    {
        // Find the original order reference that set up the WayForPay regular
        // payment. We need it to call regularApi REMOVE so WayForPay stops
        // charging the customer on its own bank-side schedule.
        $payment = Payment::where('subscription_id', $subscription->id)
            ->whereNotNull('order_id')
            ->with('order')
            ->first();

        $orderReference = $payment?->order?->order_number;

        if ($orderReference === null || $orderReference === '') {
            Log::channel('payments')->warning('wayforpay.subscription.cancel_no_order', [
                'subscription_id' => $subscription->id,
            ]);
        } else {
            $this->wayForPayService->removeRegularPayment($orderReference);
        }

        Log::channel('payments')->info('wayforpay.subscription.cancelled', [
            'subscription_id' => $subscription->id,
            'order_reference' => $orderReference,
        ]);

        return true;
    }

    public function handleWebhook(Request $request): WebhookResult
    {
        // WayForPay sends application/json with merchantSignature inside.
        /** @var array<string, mixed> $payload */
        $payload = (array) $request->json()->all();

        if (! $this->wayForPayService->verifyWebhookSignature($payload)) {
            Log::channel('payments')->warning('wayforpay.webhook.invalid_signature', [
                'ip' => $request->ip(),
                'order_reference' => $payload['orderReference'] ?? null,
            ]);

            return WebhookResult::invalidSignature();
        }

        $outcome = $this->webhookService->process($payload);

        $processed = in_array(
            $outcome['status'],
            ['activated', 'trial_activated', 'refunded', 'failed'],
            true,
        );

        if ($processed) {
            return WebhookResult::processed(
                reference: $outcome['order_reference'],
                providerStatus: $outcome['status'],
            );
        }

        return WebhookResult::ignored(
            reference: $outcome['order_reference'],
            providerStatus: $outcome['status'],
        );
    }

    /**
     * Flatten WayForPay's hosted-checkout form into a string-keyed map.
     * Arrays (productName[], productCount[], productPrice[]) are expanded
     * into bracketed keys so the browser's form-encoder preserves order.
     *
     * @param array<string, mixed> $form
     *
     * @return array<string, string>
     */
    private function flattenFormFields(array $form): array
    {
        $flat = [];

        foreach ($form as $key => $value) {
            if (is_array($value)) {
                foreach (array_values($value) as $index => $item) {
                    $flat[$key . '[' . $index . ']'] = (string) $item;
                }

                continue;
            }

            $flat[$key] = (string) $value;
        }

        return $flat;
    }
}
