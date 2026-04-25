<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Filament\Resources\Reviews\Schemas;

use App\Enums\ReviewStatus;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class ReviewForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('site_id')
                    ->relationship('site', 'name')
                    ->searchable()
                    ->nullable(),
                TextInput::make('external_product_id')
                    ->label('Product ID')
                    ->maxLength(64),
                TextInput::make('visitor_name')
                    ->label('Visitor Name')
                    ->maxLength(120),
                TextInput::make('visitor_email')
                    ->label('Visitor Email')
                    ->email()
                    ->maxLength(180),
                Select::make('user_id')
                    ->relationship('user', 'name')
                    ->searchable()
                    ->nullable(),
                TextInput::make('rating')
                    ->numeric()
                    ->minValue(1)
                    ->maxValue(5),
                TextInput::make('title'),
                Textarea::make('body')
                    ->columnSpanFull(),
                Select::make('status')
                    ->options(ReviewStatus::class)
                    ->required()
                    ->default(ReviewStatus::Pending),

                // Read-only media display: shows each uploaded URL with its type.
                Repeater::make('media')
                    ->label('Media Files')
                    ->schema([
                        TextInput::make('type')
                            ->label('Type')
                            ->disabled(),
                        TextInput::make('url')
                            ->label('URL')
                            ->disabled()
                            ->columnSpan(2),
                        TextInput::make('mime_type')
                            ->label('MIME')
                            ->disabled(),
                    ])
                    ->columns(4)
                    ->disabled()
                    ->columnSpanFull()
                    ->addable(false)
                    ->deletable(false)
                    ->reorderable(false),
            ]);
    }
}
