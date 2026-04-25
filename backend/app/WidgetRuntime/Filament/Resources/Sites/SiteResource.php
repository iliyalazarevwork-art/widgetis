<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Filament\Resources\Sites;

use App\WidgetRuntime\Filament\Resources\Sites\Pages\CreateSite;
use App\WidgetRuntime\Filament\Resources\Sites\Pages\EditSite;
use App\WidgetRuntime\Filament\Resources\Sites\Pages\ListSites;
use App\WidgetRuntime\Filament\Resources\Sites\RelationManagers\SiteWidgetsRelationManager;
use App\WidgetRuntime\Filament\Resources\Sites\Schemas\SiteForm;
use App\WidgetRuntime\Filament\Resources\Sites\Tables\SitesTable;
use App\WidgetRuntime\Models\Site;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class SiteResource extends Resource
{
    protected static ?string $model = Site::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedGlobeAlt;

    protected static string | \UnitEnum | null $navigationGroup = 'Sites';

    protected static ?int $navigationSort = 1;

    public static function form(Schema $schema): Schema
    {
        return SiteForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return SitesTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            SiteWidgetsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListSites::route('/'),
            'create' => CreateSite::route('/create'),
            'edit' => EditSite::route('/{record}/edit'),
        ];
    }
}
