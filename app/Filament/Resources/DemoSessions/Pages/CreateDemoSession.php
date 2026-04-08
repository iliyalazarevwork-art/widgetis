<?php

declare(strict_types=1);

namespace App\Filament\Resources\DemoSessions\Pages;

use App\Filament\Resources\DemoSessions\DemoSessionResource;
use Filament\Resources\Pages\CreateRecord;

class CreateDemoSession extends CreateRecord
{
    protected static string $resource = DemoSessionResource::class;
}
