<?php

declare(strict_types=1);

namespace App\Listeners\Billing;

use App\Events\Billing\SubscriptionExpired;
use App\Mail\Billing\SubscriptionExpiredMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class SendSubscriptionExpiredEmail implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(SubscriptionExpired $event): void
    {
        $email = $event->subscription->user?->email;

        if (empty($email)) {
            return;
        }

        Mail::to($email)->send(new SubscriptionExpiredMail($event->subscription));
    }
}
