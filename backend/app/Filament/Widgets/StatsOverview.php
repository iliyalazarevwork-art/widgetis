<?php

declare(strict_types=1);

namespace App\Filament\Widgets;

use App\Enums\OrderStatus;
use App\Enums\SiteStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Order;
use App\Models\Site;
use App\Models\Subscription;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverview extends StatsOverviewWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Active Subscriptions', Subscription::whereIn('status', [
                SubscriptionStatus::Active,
                SubscriptionStatus::Trial,
            ])->count())
                ->description('Including trials')
                ->icon('heroicon-o-arrow-path')
                ->color('primary'),

            Stat::make('Active Sites', Site::where('status', SiteStatus::Active)->count())
                ->description('With installed scripts')
                ->icon('heroicon-o-globe-alt')
                ->color('success'),

            Stat::make('Monthly Revenue', number_format(
                (float) Order::where('status', OrderStatus::Completed)
                    ->whereMonth('paid_at', now()->month)
                    ->whereYear('paid_at', now()->year)
                    ->sum('amount'),
                0,
                '.',
                ','
            ) . ' ₴')
                ->description('This month')
                ->icon('heroicon-o-currency-dollar')
                ->color('warning'),

            Stat::make('Total Users', User::count())
                ->description('Registered accounts')
                ->icon('heroicon-o-users')
                ->color('info'),
        ];
    }
}
