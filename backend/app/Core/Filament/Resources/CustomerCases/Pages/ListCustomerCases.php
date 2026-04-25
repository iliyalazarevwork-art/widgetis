<?php

declare(strict_types=1);

namespace App\Core\Filament\Resources\CustomerCases\Pages;

use App\Core\Filament\Resources\CustomerCases\CustomerCaseResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListCustomerCases extends ListRecords
{
    protected static string $resource = CustomerCaseResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
