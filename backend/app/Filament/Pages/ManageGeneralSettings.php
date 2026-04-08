<?php

declare(strict_types=1);

namespace App\Filament\Pages;

use App\Settings\GeneralSettings;
use Filament\Forms\Components\KeyValue;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Pages\SettingsPage;
use Filament\Support\Icons\Heroicon;

class ManageGeneralSettings extends SettingsPage
{
    protected static string $settings = GeneralSettings::class;

    protected static string|\BackedEnum|null $navigationIcon = Heroicon::OutlinedCog6Tooth;

    protected static string|\UnitEnum|null $navigationGroup = 'Settings';

    protected static ?int $navigationSort = 99;

    public function form(\Filament\Schemas\Schema $schema): \Filament\Schemas\Schema
    {
        return $schema
            ->components([
                Section::make('Contact Information')
                    ->schema([
                        TextInput::make('phone')
                            ->required()
                            ->tel(),
                        TextInput::make('email')
                            ->required()
                            ->email(),
                        TextInput::make('business_hours'),
                    ])
                    ->columns(2),

                Section::make('Social Links')
                    ->schema([
                        KeyValue::make('socials')
                            ->keyLabel('Platform')
                            ->valueLabel('URL'),
                    ]),

                Section::make('Messengers')
                    ->schema([
                        KeyValue::make('messengers')
                            ->keyLabel('Messenger')
                            ->valueLabel('Link / Username'),
                    ]),

                Section::make('Stats Display')
                    ->schema([
                        KeyValue::make('stats')
                            ->keyLabel('Metric')
                            ->valueLabel('Value'),
                    ]),
            ]);
    }
}
