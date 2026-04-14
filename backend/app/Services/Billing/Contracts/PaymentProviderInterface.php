<?php

declare(strict_types=1);

namespace App\Services\Billing\Contracts;

use App\Enums\BillingPeriod;
use App\Enums\PaymentProvider;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Billing\DTO\ChargeResult;
use App\Services\Billing\DTO\CheckoutResult;
use App\Services\Billing\DTO\WebhookResult;
use Illuminate\Http\Request;

/**
 * Contract for a payment-subscription provider (LiqPay, Monobank, ...).
 *
 * The caller is responsible for persisting the Order / Payment / Subscription
 * rows before invoking createSubscriptionCheckout; the provider only knows
 * how to build a checkout session against the given $reference (order number).
 */
interface PaymentProviderInterface
{
    public function name(): PaymentProvider;

    /**
     * Build a checkout session the client can follow to authorise the first
     * charge and — where supported — save the card for recurring billing.
     *
     * $reference is the stable merchant-side identifier (e.g. order_number).
     * Every webhook that comes back from the provider must carry this value
     * so the handler can find the correct Order/Subscription.
     */
    public function createSubscriptionCheckout(
        User $user,
        Plan $plan,
        BillingPeriod $billingPeriod,
        string $reference,
        ?string $redirectUrl = null,
    ): CheckoutResult;

    /**
     * Charge the stored payment instrument to renew an active subscription.
     * Providers without native recurring (Monobank) perform a direct charge
     * against a previously tokenised card/wallet; providers with native
     * subscriptions (LiqPay) may no-op here and rely on provider-scheduled
     * webhooks instead — return ChargeResult::ok() in that case.
     */
    public function chargeRecurring(Subscription $subscription): ChargeResult;

    /**
     * Cancel the subscription on the provider side (stop future charges).
     * Returns true on success or if the provider has no side-effect to perform.
     */
    public function cancelSubscription(Subscription $subscription): bool;

    /**
     * Verify and process an incoming webhook request. Providers implement
     * their own signature scheme (LiqPay: HMAC-SHA1; Monobank: ECDSA) and
     * mutate Payment/Subscription state inside this method.
     */
    public function handleWebhook(Request $request): WebhookResult;
}
