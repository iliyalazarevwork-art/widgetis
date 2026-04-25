<?php

declare(strict_types=1);

namespace App\Core\Filament\Resources\Plans\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\ToggleColumn;
use Filament\Tables\Table;

class PlansTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('slug')
                    ->searchable(),
                TextColumn::make('name')
                    ->formatStateUsing(fn ($state) => is_array($state) ? ($state['uk'] ?? $state['en'] ?? '') : $state)
                    ->searchable(),
                TextColumn::make('price_monthly')
                    ->money('UAH'),
                TextColumn::make('price_yearly')
                    ->money('UAH'),
                TextColumn::make('max_sites')
                    ->numeric(),
                TextColumn::make('max_widgets')
                    ->numeric(),
                IconColumn::make('is_recommended')
                    ->boolean(),
                ToggleColumn::make('is_active'),
                TextColumn::make('sort_order')
                    ->numeric()
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
