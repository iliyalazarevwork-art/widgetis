<?php

declare(strict_types=1);

namespace App\Listeners\Billing;

use App\Events\Billing\SubscriptionActivated;
use App\Mail\Billing\SubscriptionActivatedMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class SendSubscriptionActivatedEmail implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(SubscriptionActivated $event): void
    {
        $email = $event->subscription->user?->email;

        if (empty($email)) {
            return;
        }

        Mail::to($email)->send(new SubscriptionActivatedMail($event->subscription));
    }
}
