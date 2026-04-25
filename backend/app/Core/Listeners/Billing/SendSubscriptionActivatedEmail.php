<?php

declare(strict_types=1);

namespace App\Core\Listeners\Billing;

use App\Core\Events\Billing\SubscriptionActivated;
use App\Core\Listeners\SendEmailListener;
use App\Core\Mail\Billing\SubscriptionActivatedMail;
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
