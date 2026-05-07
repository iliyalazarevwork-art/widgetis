<?php

declare(strict_types=1);

namespace App\Core\Console\Commands;

use App\Core\Models\Subscription;
use App\Core\Services\Billing\SubscriptionService;
use App\Enums\SubscriptionStatus;
use Illuminate\Console\Command;

/**
 * Downgrade cancelled paid subscriptions to Free after current_period_end.
 *
 * When a user cancels their Pro/Max subscription mid-period, they keep access
 * until current_period_end (access is granted by status=Cancelled + future
 * period end). This command runs at period-end and calls downgradeToFree so
 * the user lands on Free instead of "Expired".
 */
final class DowngradeCancelledSubscriptions extends Command
{
    protected $signature = 'subscriptions:downgrade-cancelled';
    protected $description = 'Downgrade cancelled subscriptions to Free after their billing period ends';

    public function handle(SubscriptionService $subscriptionService): int
    {
        $expired = Subscription::with('user')
            ->where('status', SubscriptionStatus::Cancelled)
            ->where('current_period_end', '<', now())
            ->get();

        $count = 0;
        foreach ($expired as $subscription) {
            if ($subscription->user === null) {
                continue;
            }

            $subscriptionService->downgradeToFree($subscription->user);
            $count++;
        }

        $this->info("Downgraded {$count} cancelled subscription(s) to Free plan.");

        return self::SUCCESS;
    }
}
