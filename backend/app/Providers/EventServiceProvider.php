<?php

declare(strict_types=1);

namespace App\Providers;

use App\Events\Auth\UserRegistered;
use App\Events\Billing\PaymentFailed;
use App\Events\Billing\PaymentSucceeded;
use App\Events\Billing\SubscriptionActivated;
use App\Events\Billing\SubscriptionCancelled;
use App\Events\Billing\SubscriptionExpired;
use App\Events\Billing\SubscriptionRenewed;
use App\Events\Billing\SubscriptionTrialStarted;
use App\Events\Billing\SubscriptionUpgraded;
use App\Listeners\Auth\SendWelcomeEmail;
use App\Listeners\Billing\SendPaymentFailedEmail;
use App\Listeners\Billing\SendPaymentSucceededEmail;
use App\Listeners\Billing\SendSubscriptionActivatedEmail;
use App\Listeners\Billing\SendSubscriptionCancelledEmail;
use App\Listeners\Billing\SendSubscriptionExpiredEmail;
use App\Listeners\Billing\SendSubscriptionRenewedEmail;
use App\Listeners\Billing\SendSubscriptionTrialStartedEmail;
use App\Listeners\Billing\SendSubscriptionUpgradedEmail;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /** @var array<class-string, list<class-string>> */
    protected $listen = [
        UserRegistered::class => [
            SendWelcomeEmail::class,
        ],
        PaymentSucceeded::class => [
            SendPaymentSucceededEmail::class,
        ],
        PaymentFailed::class => [
            SendPaymentFailedEmail::class,
        ],
        SubscriptionActivated::class => [
            SendSubscriptionActivatedEmail::class,
        ],
        SubscriptionTrialStarted::class => [
            SendSubscriptionTrialStartedEmail::class,
        ],
        SubscriptionRenewed::class => [
            SendSubscriptionRenewedEmail::class,
        ],
        SubscriptionExpired::class => [
            SendSubscriptionExpiredEmail::class,
        ],
        SubscriptionCancelled::class => [
            SendSubscriptionCancelledEmail::class,
        ],
        SubscriptionUpgraded::class => [
            SendSubscriptionUpgradedEmail::class,
        ],
    ];
}
