<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\SubscriptionStatus;
use App\Models\Subscription;
use App\Services\Billing\SubscriptionService;
use Illuminate\Console\Command;

class ExpireTrials extends Command
{
    protected $signature = 'subscriptions:expire-trials';
    protected $description = 'Expire trial subscriptions that have passed their trial end date';

    public function handle(SubscriptionService $subscriptionService): int
    {
        $expired = Subscription::where('status', SubscriptionStatus::Trial)
            ->where('trial_ends_at', '<', now())
            ->get();

        $count = 0;
        foreach ($expired as $subscription) {
            $subscriptionService->expire($subscription);
            $count++;
        }

        $this->info("Expired {$count} trial subscriptions.");

        return self::SUCCESS;
    }
}
