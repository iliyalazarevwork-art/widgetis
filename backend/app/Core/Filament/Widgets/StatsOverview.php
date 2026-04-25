<?php

declare(strict_types=1);

namespace App\Core\Filament\Widgets;

use App\Core\Models\Order;
use App\Core\Models\Subscription;
use App\Core\Models\User;
use App\Enums\OrderStatus;
use App\Enums\SubscriptionStatus;
use App\Shared\Contracts\WidgetRuntimeStatsInterface;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverview extends StatsOverviewWidget
{
    protected function getStats(): array
    {
        /** @var WidgetRuntimeStatsInterface $runtimeStats */
        $runtimeStats = app(WidgetRuntimeStatsInterface::class);

        return [
            Stat::make('Active Subscriptions', Subscription::whereIn('status', [
                SubscriptionStatus::Active,
                SubscriptionStatus::Trial,
            ])->count())
                ->description('Including trials')
                ->icon('heroicon-o-arrow-path')
                ->color('primary'),

            Stat::make('Total Sites', $runtimeStats->totalSites())
                ->description('All registered sites')
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
