<?php

declare(strict_types=1);

namespace App\Core\Console\Commands;

use App\Core\Models\Subscription;
use App\Core\Services\Billing\PaymentFailureHandler;
use App\Enums\SubscriptionStatus;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ExpireSubscriptions extends Command
{
    protected $signature = 'subscriptions:expire';
    protected $description = 'Move active subscriptions past their period end to PastDue with a 3-day grace period';

    public function handle(): int
    {
        $expired = Subscription::whereIn('status', [
            SubscriptionStatus::Active,
            SubscriptionStatus::Trial,
        ])
            ->where('current_period_end', '<', now())
            ->whereNull('grace_period_ends_at')
            ->get();

        $count = 0;
        foreach ($expired as $subscription) {
            $gracePeriodEnd = Carbon::parse($subscription->current_period_end)->addDays(PaymentFailureHandler::GRACE_PERIOD_DAYS);

            $subscription->update([
                'status' => SubscriptionStatus::PastDue,
                'grace_period_ends_at' => $gracePeriodEnd,
            ]);

            $count++;
        }

        $this->info("Moved {$count} subscriptions to PastDue with 3-day grace period.");

        return self::SUCCESS;
    }
}
