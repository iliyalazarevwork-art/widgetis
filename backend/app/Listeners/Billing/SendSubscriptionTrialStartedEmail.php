<?php

declare(strict_types=1);

namespace App\Listeners\Billing;

use App\Events\Billing\SubscriptionTrialStarted;
use App\Mail\Billing\SubscriptionTrialStartedMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class SendSubscriptionTrialStartedEmail implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(SubscriptionTrialStarted $event): void
    {
        $email = $event->subscription->user?->email;

        if (empty($email)) {
            return;
        }

        Mail::to($email)->send(new SubscriptionTrialStartedMail($event->subscription));
    }
}
