<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Filament\Resources\DemoSessions\Schemas;

use App\WidgetRuntime\Models\DemoSession;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\KeyValue;
use Filament\Forms\Components\Placeholder;
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
                    ->default(fn (): string => DemoSession::generateCode())
                    ->disabled(fn (string $operation): bool => $operation === 'edit')
                    ->dehydrated(),
                TextInput::make('domain')
                    ->required()
                    ->placeholder('mystore.horoshop.ua'),
                KeyValue::make('config')
                    ->label('Config (JSON)'),
                Select::make('created_by')
                    ->relationship('creator', 'name')
                    ->searchable()
                    ->default(fn (): ?int => auth()->id()),
                DateTimePicker::make('expires_at')
                    ->required()
                    ->default(fn (): string => now()->addHours(72)->toDateTimeString()),
                TextInput::make('view_count')
                    ->numeric()
                    ->disabled()
                    ->default(0)
                    ->dehydrated(false)
                    ->visibleOn('edit'),
                Placeholder::make('demo_link')
                    ->label('Demo Link')
                    ->visibleOn('edit')
                    ->content(function (?DemoSession $record): string {
                        if ($record === null) {
                            return '';
                        }

                        $frontendUrl = rtrim((string) config('app.frontend_url', config('app.url')), '/');

                        return "{$frontendUrl}/live-demo?code={$record->code}";
                    }),
            ]);
    }
}
