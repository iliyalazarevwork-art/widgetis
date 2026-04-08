<?php

declare(strict_types=1);

namespace App\Filament\Resources\FaqItems\Pages;

use App\Filament\Resources\FaqItems\FaqItemResource;
use Filament\Resources\Pages\CreateRecord;

class CreateFaqItem extends CreateRecord
{
    protected static string $resource = FaqItemResource::class;
}
