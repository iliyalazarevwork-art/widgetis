<?php

declare(strict_types=1);

namespace App\Core\Filament\Resources\Plans\Schemas;

use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class PlanForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('slug')
                    ->required()
                    ->unique(ignoreRecord: true)
                    ->disabled(fn (string $operation): bool => $operation === 'edit'),
                Section::make('Name')
                    ->schema([
                        TextInput::make('name.uk')
                            ->label('Name (UK)')
                            ->required(),
                        TextInput::make('name.en')
                            ->label('Name (EN)')
                            ->required(),
                    ]),
                Section::make('Description')
                    ->schema([
                        Textarea::make('description.uk')
                            ->label('Description (UK)'),
                        Textarea::make('description.en')
                            ->label('Description (EN)'),
                    ]),
                Group::make([
                    TextInput::make('price_monthly')
                        ->required()
                        ->numeric()
                        ->prefix('₴')
                        ->default(0),
                    TextInput::make('price_yearly')
                        ->required()
                        ->numeric()
                        ->prefix('₴')
                        ->default(0),
                    TextInput::make('trial_days')
                        ->required()
                        ->numeric()
                        ->default(7)
                        ->minValue(0),
                ])->columns(3),
                Group::make([
                    TextInput::make('max_sites')
                        ->required()
                        ->numeric()
                        ->default(1),
                    TextInput::make('max_widgets')
                        ->required()
                        ->numeric()
                        ->default(2),
                ])->columns(2),
                Toggle::make('is_recommended'),
                Toggle::make('is_active')
                    ->default(true),
                TextInput::make('sort_order')
                    ->required()
                    ->numeric()
                    ->default(0),
            ]);
    }
}
