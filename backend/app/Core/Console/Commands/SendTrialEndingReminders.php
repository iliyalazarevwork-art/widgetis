<?php

declare(strict_types=1);

namespace App\Core\Console\Commands;

use App\Core\Models\Subscription;
use App\Core\Services\Notification\NotificationService;
use App\Enums\NotificationType;
use App\Enums\SubscriptionStatus;
use Illuminate\Console\Command;

class SendTrialEndingReminders extends Command
{
    protected $signature = 'notifications:trial-ending';
    protected $description = 'Send notifications to users whose trial ends in 3 or 1 days';

    public function handle(NotificationService $notificationService): int
    {
        $count = 0;

        foreach ([3, 1] as $daysLeft) {
            $subscriptions = Subscription::with('user', 'plan')
                ->where('status', SubscriptionStatus::Trial)
                ->whereDate('trial_ends_at', now()->addDays($daysLeft)->toDateString())
                ->get();

            foreach ($subscriptions as $sub) {
                $price = $sub->plan->price_monthly;
                $planName = $sub->plan->slug;

                $notificationService->create(
                    $sub->user,
                    NotificationType::TrialWarning,
                    [
                        'en' => "Trial ending in {$daysLeft} day(s)",
                        'uk' => "Trial закінчується через {$daysLeft} " . ($daysLeft === 1 ? 'день' : 'дні'),
                    ],
                    [
                        'en' => "After trial, {$price} UAH will be charged for {$planName}.",
                        'uk' => "Після trial буде списано {$price} грн за {$planName}.",
                    ],
                    ['subscription_id' => $sub->id, 'days_left' => $daysLeft],
                );

                $count++;
            }
        }

        $this->info("Sent {$count} trial ending reminders.");

        return self::SUCCESS;
    }
}
