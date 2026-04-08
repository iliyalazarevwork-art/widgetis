<?php

declare(strict_types=1);

namespace App\Filament\Resources\CustomerCases\Schemas;

use App\Enums\Platform;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class CustomerCaseForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('store')
                    ->required(),
                TextInput::make('store_url')
                    ->url()
                    ->required(),
                TextInput::make('store_logo_url')
                    ->url(),
                TextInput::make('owner'),
                Select::make('platform')
                    ->options(Platform::class)
                    ->required(),
                Textarea::make('description.uk')
                    ->label('Description (UK)')
                    ->columnSpanFull(),
                Textarea::make('description.en')
                    ->label('Description (EN)')
                    ->columnSpanFull(),
                Textarea::make('review_text')
                    ->columnSpanFull(),
                TextInput::make('review_rating')
                    ->numeric()
                    ->minValue(1)
                    ->maxValue(5),
                Toggle::make('is_published'),
                TextInput::make('sort_order')
                    ->required()
                    ->numeric()
                    ->default(0),
            ]);
    }
}
