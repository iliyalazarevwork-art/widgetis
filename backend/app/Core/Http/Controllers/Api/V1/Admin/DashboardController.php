<?php

declare(strict_types=1);

namespace App\Core\Http\Controllers\Api\V1\Admin;

use App\Core\Models\Order;
use App\Core\Models\Payment;
use App\Core\Models\Subscription;
use App\Core\Models\User;
use App\Http\Controllers\Api\V1\BaseController;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Models\SiteWidget;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;

class DashboardController extends BaseController
{
    public function index(): JsonResponse
    {
        $now = CarbonImmutable::now();
        $thisMonthStart = $now->startOfMonth();
        $thisMonthEnd = $now->endOfMonth();
        $prevMonthStart = $thisMonthStart->subMonth()->startOfMonth();
        $prevMonthEnd = $thisMonthStart->subMonth()->endOfMonth();
        $weekAgo = $now->subDays(7);

        $ordersCount = Order::count();
        $ordersThisMonth = Order::whereBetween('created_at', [$thisMonthStart, $thisMonthEnd])->count();
        $ordersPrevMonth = Order::whereBetween('created_at', [$prevMonthStart, $prevMonthEnd])->count();

        $activeSitesWithWidgets = Site::query()
            ->active()
            ->where('script_installed', true)
            ->whereHas('widgets', fn ($q) => $q->where('is_enabled', true))
            ->count();

        $newActiveSitesWeek = Site::query()
            ->active()
            ->where('script_installed', true)
            ->where('created_at', '>=', $weekAgo)
            ->whereHas('widgets', fn ($q) => $q->where('is_enabled', true))
            ->count();

        $installedWidgetsCount = SiteWidget::query()
            ->where('is_enabled', true)
            ->count();

        $installedWidgetsWeek = SiteWidget::query()
            ->where('is_enabled', true)
            ->where(function ($q) use ($weekAgo) {
                $q->where('enabled_at', '>=', $weekAgo)
                    ->orWhere(function ($q2) use ($weekAgo) {
                        $q2->whereNull('enabled_at')
                            ->where('created_at', '>=', $weekAgo);
                    });
            })
            ->count();

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
                    'active_sites' => $activeSitesWithWidgets,
                    'active_sites_new_week' => $newActiveSitesWeek,
                    'installed_widgets_count' => $installedWidgetsCount,
                    'installed_widgets_new_week' => $installedWidgetsWeek,
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
