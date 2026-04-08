<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseController;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Site;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends BaseController
{
    public function index(): JsonResponse
    {
        return $this->success([
            'data' => [
                'kpi' => [
                    'users_count' => User::count(),
                    'orders_count' => Order::count(),
                    'active_sites' => Site::where('status', 'active')->count(),
                    'active_subscriptions' => Subscription::active()->count(),
                    'revenue' => (float) Payment::where('status', 'success')->where('type', 'charge')->sum('amount'),
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
                        'status' => $o->status?->value,
                        'created_at' => $o->created_at->toIso8601String(),
                    ]),
            ],
        ]);
    }
}
