<?php

declare(strict_types=1);

namespace App\Core\Filament\Resources\Consultations;

use App\Core\Filament\Resources\Consultations\Pages\CreateConsultation;
use App\Core\Filament\Resources\Consultations\Pages\EditConsultation;
use App\Core\Filament\Resources\Consultations\Pages\ListConsultations;
use App\Core\Filament\Resources\Consultations\Schemas\ConsultationForm;
use App\Core\Filament\Resources\Consultations\Tables\ConsultationsTable;
use App\Core\Models\Consultation;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class ConsultationResource extends Resource
{
    protected static ?string $model = Consultation::class;
    protected static ?string $cluster = \App\Core\Filament\Clusters\Business::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedChatBubbleLeftRight;

    protected static string | \UnitEnum | null $navigationGroup = 'Leads';

    protected static ?int $navigationSort = 1;

    public static function form(Schema $schema): Schema
    {
        return ConsultationForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return ConsultationsTable::configure($table);
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
            'index' => ListConsultations::route('/'),
            'create' => CreateConsultation::route('/create'),
            'edit' => EditConsultation::route('/{record}/edit'),
        ];
    }
}
