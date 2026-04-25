<?php

declare(strict_types=1);

namespace App\Core\Services\Billing\Contracts;

use App\Core\Services\Billing\Commands\ChargeCommand;
use App\Core\Services\Billing\Results\ChargeResult;

interface SupportsMerchantCharge
{
    public function chargeSavedInstrument(ChargeCommand $command): ChargeResult;
}
