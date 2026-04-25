<?php

declare(strict_types=1);

namespace App\Core\Filament\Resources\Products;

use App\Core\Filament\Resources\Products\Pages\CreateProduct;
use App\Core\Filament\Resources\Products\Pages\EditProduct;
use App\Core\Filament\Resources\Products\Pages\ListProducts;
use App\Core\Filament\Resources\Products\Schemas\ProductForm;
use App\Core\Filament\Resources\Products\Tables\ProductsTable;
use App\Core\Models\Product;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class ProductResource extends Resource
{
    protected static ?string $model = Product::class;
    protected static ?string $cluster = \App\Core\Filament\Clusters\Business::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedPuzzlePiece;

    protected static string | \UnitEnum | null $navigationGroup = 'Catalog';

    protected static ?int $navigationSort = 2;

    public static function form(Schema $schema): Schema
    {
        return ProductForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return ProductsTable::configure($table);
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
            'index' => ListProducts::route('/'),
            'create' => CreateProduct::route('/create'),
            'edit' => EditProduct::route('/{record}/edit'),
        ];
    }
}
