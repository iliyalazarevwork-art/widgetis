<?php

declare(strict_types=1);

namespace App\Filament\Resources\Sites\Tables;

use App\Enums\Platform;
use App\Enums\SiteStatus;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class SitesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->searchable(),
                TextColumn::make('domain')
                    ->searchable()
                    ->url(fn ($record) => $record->url, shouldOpenInNewTab: true),
                TextColumn::make('user.name')
                    ->label('Owner'),
                TextColumn::make('platform')
                    ->badge(),
                TextColumn::make('status')
                    ->badge(),
                IconColumn::make('script_installed')
                    ->boolean(),
                TextColumn::make('connected_at')
                    ->dateTime(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->options(SiteStatus::class),
                SelectFilter::make('platform')
                    ->options(Platform::class),
                TernaryFilter::make('script_installed'),
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
