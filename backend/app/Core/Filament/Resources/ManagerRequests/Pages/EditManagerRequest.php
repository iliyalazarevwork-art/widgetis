<?php

declare(strict_types=1);

namespace App\Core\Filament\Resources\ManagerRequests\Pages;

use App\Core\Filament\Resources\ManagerRequests\ManagerRequestResource;
use Filament\Actions\DeleteAction;
use Filament\Actions\ForceDeleteAction;
use Filament\Actions\RestoreAction;
use Filament\Resources\Pages\EditRecord;

class EditManagerRequest extends EditRecord
{
    protected static string $resource = ManagerRequestResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
            ForceDeleteAction::make(),
            RestoreAction::make(),
        ];
    }
}
