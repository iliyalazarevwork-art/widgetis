<?php

declare(strict_types=1);

namespace App\Listeners\Billing;

use App\Events\Billing\SubscriptionExpired;
use App\Listeners\SendEmailListener;
use App\Mail\Billing\SubscriptionExpiredMail;
use Illuminate\Mail\Mailable;

final class SendSubscriptionExpiredEmail extends SendEmailListener
{
    protected function resolveEmail(object $event): ?string
    {
        assert($event instanceof SubscriptionExpired);

        return $event->subscription->user?->email;
    }

    protected function buildMailable(object $event): Mailable
    {
        assert($event instanceof SubscriptionExpired);

        return new SubscriptionExpiredMail($event->subscription);
    }
}
