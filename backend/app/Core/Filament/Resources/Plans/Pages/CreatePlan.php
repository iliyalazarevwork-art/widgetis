<?php

declare(strict_types=1);

namespace App\Core\Filament\Resources\Plans\Pages;

use App\Core\Filament\Resources\Plans\PlanResource;
use Filament\Resources\Pages\CreateRecord;

class CreatePlan extends CreateRecord
{
    protected static string $resource = PlanResource::class;
}
