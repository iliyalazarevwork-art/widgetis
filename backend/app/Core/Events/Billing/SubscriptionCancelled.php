<?php

declare(strict_types=1);

namespace App\Core\Events\Billing;

use App\Core\Models\Subscription;
use Illuminate\Foundation\Events\Dispatchable;

class SubscriptionCancelled
{
    use Dispatchable;

    public function __construct(
        public readonly Subscription $subscription,
        public readonly ?string $reason = null,
    ) {
    }
}
