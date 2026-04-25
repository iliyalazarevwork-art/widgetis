<?php

declare(strict_types=1);

namespace App\Core\Services\Billing\Contracts;

use App\Core\Services\Billing\Commands\ChangePlanCommand;
use App\Core\Services\Billing\Results\ChangePlanResult;

interface SupportsPlanChange
{
    public function changePlan(ChangePlanCommand $command): ChangePlanResult;
}
