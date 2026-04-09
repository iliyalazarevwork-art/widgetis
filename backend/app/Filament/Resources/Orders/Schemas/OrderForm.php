<?php

declare(strict_types=1);

namespace App\Filament\Resources\Orders\Schemas;

use App\Enums\BillingPeriod;
use App\Enums\OrderStatus;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class OrderForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Order Info')
                    ->schema([
                        TextInput::make('order_number')
                            ->required()
                            ->disabled(fn (string $operation): bool => $operation === 'edit'),
                        Select::make('user_id')
                            ->relationship('user', 'name')
                            ->searchable()
                            ->required(),
                        Select::make('plan_id')
                            ->relationship('plan', 'name')
                            ->required(),
                        Select::make('billing_period')
                            ->options(BillingPeriod::class)
                            ->required(),
                        TextInput::make('amount')
                            ->required()
                            ->numeric()
                            ->prefix('₴'),
                        TextInput::make('discount_amount')
                            ->numeric()
                            ->default(0)
                            ->prefix('₴'),
                        TextInput::make('currency')
                            ->required()
                            ->default('UAH'),
                    ]),
                Section::make('Status')
                    ->schema([
                        Select::make('status')
                            ->options(OrderStatus::class)
                            ->default('pending')
                            ->required(),
                    ]),
                Section::make('Payment')
                    ->schema([
                        TextInput::make('payment_provider'),
                        TextInput::make('payment_method'),
                        TextInput::make('transaction_id'),
                        DateTimePicker::make('paid_at'),
                        DateTimePicker::make('refunded_at'),
                    ]),
                Section::make('Notes')
                    ->schema([
                        Textarea::make('notes')
                            ->columnSpanFull(),
                    ]),
            ]);
    }
}
