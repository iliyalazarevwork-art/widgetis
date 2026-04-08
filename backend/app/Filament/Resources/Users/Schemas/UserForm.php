<?php

declare(strict_types=1);

namespace App\Filament\Resources\Users\Schemas;

use Filament\Schemas\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Personal')
                    ->schema([
                        TextInput::make('name')
                            ->required(),
                        TextInput::make('email')
                            ->email()
                            ->required(),
                        TextInput::make('phone')
                            ->tel(),
                        TextInput::make('company'),
                        TextInput::make('telegram'),
                    ]),
                Section::make('Auth')
                    ->schema([
                        TextInput::make('password')
                            ->password()
                            ->dehydrated(fn (?string $state): bool => filled($state))
                            ->required(fn (string $operation): bool => $operation === 'create'),
                        Toggle::make('two_factor_enabled'),
                        Toggle::make('notification_enabled'),
                    ]),
                Section::make('Settings')
                    ->schema([
                        Select::make('locale')
                            ->options([
                                'uk' => 'Українська',
                                'en' => 'English',
                            ])
                            ->required()
                            ->default('uk'),
                        TextInput::make('timezone')
                            ->required()
                            ->default('Europe/Kyiv'),
                    ]),
            ]);
    }
}
