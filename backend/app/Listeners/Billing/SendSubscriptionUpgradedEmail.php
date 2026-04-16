<?php

declare(strict_types=1);

namespace App\Listeners\Billing;

use App\Events\Billing\SubscriptionUpgraded;
use App\Mail\Billing\SubscriptionUpgradedMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class SendSubscriptionUpgradedEmail implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(SubscriptionUpgraded $event): void
    {
        $email = $event->subscription->user?->email;

        if (empty($email)) {
            return;
        }

        Mail::to($email)->send(new SubscriptionUpgradedMail($event->subscription, $event->oldPlan));
    }
}
