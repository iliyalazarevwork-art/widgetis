<?php

declare(strict_types=1);

namespace App\Listeners\Billing;

use App\Events\Billing\SubscriptionRenewed;
use App\Listeners\SendEmailListener;
use App\Mail\Billing\SubscriptionRenewedMail;
use Illuminate\Mail\Mailable;

final class SendSubscriptionRenewedEmail extends SendEmailListener
{
    protected function resolveEmail(object $event): ?string
    {
        assert($event instanceof SubscriptionRenewed);

        return $event->subscription->user?->email;
    }

    protected function buildMailable(object $event): Mailable
    {
        assert($event instanceof SubscriptionRenewed);

        return new SubscriptionRenewedMail($event->subscription);
    }
}
