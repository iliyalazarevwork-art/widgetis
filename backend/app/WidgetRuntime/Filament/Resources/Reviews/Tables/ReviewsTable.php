<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Filament\Resources\Reviews\Tables;

use App\Enums\ReviewStatus;
use App\WidgetRuntime\Models\Review;
use App\WidgetRuntime\Models\Site;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class ReviewsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('site.name')
                    ->label('Site')
                    ->searchable()
                    ->sortable()
                    ->placeholder('—'),
                TextColumn::make('external_product_id')
                    ->label('Product ID')
                    ->searchable()
                    ->limit(20)
                    ->placeholder('—'),
                TextColumn::make('visitor_name')
                    ->label('Visitor')
                    ->searchable()
                    ->limit(30)
                    ->placeholder('—'),
                TextColumn::make('user.name')
                    ->label('Registered User')
                    ->searchable()
                    ->placeholder('—'),
                TextColumn::make('rating')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('title')
                    ->searchable()
                    ->limit(50)
                    ->placeholder('—'),
                TextColumn::make('status')
                    ->badge(),
                TextColumn::make('media_count')
                    ->label('Media')
                    ->state(fn (Review $record): string => count((array) $record->media) . ' file(s)')
                    ->badge()
                    ->color(fn (Review $record): string => count((array) $record->media) > 0 ? 'success' : 'gray'),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->options(ReviewStatus::class),
                SelectFilter::make('site_id')
                    ->label('Site')
                    ->options(fn (): array => Site::query()->pluck('name', 'id')->all())
                    ->searchable(),
                SelectFilter::make('rating')
                    ->options([
                        1 => '1',
                        2 => '2',
                        3 => '3',
                        4 => '4',
                        5 => '5',
                    ]),
            ])
            ->recordActions([
                Action::make('approve')
                    ->action(fn (Review $record) => $record->update(['status' => ReviewStatus::Approved]))
                    ->requiresConfirmation()
                    ->icon('heroicon-o-check')
                    ->color('success')
                    ->visible(fn (Review $record): bool => $record->status !== ReviewStatus::Approved),
                Action::make('reject')
                    ->action(fn (Review $record) => $record->update(['status' => ReviewStatus::Rejected]))
                    ->requiresConfirmation()
                    ->icon('heroicon-o-x-mark')
                    ->color('danger')
                    ->visible(fn (Review $record): bool => $record->status !== ReviewStatus::Rejected),
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
