<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Resources\Api\V1\PlanResource;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;

class DashboardController extends BaseController
{
    public function index(): JsonResponse
    {
        $user = $this->currentUser()->load('subscription.plan');
        $plan = $user->currentPlan();

        $recentActivity = ActivityLog::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn (ActivityLog $a) => [
                'action' => $a->action,
                'description' => $this->resolveDescription($a->description),
                'entity_type' => $a->entity_type,
                'created_at' => $a->created_at?->toIso8601String(),
            ]);

        return $this->success([
            'data' => [
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'plan' => $plan ? new PlanResource($plan) : null,
                'subscription_status' => $user->subscription?->status?->value,
                'stats' => [
                    'sites_count' => $user->sites()->count(),
                    'widgets_count' => $user->siteWidgets()->where('is_enabled', true)->count(),
                ],
                'recent_activity' => $recentActivity,
            ],
        ]);
    }

    private function resolveDescription(mixed $description): string
    {
        if (is_string($description)) {
            return $description;
        }

        if (is_array($description)) {
            $locale = $this->locale();

            return (string) ($description[$locale] ?? $description['uk'] ?? $description['en'] ?? '');
        }

        return '';
    }
}
