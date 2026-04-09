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

        $perPage = min((int) $request->input('per_page', 20), 50);
        $orders = $query->orderByDesc('created_at')->paginate($perPage);

        return $this->paginated($orders, [
            'data' => collect($orders->items())->map(fn (Order $o) => [
                'id' => $o->id,
                'order_number' => $o->order_number,
                'customer_email' => $o->user?->email,
                'plan' => $o->plan?->slug,
                'amount' => (float) $o->amount,
                'currency' => $o->currency,
                'status' => $o->status?->value,
                'created_at' => $o->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $order = Order::with('user', 'plan', 'payments')->findOrFail($id);

        return $this->success(['data' => $order]);
    }
}
