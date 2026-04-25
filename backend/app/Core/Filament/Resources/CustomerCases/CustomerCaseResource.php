<?php

declare(strict_types=1);

namespace App\Core\Filament\Resources\CustomerCases;

use App\Core\Filament\Resources\CustomerCases\Pages\CreateCustomerCase;
use App\Core\Filament\Resources\CustomerCases\Pages\EditCustomerCase;
use App\Core\Filament\Resources\CustomerCases\Pages\ListCustomerCases;
use App\Core\Filament\Resources\CustomerCases\Schemas\CustomerCaseForm;
use App\Core\Filament\Resources\CustomerCases\Tables\CustomerCasesTable;
use App\Core\Models\CustomerCase;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class CustomerCaseResource extends Resource
{
    protected static ?string $model = CustomerCase::class;
    protected static ?string $cluster = \App\Core\Filament\Clusters\Business::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedBriefcase;

    protected static string | \UnitEnum | null $navigationGroup = 'Content';

    protected static ?int $navigationSort = 1;

    public static function form(Schema $schema): Schema
    {
        return CustomerCaseForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return CustomerCasesTable::configure($table);
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
            'index' => ListCustomerCases::route('/'),
            'create' => CreateCustomerCase::route('/create'),
            'edit' => EditCustomerCase::route('/{record}/edit'),
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
