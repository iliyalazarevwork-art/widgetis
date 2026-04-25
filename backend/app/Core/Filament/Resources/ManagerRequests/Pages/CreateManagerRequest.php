<?php

declare(strict_types=1);

namespace App\Core\Filament\Resources\ManagerRequests\Pages;

use App\Core\Filament\Resources\ManagerRequests\ManagerRequestResource;
use Filament\Resources\Pages\CreateRecord;

class CreateManagerRequest extends CreateRecord
{
    protected static string $resource = ManagerRequestResource::class;
}
