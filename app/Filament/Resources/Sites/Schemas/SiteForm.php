<?php

declare(strict_types=1);

namespace App\Filament\Resources\Sites\Schemas;

use App\Enums\Platform;
use App\Enums\SiteStatus;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class SiteForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('user_id')
                    ->relationship('user', 'name')
                    ->searchable()
                    ->required(),
                TextInput::make('name'),
                TextInput::make('domain')
                    ->required(),
                TextInput::make('url')
                    ->url()
                    ->required(),
                Select::make('platform')
                    ->options(Platform::class)
                    ->required()
                    ->default('horoshop'),
                Select::make('status')
                    ->options(SiteStatus::class)
                    ->default('pending')
                    ->required(),
            ]);
    }
}
