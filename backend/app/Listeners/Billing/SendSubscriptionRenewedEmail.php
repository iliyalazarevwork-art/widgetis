<?php

declare(strict_types=1);

namespace App\Listeners\Billing;

use App\Events\Billing\SubscriptionRenewed;
use App\Mail\Billing\SubscriptionRenewedMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class SendSubscriptionRenewedEmail implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(SubscriptionRenewed $event): void
    {
        $email = $event->subscription->user?->email;

        if (empty($email)) {
            return;
        }

        Mail::to($email)->send(new SubscriptionRenewedMail($event->subscription));
    }
}
