<?php

declare(strict_types=1);

namespace App\Listeners\Billing;

use App\Events\Billing\PaymentSucceeded;
use App\Listeners\SendEmailListener;
use App\Mail\Billing\PaymentSucceededMail;
use Illuminate\Mail\Mailable;

final class SendPaymentSucceededEmail extends SendEmailListener
{
    protected function resolveEmail(object $event): ?string
    {
        assert($event instanceof PaymentSucceeded);

        $order = $event->order ?? $event->payment->order;

        if ($order !== null && $order->user !== null) {
            return $order->user->email;
        }

        return $event->payment->user?->email;
    }

    protected function buildMailable(object $event): Mailable
    {
        assert($event instanceof PaymentSucceeded);

        return new PaymentSucceededMail($event->payment, $event->order);
    }
}
