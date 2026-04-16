<?php

declare(strict_types=1);

namespace App\Services\Billing\Contracts;

use App\Services\Billing\Commands\ChargeCommand;
use App\Services\Billing\Results\ChargeResult;

interface SupportsMerchantCharge
{
    public function chargeSavedInstrument(ChargeCommand $command): ChargeResult;
}
