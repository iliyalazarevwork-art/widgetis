<?php

declare(strict_types=1);

namespace App\Listeners\Billing;

use App\Events\Billing\SubscriptionCancelled;
use App\Listeners\SendEmailListener;
use App\Mail\Billing\SubscriptionCancelledMail;
use Illuminate\Mail\Mailable;

final class SendSubscriptionCancelledEmail extends SendEmailListener
{
    protected function resolveEmail(object $event): ?string
    {
        assert($event instanceof SubscriptionCancelled);

        return $event->subscription->user?->email;
    }

    protected function buildMailable(object $event): Mailable
    {
        assert($event instanceof SubscriptionCancelled);

        return new SubscriptionCancelledMail($event->subscription, $event->reason);
    }
}
