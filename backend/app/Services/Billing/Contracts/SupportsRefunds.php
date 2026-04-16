<?php

declare(strict_types=1);

namespace App\Services\Billing\Contracts;

use App\Services\Billing\Commands\RefundCommand;
use App\Services\Billing\Results\RefundResult;

interface SupportsRefunds
{
    public function refund(RefundCommand $command): RefundResult;
}
