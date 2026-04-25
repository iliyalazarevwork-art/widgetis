<?php

declare(strict_types=1);

namespace App\Core\Filament\Resources\Subscriptions;

use App\Core\Filament\Resources\Subscriptions\Pages\CreateSubscription;
use App\Core\Filament\Resources\Subscriptions\Pages\EditSubscription;
use App\Core\Filament\Resources\Subscriptions\Pages\ListSubscriptions;
use App\Core\Filament\Resources\Subscriptions\Schemas\SubscriptionForm;
use App\Core\Filament\Resources\Subscriptions\Tables\SubscriptionsTable;
use App\Core\Models\Subscription;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class SubscriptionResource extends Resource
{
    protected static ?string $model = Subscription::class;
    protected static ?string $cluster = \App\Core\Filament\Clusters\Business::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedArrowPath;

    protected static string | \UnitEnum | null $navigationGroup = 'Users';

    protected static ?int $navigationSort = 2;

    public static function form(Schema $schema): Schema
    {
        return SubscriptionForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return SubscriptionsTable::configure($table);
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
            'index' => ListSubscriptions::route('/'),
            'create' => CreateSubscription::route('/create'),
            'edit' => EditSubscription::route('/{record}/edit'),
        ];
    }
}
