<?php

declare(strict_types=1);

namespace App\Services\Billing;

use App\Enums\BillingPeriod;
use App\Enums\OrderStatus;
use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\SiteStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Site;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Billing\DTO\CheckoutPayload;
use App\Services\Billing\DTO\UpgradeQuote;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Orchestrates the creation of Order + Subscription + Payment rows
 * and delegates to the chosen provider for a checkout session.
 *
 * This single service replaces the duplicated checkout logic that was
 * previously scattered across SubscriptionController::checkout(),
 * SubscriptionController::upgrade(), and GuestCheckoutController.
 *
 * Transaction boundary: the DB writes run inside a transaction; the
 * provider HTTP call runs OUTSIDE it so a slow external request does
 * not hold a database lock.
 */
class CheckoutService
{
    public function __construct(
        private readonly UniqueOrderNumberProvider $orderNumbers,
        private readonly BillingOrchestrator $orchestrator,
    ) {
    }

    /**
     * Cancel any pending (unpaid) orders for a user so stale checkout
     * pages cannot accidentally activate a subscription.
     */
    public function cancelStalePendingOrders(string $userId): void
    {
        Log::channel('payments')->info('checkout.cancel_stale_pending_orders.in', [
            'user_id' => $userId,
        ]);

        $cancelledOrders = 0;
        $failedPayments = 0;

        Order::where('user_id', $userId)
            ->where('status', OrderStatus::Pending)
            ->each(function (Order $staleOrder) use (&$cancelledOrders, &$failedPayments): void {
                $staleOrder->update(['status' => OrderStatus::Cancelled]);
                $cancelledOrders++;
                $failedPayments += $staleOrder->payments()
                    ->where('status', PaymentStatus::Pending->value)
                    ->update(['status' => PaymentStatus::Failed->value]);
            });

        Log::channel('payments')->info('checkout.cancel_stale_pending_orders.out', [
            'user_id' => $userId,
            'cancelled_orders' => $cancelledOrders,
            'failed_pending_payments' => $failedPayments,
        ]);
    }

    /**
     * Create a new subscription checkout: Order + Subscription + Payment,
     * then start a checkout session with the provider.
     */
    public function createCheckout(
        User $user,
        Plan $plan,
        BillingPeriod $billingPeriod,
        PaymentProvider $provider,
        string $siteDomain,
        ?string $platform = null,
        ?string $redirectUrl = null,
    ): CheckoutPayload {
        Log::channel('payments')->info('checkout.create.in', [
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'plan_slug' => $plan->slug,
            'billing_period' => $billingPeriod->value,
            'provider' => $provider->value,
            'site_domain' => $siteDomain,
            'platform' => $platform,
            'has_redirect_url' => $redirectUrl !== null,
        ]);

        /** @var string $reference */
        $reference = DB::transaction(function () use ($user, $plan, $billingPeriod, $provider, $siteDomain, $platform): string {
            User::where('id', $user->id)->lockForUpdate()->first();

            Site::firstOrCreate(
                ['user_id' => $user->id, 'domain' => $siteDomain],
                [
                    'name'     => $siteDomain,
                    'url'      => 'https://' . $siteDomain,
                    'platform' => $platform ?? 'horoshop',
                    'status'   => SiteStatus::Pending,
                ],
            );

            $amount = $billingPeriod === BillingPeriod::Yearly
                ? $plan->price_yearly
                : $plan->price_monthly;

            $order = Order::create([
                'order_number'     => $this->orderNumbers->get($siteDomain, $plan->slug),
                'user_id'          => $user->id,
                'plan_id'          => $plan->id,
                'billing_period'   => $billingPeriod->value,
                'amount'           => $amount,
                'discount_amount'  => 0,
                'currency'         => 'UAH',
                'status'           => OrderStatus::Pending,
                'payment_provider' => $provider,
            ]);

            Subscription::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'plan_id'                          => $plan->id,
                    'billing_period'                   => $billingPeriod->value,
                    'status'                           => SubscriptionStatus::Pending,
                    'is_trial'                         => false,
                    'trial_ends_at'                    => null,
                    'current_period_start'             => now(),
                    'current_period_end'               => now()->addDays((int) ($plan->trial_days ?? 7)),
                    'payment_provider'                 => $provider,
                    'payment_provider_subscription_id' => null,
                    'payment_retry_count'              => 0,
                ],
            );

            $subscription = Subscription::where('user_id', $user->id)->first();

            Payment::create([
                'user_id'          => $user->id,
                'order_id'         => $order->id,
                'subscription_id'  => $subscription?->id,
                'type'             => PaymentType::Charge->value,
                'amount'           => (float) $amount,
                'currency'         => 'UAH',
                'status'           => PaymentStatus::Pending->value,
                'payment_provider' => $provider,
                'description'      => [
                    'en' => "Subscription: {$plan->slug} ({$billingPeriod->value})",
                    'uk' => "Підписка: {$plan->slug} ({$billingPeriod->value})",
                ],
            ]);

            return $order->order_number;
        });

        try {
            $session = $this->orchestrator->startSubscriptionCheckout(
                user: $user,
                plan: $plan,
                period: $billingPeriod,
                provider: $provider,
                reference: $reference,
                redirectUrl: $redirectUrl,
            );
        } catch (\Throwable $exception) {
            Log::channel('payments')->error('checkout.create.out', [
                'user_id' => $user->id,
                'reference' => $reference,
                'provider' => $provider->value,
                'result' => 'error',
                'exception_class' => $exception::class,
                'exception_message' => $exception->getMessage(),
            ]);
            throw $exception;
        }

        // For Monobank: the providerReference from the session is the
        // subscriptionId returned by the provider. Persist it on the
        // Subscription row so recurring webhooks can be matched back.
        if ($session->providerReference !== null && $session->providerReference !== '') {
            Subscription::where('user_id', $user->id)
                ->whereNull('payment_provider_subscription_id')
                ->update(['payment_provider_subscription_id' => $session->providerReference]);
        }

        $payload = CheckoutPayload::fromCheckoutSession($session, $provider, $reference);

        Log::channel('payments')->info('checkout.create.out', [
            'user_id' => $user->id,
            'reference' => $reference,
            'provider' => $provider->value,
            'method' => $payload->method,
            'provider_reference_present' => $payload->providerReference !== null,
            'form_fields_count' => count($payload->formFields),
            'result' => 'success',
        ]);

        return $payload;
    }

    /**
     * Create an upgrade checkout: Order + Payment for the upgrade amount,
     * then start a checkout session with the provider.
     */
    public function createUpgradeCheckout(
        User $user,
        Subscription $subscription,
        Plan $targetPlan,
        BillingPeriod $targetPeriod,
        PaymentProvider $provider,
        UpgradeQuote $quote,
        ?string $redirectUrl = null,
    ): CheckoutPayload {
        Log::channel('payments')->info('checkout.upgrade.create.in', [
            'user_id' => $user->id,
            'subscription_id' => $subscription->id,
            'from_plan_id' => $subscription->plan_id,
            'target_plan_id' => $targetPlan->id,
            'target_plan_slug' => $targetPlan->slug,
            'target_period' => $targetPeriod->value,
            'provider' => $provider->value,
            'amount_due' => $quote->amountDue,
            'credit_applied' => $quote->creditApplied,
            'has_redirect_url' => $redirectUrl !== null,
        ]);

        $firstSite = $user->sites()->first();
        $siteDomain = $firstSite !== null ? $firstSite->domain : $targetPlan->slug;
        $amountDue = $quote->amountDue;

        /** @var string $reference */
        $reference = DB::transaction(function () use ($user, $targetPlan, $targetPeriod, $provider, $siteDomain, $amountDue, $quote, $subscription): string {
            User::where('id', $user->id)->lockForUpdate()->first();

            $this->cancelStalePendingOrders($user->id);

            $order = Order::create([
                'order_number'     => $this->orderNumbers->get($siteDomain, $targetPlan->slug),
                'user_id'          => $user->id,
                'plan_id'          => $targetPlan->id,
                'billing_period'   => $targetPeriod->value,
                'amount'           => $amountDue,
                'discount_amount'  => $quote->creditApplied,
                'currency'         => 'UAH',
                'status'           => OrderStatus::Pending,
                'payment_provider' => $provider,
                'notes'            => [
                    'upgrade'                            => true,
                    'from_plan_slug'                     => $quote->fromPlanSlug,
                    'to_plan_slug'                       => $quote->toPlanSlug,
                    'credit_applied'                     => $quote->creditApplied,
                    'target_amount'                      => $quote->targetAmount,
                    'from_subscription_id'               => $subscription->id,
                    'old_payment_provider'               => $subscription->payment_provider?->value,
                    'old_payment_provider_subscription_id' => $subscription->payment_provider_subscription_id,
                    'old_monobank_card_token'             => $subscription->monobank_card_token,
                    'old_wayforpay_rec_token'             => $subscription->wayforpay_rec_token,
                ],
            ]);

            Payment::create([
                'user_id'          => $user->id,
                'order_id'         => $order->id,
                'subscription_id'  => $subscription->id,
                'type'             => PaymentType::Upgrade->value,
                'amount'           => (float) $amountDue,
                'currency'         => 'UAH',
                'status'           => PaymentStatus::Pending->value,
                'payment_provider' => $provider,
                'description'      => [
                    'en' => "Upgrade: {$quote->fromPlanSlug} → {$quote->toPlanSlug} ({$targetPeriod->value})",
                    'uk' => "Апгрейд: {$quote->fromPlanSlug} → {$quote->toPlanSlug} ({$targetPeriod->value})",
                ],
            ]);

            return $order->order_number;
        });

        try {
            $session = $this->orchestrator->startSubscriptionCheckout(
                user: $user,
                plan: $targetPlan,
                period: $targetPeriod,
                provider: $provider,
                reference: $reference,
                redirectUrl: $redirectUrl,
            );
        } catch (\Throwable $exception) {
            Log::channel('payments')->error('checkout.upgrade.create.out', [
                'user_id' => $user->id,
                'reference' => $reference,
                'provider' => $provider->value,
                'result' => 'error',
                'exception_class' => $exception::class,
                'exception_message' => $exception->getMessage(),
            ]);
            throw $exception;
        }

        $payload = CheckoutPayload::fromCheckoutSession(
            $session,
            $provider,
            $reference,
            (float) $amountDue,
            $quote->creditApplied,
        );

        Log::channel('payments')->info('checkout.upgrade.create.out', [
            'user_id' => $user->id,
            'reference' => $reference,
            'provider' => $provider->value,
            'method' => $payload->method,
            'provider_reference_present' => $payload->providerReference !== null,
            'form_fields_count' => count($payload->formFields),
            'amount_due' => $payload->amountDue,
            'credit_applied' => $payload->creditApplied,
            'result' => 'success',
        ]);

        return $payload;
    }
}
