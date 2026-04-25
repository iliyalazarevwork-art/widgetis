<?php

declare(strict_types=1);

namespace App\Core\Filament\Resources\Consultations\Pages;

use App\Core\Filament\Resources\Consultations\ConsultationResource;
use Filament\Resources\Pages\CreateRecord;

class CreateConsultation extends CreateRecord
{
    protected static string $resource = ConsultationResource::class;
}
