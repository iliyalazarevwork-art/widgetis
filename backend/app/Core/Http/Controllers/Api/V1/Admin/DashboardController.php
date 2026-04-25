<?php

declare(strict_types=1);

namespace App\Core\Http\Controllers\Api\V1\Admin;

use App\Core\Http\Controllers\Api\V1\CoreBaseController;
use App\Core\Models\Order;
use App\Core\Models\Payment;
use App\Core\Models\Subscription;
use App\Core\Models\User;
use App\Shared\Contracts\WidgetRuntimeStatsInterface;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;

class DashboardController extends CoreBaseController
{
    public function __construct(
        private readonly WidgetRuntimeStatsInterface $runtimeStats,
    ) {
    }

    public function index(): JsonResponse
    {
        $now = CarbonImmutable::now();
        $thisMonthStart = $now->startOfMonth();
        $thisMonthEnd = $now->endOfMonth();
        $prevMonthStart = $thisMonthStart->subMonth()->startOfMonth();
        $prevMonthEnd = $thisMonthStart->subMonth()->endOfMonth();

        $ordersCount = Order::count();
        $ordersThisMonth = Order::whereBetween('created_at', [$thisMonthStart, $thisMonthEnd])->count();
        $ordersPrevMonth = Order::whereBetween('created_at', [$prevMonthStart, $prevMonthEnd])->count();

        $installedWidgetsCount = $this->runtimeStats->activeSiteWidgets();

        $revenueTotal = (float) Payment::where('status', 'success')
            ->where('type', 'charge')
            ->sum('amount');

        $revenueThisMonth = (float) Payment::where('status', 'success')
            ->where('type', 'charge')
            ->whereBetween('created_at', [$thisMonthStart, $thisMonthEnd])
            ->sum('amount');

        $revenuePrevMonth = (float) Payment::where('status', 'success')
            ->where('type', 'charge')
            ->whereBetween('created_at', [$prevMonthStart, $prevMonthEnd])
            ->sum('amount');

        return $this->success([
            'data' => [
                'kpi' => [
                    'users_count' => User::count(),
                    'orders_count' => $ordersCount,
                    'orders_this_month' => $ordersThisMonth,
                    'orders_growth_pct' => $this->percentChange((float) $ordersThisMonth, (float) $ordersPrevMonth),
                    'total_sites' => $this->runtimeStats->totalSites(),
                    'installed_widgets_count' => $installedWidgetsCount,
                    'active_subscriptions' => Subscription::active()->count(),
                    'revenue' => $revenueTotal,
                    'revenue_this_month' => $revenueThisMonth,
                    'revenue_growth_pct' => $this->percentChange($revenueThisMonth, $revenuePrevMonth),
                ],
                'recent_orders' => Order::with('user', 'plan')
                    ->orderByDesc('created_at')
                    ->limit(5)
                    ->get()
                    ->map(fn (Order $o) => [
                        'id' => $o->id,
                        'order_number' => $o->order_number,
                        'customer_email' => $o->user?->email,
                        'plan' => $o->plan?->slug,
                        'amount' => (float) $o->amount,
                        'currency' => $o->currency,
                        'status' => $o->status?->value,
                        'created_at' => $o->created_at->toIso8601String(),
                    ]),
            ],
        ]);
    }

    private function percentChange(float $current, float $previous): ?float
    {
        if ($previous == 0.0) {
            if ($current == 0.0) {
                return 0.0;
            }

            return null;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }
}
