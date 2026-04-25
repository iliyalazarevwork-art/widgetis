<?php

declare(strict_types=1);

namespace App\Core\Filament\Resources\CustomerCases\Pages;

use App\Core\Filament\Resources\CustomerCases\CustomerCaseResource;
use Filament\Resources\Pages\CreateRecord;

class CreateCustomerCase extends CreateRecord
{
    protected static string $resource = CustomerCaseResource::class;
}
