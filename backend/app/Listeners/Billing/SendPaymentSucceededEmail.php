<?php

declare(strict_types=1);

namespace App\Listeners\Billing;

use App\Events\Billing\PaymentSucceeded;
use App\Mail\Billing\PaymentSucceededMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

class SendPaymentSucceededEmail implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(PaymentSucceeded $event): void
    {
        $order = $event->order ?? $event->payment->order;
        $email = null;

        if ($order !== null && $order->user !== null) {
            $email = $order->user->email;
        } elseif ($event->payment->user !== null) {
            $email = $event->payment->user->email;
        }

        if (empty($email)) {
            return;
        }

        Mail::to($email)->send(new PaymentSucceededMail($event->payment, $event->order));
    }
}
