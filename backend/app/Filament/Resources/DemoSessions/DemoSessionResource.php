<?php

declare(strict_types=1);

namespace App\Filament\Resources\DemoSessions;

use App\Filament\Resources\DemoSessions\Pages\CreateDemoSession;
use App\Filament\Resources\DemoSessions\Pages\EditDemoSession;
use App\Filament\Resources\DemoSessions\Pages\ListDemoSessions;
use App\Filament\Resources\DemoSessions\Schemas\DemoSessionForm;
use App\Filament\Resources\DemoSessions\Tables\DemoSessionsTable;
use App\Models\DemoSession;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class DemoSessionResource extends Resource
{
    protected static ?string $model = DemoSession::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedPlay;

    protected static string | \UnitEnum | null $navigationGroup = 'Leads';

    protected static ?int $navigationSort = 3;

    public static function form(Schema $schema): Schema
    {
        return DemoSessionForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return DemoSessionsTable::configure($table);
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
            'index' => ListDemoSessions::route('/'),
            'create' => CreateDemoSession::route('/create'),
            'edit' => EditDemoSession::route('/{record}/edit'),
        ];
    }
}
