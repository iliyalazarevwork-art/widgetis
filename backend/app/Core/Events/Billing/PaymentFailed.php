<?php

declare(strict_types=1);

namespace App\Core\Events\Billing;

use App\Core\Models\Order;
use Illuminate\Foundation\Events\Dispatchable;

class PaymentFailed
{
    use Dispatchable;

    public function __construct(
        public readonly Order $order,
    ) {
    }
}
