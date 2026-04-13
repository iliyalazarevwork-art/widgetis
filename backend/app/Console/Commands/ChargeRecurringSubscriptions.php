<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\PaymentProvider;
use App\Enums\SubscriptionStatus;
use App\Models\Subscription;
use App\Services\Billing\PaymentProviderRegistry;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Charges renewals for subscriptions whose current period is about to end.
 *
 * Only providers that expose merchant-initiated charging are invoked here:
 * LiqPay schedules recurring billing on its own and reports back via
 * webhook, so we explicitly skip it by checking provider.name().
 *
 * Failure handling: bump payment_retry_count and schedule next_payment_retry_at.
 * After three attempts we drop into a 3-day grace period; ProcessGracePeriod
 * then finalises the expire transition.
 */
class ChargeRecurringSubscriptions extends Command
{
    protected $signature = 'subscriptions:charge-recurring {--provider= : Limit to a single provider (liqpay|monobank)}';
    protected $description = 'Charge renewals for active subscriptions whose current period ends within 24h';

    private const MAX_RETRY_COUNT = 3;

    /**
     * Cooldown window after a successful dispatch — prevents the next
     * cron run from re-selecting a subscription whose webhook hasn't
     * yet advanced current_period_end. Must comfortably exceed Monobank's
     * maximum webhook retry window (≤24h).
     */
    private const DISPATCH_COOLDOWN_HOURS = 26;

    public function handle(PaymentProviderRegistry $registry): int
    {
        $query = Subscription::query()
            ->whereIn('status', [SubscriptionStatus::Active, SubscriptionStatus::PastDue])
            ->whereNotNull('payment_provider')
            ->where('current_period_end', '<=', now()->addDay())
            ->where(function ($q): void {
                $q->whereNull('next_payment_retry_at')
                    ->orWhere('next_payment_retry_at', '<=', now());
            });

        if (is_string($this->option('provider')) && $this->option('provider') !== '') {
            $query->where('payment_provider', $this->option('provider'));
        }

        $subscriptions = $query->get();
        $processed = 0;
        $skipped = 0;

        foreach ($subscriptions as $subscription) {
            $provider = $registry->for($subscription);

            // LiqPay self-schedules — do not double-charge.
            if ($provider->name() === PaymentProvider::LiqPay) {
                $skipped++;
                continue;
            }

            $result = $provider->chargeRecurring($subscription);

            if ($result->success) {
                // Monobank dispatch was accepted; the actual success (and
                // period rollover) lands through handleWebhook. Park the
                // subscription in a cooldown window so the NEXT cron run
                // cannot re-select it before the webhook advances
                // current_period_end — otherwise a delayed webhook causes
                // a guaranteed double-charge.
                $subscription->update([
                    'payment_retry_count' => 0,
                    'next_payment_retry_at' => now()->addHours(self::DISPATCH_COOLDOWN_HOURS),
                ]);

                Log::channel('payments')->info('recurring.charge.dispatched', [
                    'subscription_id' => $subscription->id,
                    'provider' => $provider->name()->value,
                    'transaction_id' => $result->transactionId,
                    'cooldown_until' => now()->addHours(self::DISPATCH_COOLDOWN_HOURS)->toIso8601String(),
                ]);

                $processed++;
                continue;
            }

            $retryCount = $subscription->payment_retry_count + 1;
            $updates = [
                'payment_retry_count' => $retryCount,
                'next_payment_retry_at' => now()->addDay(),
            ];

            if ($retryCount >= self::MAX_RETRY_COUNT) {
                $updates['status'] = SubscriptionStatus::PastDue;
                $updates['grace_period_ends_at'] = now()->addDays(3);
                $updates['next_payment_retry_at'] = null;
            }

            $subscription->update($updates);

            Log::channel('payments')->warning('recurring.charge.failed', [
                'subscription_id' => $subscription->id,
                'provider' => $provider->name()->value,
                'retry_count' => $retryCount,
                'failure_code' => $result->failureCode,
                'failure_message' => $result->failureMessage,
            ]);
        }

        $this->info("Processed {$processed} subscription(s). Skipped {$skipped} (self-scheduled provider).");

        return self::SUCCESS;
    }
}
