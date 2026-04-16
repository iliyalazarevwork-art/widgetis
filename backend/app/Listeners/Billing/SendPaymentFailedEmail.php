<?php

declare(strict_types=1);

namespace App\Listeners\Billing;

use App\Events\Billing\PaymentFailed;
use App\Listeners\SendEmailListener;
use App\Mail\Billing\PaymentFailedMail;
use Illuminate\Mail\Mailable;

final class SendPaymentFailedEmail extends SendEmailListener
{
    protected function resolveEmail(object $event): ?string
    {
        assert($event instanceof PaymentFailed);

        return $event->order->user?->email;
    }

    protected function buildMailable(object $event): Mailable
    {
        assert($event instanceof PaymentFailed);

        return new PaymentFailedMail($event->order);
    }
}
