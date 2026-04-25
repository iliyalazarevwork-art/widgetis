<?php

declare(strict_types=1);

namespace App\Core\Listeners\Billing;

use App\Core\Events\Billing\SubscriptionRenewed;
use App\Core\Listeners\SendEmailListener;
use App\Core\Mail\Billing\SubscriptionRenewedMail;
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
