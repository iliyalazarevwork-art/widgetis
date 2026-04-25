<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Filament\Resources\Reviews\Pages;

use App\WidgetRuntime\Filament\Resources\Reviews\ReviewResource;
use Filament\Resources\Pages\CreateRecord;

class CreateReview extends CreateRecord
{
    protected static string $resource = ReviewResource::class;
}
