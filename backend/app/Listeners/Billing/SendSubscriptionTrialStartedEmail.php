<?php

declare(strict_types=1);

namespace App\Listeners\Billing;

use App\Events\Billing\SubscriptionTrialStarted;
use App\Listeners\SendEmailListener;
use App\Mail\Billing\SubscriptionTrialStartedMail;
use Illuminate\Mail\Mailable;

final class SendSubscriptionTrialStartedEmail extends SendEmailListener
{
    protected function resolveEmail(object $event): ?string
    {
        assert($event instanceof SubscriptionTrialStarted);

        return $event->subscription->user?->email;
    }

    protected function buildMailable(object $event): Mailable
    {
        assert($event instanceof SubscriptionTrialStarted);

        return new SubscriptionTrialStartedMail($event->subscription);
    }
}
