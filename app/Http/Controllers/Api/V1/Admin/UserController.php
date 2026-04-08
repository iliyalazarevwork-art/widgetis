<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseController;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with('subscription.plan', 'roles');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(fn ($q) => $q->where('email', 'ilike', "%{$search}%")
                ->orWhere('name', 'ilike', "%{$search}%"));
        }

        $perPage = min((int) $request->input('per_page', 20), 50);
        $users = $query->orderByDesc('created_at')->paginate($perPage);

        return $this->paginated($users, [
            'data' => collect($users->items())->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'roles' => $u->getRoleNames(),
                'plan' => $u->subscription?->plan?->slug,
                'subscription_status' => $u->subscription?->status?->value,
                'created_at' => $u->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $user = User::with('subscription.plan', 'roles', 'sites')->findOrFail($id);

        return $this->success(['data' => $user]);
    }
}
