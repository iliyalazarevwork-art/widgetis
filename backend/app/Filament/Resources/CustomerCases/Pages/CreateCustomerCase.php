<?php

declare(strict_types=1);

namespace App\Filament\Resources\CustomerCases\Pages;

use App\Filament\Resources\CustomerCases\CustomerCaseResource;
use Filament\Resources\Pages\CreateRecord;

class CreateCustomerCase extends CreateRecord
{
    protected static string $resource = CustomerCaseResource::class;
}
