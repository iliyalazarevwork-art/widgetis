<?php

declare(strict_types=1);

namespace App\Core\Filament\Resources\Products\Pages;

use App\Core\Filament\Resources\Products\ProductResource;
use Filament\Resources\Pages\CreateRecord;

class CreateProduct extends CreateRecord
{
    protected static string $resource = ProductResource::class;
}
