<?php

declare(strict_types=1);

namespace App\Filament\Resources\DemoSessions\Tables;

use App\Models\DemoSession;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Support\Carbon;

class DemoSessionsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('code')
                    ->searchable()
                    ->fontFamily('mono')
                    ->copyable()
                    ->copyableState(fn (DemoSession $record): string => rtrim((string) config('app.frontend_url', config('app.url')), '/')."/live-demo?code={$record->code}")
                    ->tooltip('Click to copy demo link'),
                TextColumn::make('domain')
                    ->searchable(),
                TextColumn::make('creator.name')
                    ->label('Created By'),
                TextColumn::make('view_count')
                    ->numeric(),
                TextColumn::make('expires_at')
                    ->dateTime()
                    ->color(fn (DemoSession $record): ?string => $record->expires_at && Carbon::parse($record->expires_at)->isPast() ? 'danger' : null),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable(),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
