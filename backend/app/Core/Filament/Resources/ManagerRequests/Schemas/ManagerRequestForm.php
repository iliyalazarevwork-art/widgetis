<?php

declare(strict_types=1);

namespace App\Core\Filament\Resources\ManagerRequests\Schemas;

use App\Enums\LeadStatus;
use App\Enums\ManagerRequestType;
use App\Enums\Messenger;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class ManagerRequestForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('user_id')
                    ->relationship('user', 'name')
                    ->searchable(),
                Select::make('site_id')
                    ->relationship('site', 'domain')
                    ->searchable(),
                Select::make('type')
                    ->options(ManagerRequestType::class)
                    ->required()
                    ->default(ManagerRequestType::InstallHelp),
                Select::make('messenger')
                    ->options(Messenger::class),
                TextInput::make('email')
                    ->email(),
                TextInput::make('phone')
                    ->tel(),
                TagsInput::make('widgets'),
                Textarea::make('message')
                    ->columnSpanFull(),
                Select::make('status')
                    ->options(LeadStatus::class)
                    ->required()
                    ->default(LeadStatus::New),
                Textarea::make('notes')
                    ->columnSpanFull(),
            ]);
    }
}
