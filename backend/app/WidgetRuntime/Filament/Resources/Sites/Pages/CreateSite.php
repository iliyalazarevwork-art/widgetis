<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Filament\Resources\Sites\Pages;

use App\WidgetRuntime\Filament\Resources\Sites\SiteResource;
use Filament\Resources\Pages\CreateRecord;

class CreateSite extends CreateRecord
{
    protected static string $resource = SiteResource::class;
}
