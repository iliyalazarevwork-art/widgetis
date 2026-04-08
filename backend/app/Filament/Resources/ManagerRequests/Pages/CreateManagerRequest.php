<?php

declare(strict_types=1);

namespace App\Filament\Resources\ManagerRequests\Pages;

use App\Filament\Resources\ManagerRequests\ManagerRequestResource;
use Filament\Resources\Pages\CreateRecord;

class CreateManagerRequest extends CreateRecord
{
    protected static string $resource = ManagerRequestResource::class;
}
