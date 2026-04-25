<?php

declare(strict_types=1);

namespace App\Core\Http\Controllers\Api\V1\Admin;

use App\Core\Http\Controllers\Api\V1\CoreBaseController;
use App\Core\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserController extends CoreBaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query()
            ->with(['subscription.plan', 'roles'])
            ->withCount(['subscription'])
            ->addSelect([
                'sites_count' => DB::table('wgt_sites')
                    ->selectRaw('count(*)')
                    ->whereColumn('wgt_sites.user_id', 'users.id'),
                'primary_domain' => DB::table('wgt_sites')
                    ->select('domain')
                    ->whereColumn('wgt_sites.user_id', 'users.id')
                    ->orderBy('created_at')
                    ->limit(1),
            ]);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function (Builder $q) use ($search): void {
                $q->where('email', 'ilike', "%{$search}%")
                    ->orWhere('name', 'ilike', "%{$search}%")
                    ->orWhereExists(function ($sub) use ($search): void {
                        $sub->select(DB::raw(1))
                            ->from('wgt_sites')
                            ->whereColumn('wgt_sites.user_id', 'users.id')
                            ->where('domain', 'ilike', "%{$search}%");
                    });
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
                'sites_count' => (int) ($u->getAttribute('sites_count') ?? 0),
                'primary_domain' => $u->getAttribute('primary_domain'),
                'created_at' => $u->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $user = User::with('subscription.plan', 'roles')->findOrFail($id);

        $sites = DB::table('wgt_sites')
            ->where('user_id', $id)
            ->select(['id', 'domain', 'url', 'platform', 'status', 'created_at'])
            ->orderByDesc('created_at')
            ->get();

        return $this->success([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames(),
                'plan' => $user->subscription?->plan?->slug,
                'subscription_status' => $user->subscription?->status?->value,
                'sites' => $sites,
                'created_at' => $user->created_at->toIso8601String(),
            ],
        ]);
    }
}
