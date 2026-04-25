<?php

declare(strict_types=1);

namespace App\Providers;

use App\Core\Events\Auth\UserRegistered;
use App\Core\Events\Billing\PaymentFailed;
use App\Core\Events\Billing\PaymentSucceeded;
use App\Core\Events\Billing\SubscriptionActivated;
use App\Core\Events\Billing\SubscriptionCancelled;
use App\Core\Events\Billing\SubscriptionExpired;
use App\Core\Events\Billing\SubscriptionRenewed;
use App\Core\Events\Billing\SubscriptionTrialStarted;
use App\Core\Events\Billing\SubscriptionUpgraded;
use App\Core\Listeners\Auth\SendWelcomeEmail;
use App\Core\Listeners\Billing\SendPaymentFailedEmail;
use App\Core\Listeners\Billing\SendPaymentSucceededEmail;
use App\Core\Listeners\Billing\SendSubscriptionActivatedEmail;
use App\Core\Listeners\Billing\SendSubscriptionCancelledEmail;
use App\Core\Listeners\Billing\SendSubscriptionExpiredEmail;
use App\Core\Listeners\Billing\SendSubscriptionRenewedEmail;
use App\Core\Listeners\Billing\SendSubscriptionTrialStartedEmail;
use App\Core\Listeners\Billing\SendSubscriptionUpgradedEmail;
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
