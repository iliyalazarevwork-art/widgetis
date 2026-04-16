<?php

declare(strict_types=1);

namespace App\Services\Billing\Contracts;

use App\Services\Billing\Commands\ChangePlanCommand;
use App\Services\Billing\Results\ChangePlanResult;

interface SupportsPlanChange
{
    public function changePlan(ChangePlanCommand $command): ChangePlanResult;
}
