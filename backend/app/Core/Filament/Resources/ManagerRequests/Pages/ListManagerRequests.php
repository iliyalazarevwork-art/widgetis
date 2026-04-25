<?php

declare(strict_types=1);

namespace App\Core\Filament\Resources\ManagerRequests\Pages;

use App\Core\Filament\Resources\ManagerRequests\ManagerRequestResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListManagerRequests extends ListRecords
{
    protected static string $resource = ManagerRequestResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
