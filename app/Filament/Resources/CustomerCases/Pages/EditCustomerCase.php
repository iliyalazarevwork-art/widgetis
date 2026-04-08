<?php

declare(strict_types=1);

namespace App\Filament\Resources\CustomerCases\Pages;

use App\Filament\Resources\CustomerCases\CustomerCaseResource;
use Filament\Actions\DeleteAction;
use Filament\Actions\ForceDeleteAction;
use Filament\Actions\RestoreAction;
use Filament\Resources\Pages\EditRecord;

class EditCustomerCase extends EditRecord
{
    protected static string $resource = CustomerCaseResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
            ForceDeleteAction::make(),
            RestoreAction::make(),
        ];
    }
}
