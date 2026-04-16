<?php

declare(strict_types=1);

namespace App\Listeners\Billing;

use App\Events\Billing\SubscriptionUpgraded;
use App\Listeners\SendEmailListener;
use App\Mail\Billing\SubscriptionUpgradedMail;
use Illuminate\Mail\Mailable;

final class SendSubscriptionUpgradedEmail extends SendEmailListener
{
    protected function resolveEmail(object $event): ?string
    {
        assert($event instanceof SubscriptionUpgraded);

        return $event->subscription->user?->email;
    }

    protected function buildMailable(object $event): Mailable
    {
        assert($event instanceof SubscriptionUpgraded);

        return new SubscriptionUpgradedMail($event->subscription, $event->oldPlan);
    }
}
