<?php

declare(strict_types=1);

namespace App\Core\Console\Commands;

use App\Core\Models\Subscription;
use App\Core\Services\Billing\SubscriptionService;
use App\Enums\SubscriptionStatus;
use Illuminate\Console\Command;

class ExpireTrials extends Command
{
    protected $signature = 'subscriptions:expire-trials';
    protected $description = 'Expire trial subscriptions that have passed their trial end date';

    public function handle(SubscriptionService $subscriptionService): int
    {
        $expired = Subscription::with('user')
            ->where('status', SubscriptionStatus::Trial)
            ->where('trial_ends_at', '<', now())
            ->get();

        $count = 0;
        foreach ($expired as $subscription) {
            $subscriptionService->downgradeToFree($subscription->user);
            $count++;
        }

        $this->info("Downgraded {$count} expired trial subscriptions to Free plan.");

        return self::SUCCESS;
    }
}
