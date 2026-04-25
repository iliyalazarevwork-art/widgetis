<?php

declare(strict_types=1);

namespace App\Core\Http\Controllers\Api\V1\Admin;

use App\Core\Models\User;
use App\Http\Controllers\Api\V1\BaseController;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query()
            ->with(['subscription.plan', 'roles', 'sites:id,user_id,domain'])
            ->withCount('sites');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function (Builder $q) use ($search): void {
                $q->where('email', 'ilike', "%{$search}%")
                    ->orWhere('name', 'ilike', "%{$search}%")
                    ->orWhereHas('sites', fn (Builder $siteQ) => $siteQ->where('domain', 'ilike', "%{$search}%"));
            });
        }

        if ($request->filled('segment')) {
            $segment = (string) $request->input('segment');

            if ($segment === 'active') {
                $query->whereHas('subscription', fn (Builder $q) => $q->whereIn('status', ['active', 'trial']));
            } elseif ($segment === 'risk') {
                $query->whereHas('subscription', fn (Builder $q) => $q->whereIn('status', ['past_due', 'cancelled', 'expired']));
            } elseif ($segment === 'new') {
                $query->where('created_at', '>=', now()->subDays(30));
            }
        }

        $perPage = min((int) $request->input('per_page', 20), 50);
        $users = $query->orderByDesc('created_at')->paginate($perPage);

        $totalUsers = User::count();
        $newUsersThisMonth = User::where('created_at', '>=', now()->startOfMonth())->count();
        $proUsersCount = User::whereHas('subscription.plan', fn (Builder $q) => $q->where('slug', 'pro'))->count();

        return $this->paginated($users, [
            'stats' => [
                'total' => $totalUsers,
                'this_month' => $newUsersThisMonth,
                'pro_count' => $proUsersCount,
            ],
            'data' => collect($users->items())->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'roles' => $u->getRoleNames(),
                'plan' => $u->subscription?->plan?->slug,
                'subscription_status' => $u->subscription?->status?->value,
                'sites_count' => $u->sites_count,
                'primary_domain' => $u->sites->first()?->domain,
                'created_at' => $u->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $user = User::with('subscription.plan', 'roles', 'sites')->findOrFail($id);

        return $this->success(['data' => $user]);
    }
}
