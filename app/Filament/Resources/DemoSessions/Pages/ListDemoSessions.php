<?php

declare(strict_types=1);

namespace App\Filament\Resources\DemoSessions\Pages;

use App\Filament\Resources\DemoSessions\DemoSessionResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListDemoSessions extends ListRecords
{
    protected static string $resource = DemoSessionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
