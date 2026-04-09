<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseController;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = Subscription::with('user', 'plan');

        if ($request->filled('status')) {
            $status = (string) $request->input('status');

            if ($status === 'cancelled') {
                $query->whereIn('status', ['cancelled', 'expired']);
            } else {
                $query->where('status', $status);
            }
        }

        $perPage = min((int) $request->input('per_page', 20), 50);
        $subs = $query->orderByDesc('created_at')->paginate($perPage);

        $statsQuery = Subscription::query();

        return $this->paginated($subs, [
            'stats' => [
                'active' => (clone $statsQuery)->where('status', 'active')->count(),
                'trial' => (clone $statsQuery)->where('status', 'trial')->count(),
                'cancelled' => (clone $statsQuery)->whereIn('status', ['cancelled', 'expired'])->count(),
                'risk' => (clone $statsQuery)->whereIn('status', ['trial', 'past_due', 'cancelled', 'expired'])->count(),
            ],
            'data' => collect($subs->items())->map(fn (Subscription $s) => [
                'id' => $s->id,
                'user_email' => $s->user?->email,
                'plan' => $s->plan?->slug,
                'status' => $s->status?->value,
                'billing_period' => $s->billing_period,
                'is_trial' => $s->is_trial,
                'created_at' => $s->created_at->toIso8601String(),
            ]),
        ]);
    }
}
