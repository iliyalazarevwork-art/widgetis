<?php

declare(strict_types=1);

namespace App\Listeners\Billing;

use App\Events\Billing\SubscriptionCancelled;
use App\Mail\Billing\SubscriptionCancelledMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class SendSubscriptionCancelledEmail implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(SubscriptionCancelled $event): void
    {
        $email = $event->subscription->user?->email;

        if (empty($email)) {
            return;
        }

        Mail::to($email)->send(new SubscriptionCancelledMail($event->subscription, $event->reason));
    }
}
