<?php

declare(strict_types=1);

namespace App\Core\Services\Billing\Contracts;

use App\Core\Services\Billing\Commands\RefundCommand;
use App\Core\Services\Billing\Results\RefundResult;

interface SupportsRefunds
{
    public function refund(RefundCommand $command): RefundResult;
}
