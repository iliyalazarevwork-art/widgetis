<?php

declare(strict_types=1);

namespace App\Core\Filament\Resources\ManagerRequests;

use App\Core\Filament\Resources\ManagerRequests\Pages\CreateManagerRequest;
use App\Core\Filament\Resources\ManagerRequests\Pages\EditManagerRequest;
use App\Core\Filament\Resources\ManagerRequests\Pages\ListManagerRequests;
use App\Core\Filament\Resources\ManagerRequests\Schemas\ManagerRequestForm;
use App\Core\Filament\Resources\ManagerRequests\Tables\ManagerRequestsTable;
use App\Core\Models\ManagerRequest;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class ManagerRequestResource extends Resource
{
    protected static ?string $model = ManagerRequest::class;
    protected static ?string $cluster = \App\Core\Filament\Clusters\Business::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedWrenchScrewdriver;

    protected static string | \UnitEnum | null $navigationGroup = 'Leads';

    protected static ?int $navigationSort = 2;

    public static function form(Schema $schema): Schema
    {
        return ManagerRequestForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return ManagerRequestsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListManagerRequests::route('/'),
            'create' => CreateManagerRequest::route('/create'),
            'edit' => EditManagerRequest::route('/{record}/edit'),
        ];
    }

    public static function getRecordRouteBindingEloquentQuery(): Builder
    {
        return parent::getRecordRouteBindingEloquentQuery()
            ->withoutGlobalScopes([
                SoftDeletingScope::class,
            ]);
    }
}
