<?php

declare(strict_types=1);

namespace App\Core\Listeners\Billing;

use App\Core\Events\Billing\SubscriptionTrialStarted;
use App\Core\Listeners\SendEmailListener;
use App\Core\Mail\Billing\SubscriptionTrialStartedMail;
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
