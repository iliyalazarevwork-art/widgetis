<?php

declare(strict_types=1);

namespace App\Filament\Resources\DemoSessions\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\KeyValue;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class DemoSessionForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('code')
                    ->required()
                    ->disabled(fn (string $operation): bool => $operation === 'edit'),
                TextInput::make('domain')
                    ->required(),
                KeyValue::make('config'),
                Select::make('created_by')
                    ->relationship('creator', 'name')
                    ->searchable(),
                TextInput::make('view_count')
                    ->numeric()
                    ->disabled()
                    ->default(0),
                DateTimePicker::make('expires_at')
                    ->required(),
            ]);
    }
}
