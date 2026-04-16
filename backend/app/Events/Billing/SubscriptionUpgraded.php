<?php

declare(strict_types=1);

namespace App\Events\Billing;

use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Foundation\Events\Dispatchable;

class SubscriptionUpgraded
{
    use Dispatchable;

    public function __construct(
        public readonly Subscription $subscription,
        public readonly ?Plan $oldPlan = null,
    ) {
    }
}
