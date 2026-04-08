<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\SubscriptionStatus;
use App\Models\Subscription;
use App\Services\Billing\SubscriptionService;
use Illuminate\Console\Command;

class ProcessGracePeriod extends Command
{
    protected $signature = 'subscriptions:process-grace-period';
    protected $description = 'Expire subscriptions that have exceeded their grace period';

    public function handle(SubscriptionService $subscriptionService): int
    {
        $expired = Subscription::where('status', SubscriptionStatus::PastDue)
            ->where('grace_period_ends_at', '<', now())
            ->get();

        $count = 0;
        foreach ($expired as $subscription) {
            $subscriptionService->expire($subscription);
            $count++;
        }

        $this->info("Expired {$count} grace period subscriptions.");

        return self::SUCCESS;
    }
}
