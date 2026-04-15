<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseController;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = Order::with('user', 'plan');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('plan')) {
            $query->whereHas('plan', fn ($q) => $q->where('slug', $request->input('plan')));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        if ($request->filled('amount_min')) {
            $query->where('amount', '>=', (float) $request->input('amount_min'));
        }

        if ($request->filled('amount_max')) {
            $query->where('amount', '<=', (float) $request->input('amount_max'));
        }

        $search = trim((string) $request->input('q', ''));
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $like = '%' . $search . '%';

                $q->where('order_number', 'like', $like)
                    ->orWhere('amount', 'like', $like)
                    ->orWhereHas('user', function ($userQuery) use ($like) {
                        $userQuery->where('email', 'like', $like);
                    });
            });
        }

        $allowedSorts = ['created_at', 'amount'];
        $sortBy = in_array($request->input('sort_by'), $allowedSorts, true)
            ? $request->input('sort_by')
            : 'created_at';
        $sortDir = $request->input('sort_dir') === 'asc' ? 'asc' : 'desc';

        $perPage = min((int) $request->input('per_page', 20), 50);
        $orders = $query->orderBy($sortBy, $sortDir)->paginate($perPage);

        return $this->paginated($orders, [
            'data' => collect($orders->items())->map(fn (Order $o) => [
                'id' => $o->id,
                'order_number' => $o->order_number,
                'customer_email' => $o->user?->email,
                'plan' => $o->plan?->slug,
                'amount' => (float) $o->amount,
                'currency' => $o->currency,
                'status' => $o->status?->value,
                'billing_period' => $o->billing_period,
                'created_at' => $o->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $order = Order::with('user', 'plan', 'payments')->findOrFail($id);

        return $this->success(['data' => $order]);
    }
}
