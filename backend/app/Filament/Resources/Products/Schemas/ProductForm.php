<?php

declare(strict_types=1);

namespace App\Filament\Resources\Products\Schemas;

use App\Enums\Platform;
use App\Enums\ProductStatus;
use Filament\Forms\Components\KeyValue;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class ProductForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('slug')
                    ->required()
                    ->unique(ignoreRecord: true),
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
                            ->label('Description (UK)')
                            ->required(),
                        Textarea::make('description.en')
                            ->label('Description (EN)')
                            ->required(),
                    ]),
                TextInput::make('icon')
                    ->label('Icon URL')
                    ->required(),
                Select::make('tag_slug')
                    ->relationship('tag', 'slug')
                    ->label('Tag'),
                Select::make('platform')
                    ->options(Platform::class)
                    ->required()
                    ->default('horoshop'),
                Select::make('status')
                    ->options(ProductStatus::class)
                    ->required()
                    ->default('active'),
                Toggle::make('is_popular'),
                Toggle::make('is_new'),
                KeyValue::make('config_schema'),
                TextInput::make('sort_order')
                    ->required()
                    ->numeric()
                    ->default(0),
            ]);
    }
}
