<?php

declare(strict_types=1);

namespace App\Core\Listeners\Billing;

use App\Core\Events\Billing\SubscriptionCancelled;
use App\Core\Listeners\SendEmailListener;
use App\Core\Mail\Billing\SubscriptionCancelledMail;
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
