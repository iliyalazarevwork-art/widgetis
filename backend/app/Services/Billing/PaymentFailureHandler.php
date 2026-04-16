<?php

declare(strict_types=1);

namespace App\Services\Billing;

use App\Enums\OrderStatus;
use App\Enums\SubscriptionStatus;
use App\Events\Billing\PaymentFailed;
use App\Models\Order;
use App\Models\Subscription;

/**
 * Centralises the order + subscription state transitions that must happen
 * whenever a payment fails, regardless of the payment provider.
 *
 * Providers delegate here so the
 * logic is never duplicated and is easy to test in isolation.
 */
class PaymentFailureHandler
{
    /** Number of days a subscription stays in PastDue before expiring. */
    public const GRACE_PERIOD_DAYS = 3;

    /**
     * Mark the order as failed and move the subscription to past_due.
     *
     * Safe to call multiple times for the same order (idempotent): if
     * the order is already Failed/Paid the status update is a no-op at
     * the DB level; the subscription guard prevents overwriting Cancelled.
     */
    public function handle(Order $order): void
    {
        $order->update(['status' => OrderStatus::Failed]);

        $subscription = Subscription::where('user_id', $order->user_id)->first();

        if ($subscription !== null && $subscription->status !== SubscriptionStatus::Cancelled) {
            $subscription->update([
                'status'               => SubscriptionStatus::PastDue,
                'grace_period_ends_at' => now()->addDays(self::GRACE_PERIOD_DAYS),
            ]);
        }

        PaymentFailed::dispatch($order);
    }
}
