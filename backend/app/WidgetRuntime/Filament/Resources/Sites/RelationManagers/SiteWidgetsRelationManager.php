<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Filament\Resources\Sites\RelationManagers;

use App\WidgetRuntime\Jobs\RebuildSiteScriptJob;
use App\WidgetRuntime\Models\SiteWidget;
use Filament\Actions\Action;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\KeyValue;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Toggle;
use Filament\Notifications\Notification;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class SiteWidgetsRelationManager extends RelationManager
{
    protected static string $relationship = 'widgets';

    public function form(Schema $schema): Schema
    {
        return $schema->components([
            Select::make('product_id')
                ->relationship('product', 'slug')
                ->searchable()
                ->required(),
            Toggle::make('is_enabled')
                ->label('Enabled')
                ->default(false),
            KeyValue::make('config')
                ->label('Config (key → value)')
                ->nullable(),
        ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('product.slug')
                    ->label('Widget')
                    ->searchable(),
                IconColumn::make('is_enabled')
                    ->label('Enabled')
                    ->boolean(),
                TextColumn::make('enabled_at')
                    ->label('Enabled at')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('updated_at')
                    ->label('Updated')
                    ->dateTime()
                    ->sortable(),
            ])
            ->recordActions([
                EditAction::make()
                    ->after(fn (SiteWidget $record) => RebuildSiteScriptJob::dispatch($record->site_id)),
                Action::make('toggle')
                    ->label(fn (SiteWidget $record) => $record->is_enabled ? 'Disable' : 'Enable')
                    ->icon(fn (SiteWidget $record) => $record->is_enabled ? 'heroicon-o-pause' : 'heroicon-o-play')
                    ->color(fn (SiteWidget $record) => $record->is_enabled ? 'danger' : 'success')
                    ->action(function (SiteWidget $record): void {
                        $record->is_enabled = ! $record->is_enabled;
                        $record->enabled_at = $record->is_enabled ? now() : $record->enabled_at;
                        $record->disabled_at = $record->is_enabled ? $record->disabled_at : now();
                        $record->save();

                        RebuildSiteScriptJob::dispatch($record->site_id);

                        Notification::make()
                            ->title($record->is_enabled ? 'Widget enabled. Rebuild queued.' : 'Widget disabled. Rebuild queued.')
                            ->success()
                            ->send();
                    }),
                DeleteAction::make()
                    ->after(fn (SiteWidget $record) => RebuildSiteScriptJob::dispatch($record->site_id)),
            ])
            ->toolbarActions([
                CreateAction::make()
                    ->after(fn (SiteWidget $record) => RebuildSiteScriptJob::dispatch($record->site_id)),
                Action::make('rebuild')
                    ->label('Rebuild & Deploy')
                    ->icon('heroicon-o-arrow-path')
                    ->color('warning')
                    ->action(function (): void {
                        /** @var \App\WidgetRuntime\Models\Site $owner */
                        $owner = $this->getOwnerRecord();
                        RebuildSiteScriptJob::dispatch($owner->id);

                        Notification::make()
                            ->title('Rebuild queued.')
                            ->success()
                            ->send();
                    }),
            ]);
    }
}
