<?php

declare(strict_types=1);

namespace App\Listeners\Billing;

use App\Events\Billing\SubscriptionActivated;
use App\Listeners\SendEmailListener;
use App\Mail\Billing\SubscriptionActivatedMail;
use Illuminate\Mail\Mailable;

final class SendSubscriptionActivatedEmail extends SendEmailListener
{
    protected function resolveEmail(object $event): ?string
    {
        assert($event instanceof SubscriptionActivated);

        return $event->subscription->user?->email;
    }

    protected function buildMailable(object $event): Mailable
    {
        assert($event instanceof SubscriptionActivated);

        return new SubscriptionActivatedMail($event->subscription);
    }
}
