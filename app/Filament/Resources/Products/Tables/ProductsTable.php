<?php

declare(strict_types=1);

namespace App\Filament\Resources\Products\Tables;

use App\Enums\Platform;
use App\Enums\ProductStatus;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class ProductsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('icon')
                    ->circular(),
                TextColumn::make('slug')
                    ->searchable(),
                TextColumn::make('name')
                    ->formatStateUsing(fn ($state) => is_array($state) ? ($state['uk'] ?? $state['en'] ?? '') : $state)
                    ->searchable(),
                TextColumn::make('tag_slug')
                    ->label('Tag')
                    ->badge(),
                TextColumn::make('platform')
                    ->badge(),
                TextColumn::make('status')
                    ->badge(),
                IconColumn::make('is_popular')
                    ->boolean(),
                IconColumn::make('is_new')
                    ->boolean(),
                TextColumn::make('sort_order')
                    ->numeric()
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->options(ProductStatus::class),
                SelectFilter::make('platform')
                    ->options(Platform::class),
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
