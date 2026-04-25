<?php

declare(strict_types=1);

namespace App\Core\Filament\Resources\FaqItems\Schemas;

use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class FaqItemForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('category')
                    ->required(),
                TextInput::make('question.uk')
                    ->label('Question (UK)')
                    ->required(),
                TextInput::make('question.en')
                    ->label('Question (EN)')
                    ->required(),
                Textarea::make('answer.uk')
                    ->label('Answer (UK)')
                    ->required()
                    ->columnSpanFull(),
                Textarea::make('answer.en')
                    ->label('Answer (EN)')
                    ->required()
                    ->columnSpanFull(),
                Toggle::make('is_published'),
                TextInput::make('sort_order')
                    ->required()
                    ->numeric()
                    ->default(0),
            ]);
    }
}
