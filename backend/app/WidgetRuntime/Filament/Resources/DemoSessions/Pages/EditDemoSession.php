<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Filament\Resources\DemoSessions\Pages;

use App\WidgetRuntime\Filament\Resources\DemoSessions\DemoSessionResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditDemoSession extends EditRecord
{
    protected static string $resource = DemoSessionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
