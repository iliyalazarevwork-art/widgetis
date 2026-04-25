<?php

declare(strict_types=1);

namespace App\Core\Filament\Resources\Consultations\Schemas;

use App\Enums\LeadStatus;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class ConsultationForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required(),
                TextInput::make('phone')
                    ->tel(),
                TextInput::make('email')
                    ->label('Email address')
                    ->email(),
                DateTimePicker::make('preferred_at'),
                Select::make('status')
                    ->options(LeadStatus::class)
                    ->required()
                    ->default(LeadStatus::New),
                Textarea::make('notes')
                    ->columnSpanFull(),
            ]);
    }
}
