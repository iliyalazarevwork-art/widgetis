<?php

declare(strict_types=1);

namespace App\Core\Events\Billing;

use App\Core\Models\Order;
use App\Core\Models\Payment;
use Illuminate\Foundation\Events\Dispatchable;

class PaymentSucceeded
{
    use Dispatchable;

    public function __construct(
        public readonly Payment $payment,
        public readonly ?Order $order = null,
    ) {
    }
}
