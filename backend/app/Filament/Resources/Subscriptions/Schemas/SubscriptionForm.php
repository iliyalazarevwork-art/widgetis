<?php

declare(strict_types=1);

namespace App\Filament\Resources\Subscriptions\Schemas;

use App\Enums\BillingPeriod;
use App\Enums\SubscriptionStatus;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class SubscriptionForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('user_id')
                    ->relationship('user', 'name')
                    ->searchable()
                    ->required(),
                Select::make('plan_id')
                    ->relationship('plan', 'name')
                    ->required(),
                Select::make('billing_period')
                    ->options(BillingPeriod::class)
                    ->required()
                    ->default('monthly'),
                Select::make('status')
                    ->options(SubscriptionStatus::class)
                    ->default('active')
                    ->required(),
                Toggle::make('is_trial'),
                DateTimePicker::make('trial_ends_at'),
                DateTimePicker::make('current_period_start')
                    ->required(),
                DateTimePicker::make('current_period_end')
                    ->required(),
                DateTimePicker::make('cancelled_at'),
                Textarea::make('cancel_reason')
                    ->columnSpanFull(),
                TextInput::make('payment_provider'),
                TextInput::make('payment_provider_subscription_id'),
            ]);
    }
}
