<?php

declare(strict_types=1);

namespace App\Core\Services\Billing;

use App\Core\Models\Order;
use App\Core\Models\Payment;
use App\Core\Models\Plan;
use App\Core\Models\Subscription;
use App\Core\Models\User;
use App\Core\Services\Billing\Commands\CancelSubscriptionCommand;
use App\Core\Services\Billing\Commands\ChargeCommand;
use App\Core\Services\Billing\Commands\StartSubscriptionCommand;
use App\Core\Services\Billing\Contracts\SupportsMerchantCharge;
use App\Core\Services\Billing\Results\ChargeResult;
use App\Core\Services\Billing\Results\CheckoutSession;
use App\Core\Services\Billing\ValueObjects\CallbackUrls;
use App\Core\Services\Billing\ValueObjects\Currency;
use App\Core\Services\Billing\ValueObjects\CustomerProfile;
use App\Core\Services\Billing\ValueObjects\Money;
use App\Core\Services\Billing\ValueObjects\ProductLabel;
use App\Core\Services\Billing\ValueObjects\ProviderTokens;
use App\Enums\BillingPeriod;
use App\Enums\PaymentProvider;
use Illuminate\Support\Facades\Log;

/**
 * Application-layer orchestrator that bridges Eloquent models with v2 adapters.
 *
 * This is the single place where domain models (User, Plan, Subscription, Order)
 * meet the v2 payment provider commands. Controllers and cron jobs call into
 * this service; adapters only see typed value objects and commands.
 */
final class BillingOrchestrator
{
    public function __construct(
        private readonly PaymentProviderRegistry $registry,
        private readonly SubscriptionService $subscriptionService,
        private readonly WayForPayWebhookService $wayForPayWebhookService,
    ) {
    }

    /**
     * Start a subscription checkout session via the v2 adapter.
     *
     * Resolves the Order by reference + user, builds all value objects, then
     * delegates to the adapter's startSubscription method.
     */
    public function startSubscriptionCheckout(
        User $user,
        Plan $plan,
        BillingPeriod $period,
        PaymentProvider $provider,
        string $reference,
        ?string $redirectUrl = null,
    ): CheckoutSession {
        $order = Order::where('order_number', $reference)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $adapter = $this->registry->get($provider);

        $planAmount = $period === BillingPeriod::Yearly
            ? Money::fromMajor((float) $plan->price_yearly, Currency::UAH)
            : Money::fromMajor((float) $plan->price_monthly, Currency::UAH);

        $customer = CustomerProfile::fromUser($user, 'uk');

        $label = ProductLabel::forSubscription(
            planName: (string) ($plan->name ?? $plan->slug),
            period: $period,
            suffix: $reference,
            locale: 'uk',
        );

        $urls = $this->buildCallbackUrls($provider, $redirectUrl);

        $firstChargeAmount = $this->resolveFirstChargeAmount($provider, $planAmount);

        $trialDays = (int) ($plan->trial_days ?? 7);

        $cmd = new StartSubscriptionCommand(
            reference: $reference,
            firstChargeAmount: $firstChargeAmount,
            recurringAmount: $planAmount,
            period: $period,
            trialDays: $trialDays,
            customer: $customer,
            label: $label,
            urls: $urls,
        );

        $session = $adapter->startSubscription($cmd);

        Log::channel('payments')->info('billing.checkout.started', [
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'provider' => $provider->value,
            'reference' => $reference,
            'method' => $session->method,
        ]);

        if ($provider === PaymentProvider::WayForPay && app()->environment('local')) {
            $this->wayForPayWebhookService->simulateSuccess($order);
        }

        return $session;
    }

    /**
     * Cancel a subscription via the v2 adapter and delegate state transition
     * to the existing SubscriptionService.
     */
    public function cancelSubscription(Subscription $subscription, ?string $reason = null): Subscription
    {
        $adapter = $this->registry->for($subscription);

        $lastOrderReference = $this->resolveLastOrderReference($subscription);

        $tokens = ProviderTokens::of(
            $subscription->payment_provider_subscription_id,
            $subscription->wayforpay_rec_token,
        );

        $cmd = new CancelSubscriptionCommand(
            reference: $lastOrderReference,
            tokens: $tokens,
        );

        $result = $adapter->cancelSubscription($cmd);

        Log::channel('payments')->info('billing.cancel.result', [
            'subscription_id' => $subscription->id,
            'provider' => $subscription->payment_provider?->value,
            'outcome' => $result->outcome->value,
            'provider_message' => $result->providerMessage,
        ]);

        return $this->subscriptionService->cancel($subscription, $reason);
    }

    /**
     * Charge a subscription renewal if the adapter supports merchant-initiated
     * charging. Providers that self-manage recurring (WayForPay, Monobank)
     * return a self-managed noop result.
     */
    public function chargeRecurringIfSupported(Subscription $subscription): ChargeResult
    {
        $adapter = $this->registry->for($subscription);

        if (! ($adapter instanceof SupportsMerchantCharge)) {
            return ChargeResult::ok('self-managed');
        }

        $plan = $subscription->plan;
        $billingPeriod = BillingPeriod::from($subscription->billing_period);

        $amount = $billingPeriod === BillingPeriod::Yearly
            ? Money::fromMajor((float) $plan->price_yearly, Currency::UAH)
            : Money::fromMajor((float) $plan->price_monthly, Currency::UAH);

        $tokens = ProviderTokens::of(
            $subscription->payment_provider_subscription_id,
            $subscription->wayforpay_rec_token,
        );

        $customer = CustomerProfile::fromUser($subscription->user, 'uk');

        $label = ProductLabel::forSubscription(
            planName: (string) ($plan->name ?? $plan->slug),
            period: $billingPeriod,
            suffix: 'renewal',
            locale: 'uk',
        );

        $cmd = new ChargeCommand(
            reference: 'renewal-' . $subscription->id . '-' . time(),
            amount: $amount,
            tokens: $tokens,
            customer: $customer,
            label: $label,
        );

        return $adapter->chargeSavedInstrument($cmd);
    }

    /**
     * Build CallbackUrls for the given provider, falling back to app.url.
     */
    private function buildCallbackUrls(PaymentProvider $provider, ?string $redirectUrl): CallbackUrls
    {
        $appUrl = rtrim((string) config('app.url'), '/');

        return match ($provider) {
            PaymentProvider::WayForPay => new CallbackUrls(
                webhookUrl: (string) (config('services.wayforpay.webhook_url')
                    ?: $appUrl . '/api/v1/payments/wayforpay/callback'),
                returnUrl: $redirectUrl ?? (string) (config('services.wayforpay.return_url')
                    ?: $appUrl . '/cabinet/plan?payment=processing'),
            ),
            PaymentProvider::Monobank => new CallbackUrls(
                webhookUrl: (string) config('monobank.webhook_url'),
                returnUrl: $redirectUrl ?? (string) config('monobank.redirect_url'),
            ),
        };
    }

    /**
     * First charge amount differs per provider:
     * - WayForPay: small verify charge (1 UAH by default)
     * - Monobank: full plan amount (no trial card-verify step)
     */
    private function resolveFirstChargeAmount(PaymentProvider $provider, Money $planAmount): Money
    {
        return match ($provider) {
            PaymentProvider::WayForPay => Money::fromMajor(
                (float) config('services.wayforpay.trial_verify_amount', 1.0),
                Currency::UAH,
            ),
            PaymentProvider::Monobank => $planAmount,
        };
    }

    /**
     * Resolve the last order reference for cancellation command.
     * Falls back to empty string if no order is found.
     */
    private function resolveLastOrderReference(Subscription $subscription): string
    {
        $payment = Payment::where('subscription_id', $subscription->id)
            ->whereNotNull('order_id')
            ->with('order')
            ->orderByDesc('created_at')
            ->first();

        if ($payment === null || $payment->order === null) {
            return '';
        }

        return $payment->order->order_number;
    }
}
