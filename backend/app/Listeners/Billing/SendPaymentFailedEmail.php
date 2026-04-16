<?php

declare(strict_types=1);

namespace App\Listeners\Billing;

use App\Events\Billing\PaymentFailed;
use App\Mail\Billing\PaymentFailedMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class SendPaymentFailedEmail implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(PaymentFailed $event): void
    {
        $email = $event->order->user?->email;

        if (empty($email)) {
            return;
        }

        Mail::to($email)->send(new PaymentFailedMail($event->order));
    }
}
