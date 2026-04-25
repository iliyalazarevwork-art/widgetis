<?php

declare(strict_types=1);

namespace App\Core\Filament\Resources\FaqItems;

use App\Core\Filament\Resources\FaqItems\Pages\CreateFaqItem;
use App\Core\Filament\Resources\FaqItems\Pages\EditFaqItem;
use App\Core\Filament\Resources\FaqItems\Pages\ListFaqItems;
use App\Core\Filament\Resources\FaqItems\Schemas\FaqItemForm;
use App\Core\Filament\Resources\FaqItems\Tables\FaqItemsTable;
use App\Core\Models\FaqItem;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class FaqItemResource extends Resource
{
    protected static ?string $model = FaqItem::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedQuestionMarkCircle;

    protected static string | \UnitEnum | null $navigationGroup = 'Content';

    protected static ?int $navigationSort = 3;

    public static function form(Schema $schema): Schema
    {
        return FaqItemForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return FaqItemsTable::configure($table);
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
            'index' => ListFaqItems::route('/'),
            'create' => CreateFaqItem::route('/create'),
            'edit' => EditFaqItem::route('/{record}/edit'),
        ];
    }
}
