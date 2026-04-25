<?php

declare(strict_types=1);

namespace App\Core\Filament\Resources\Consultations\Pages;

use App\Core\Filament\Resources\Consultations\ConsultationResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditConsultation extends EditRecord
{
    protected static string $resource = ConsultationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
