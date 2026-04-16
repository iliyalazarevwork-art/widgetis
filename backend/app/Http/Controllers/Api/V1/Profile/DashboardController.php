<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Resources\Api\V1\PlanResource;
use App\Models\ActivityLog;
use App\Models\AppNotification;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;

class DashboardController extends BaseController
{
    public function index(): JsonResponse
    {
        $user = $this->currentUser()->load('subscription.plan');
        $plan = $user->currentPlan();

        $activityLog = ActivityLog::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn (ActivityLog $a) => $this->mapActivityLogItem($a));

        $payments = $user->payments()
            ->with(['subscription.plan', 'order.plan'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn (Payment $payment) => $this->mapPaymentItem($payment));

        $notifications = $user->appNotifications()
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn (AppNotification $notification) => $this->mapNotificationItem($notification));

        $recentActivity = collect()
            ->concat($payments)
            ->concat($notifications)
            ->concat($activityLog)
            ->filter(fn (array $item) => !empty($item['created_at']))
            ->sortByDesc(fn (array $item) => strtotime((string) $item['created_at']) ?: 0)
            ->take(10)
            ->values();

        return $this->success([
            'data' => [
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'plan' => $plan ? new PlanResource($plan) : null,
                'subscription_status' => $user->subscription?->status?->value,
                'next_renewal_at' => $user->subscription?->current_period_end?->toIso8601String(),
                'stats' => [
                    'sites_count' => $user->sites()->count(),
                    'widgets_count' => $user->siteWidgets()->where('is_enabled', true)->count(),
                ],
                'recent_activity' => $recentActivity,
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapActivityLogItem(ActivityLog $activity): array
    {
        $status = match ($activity->action) {
            'subscription.cancelled' => 'cancelled',
            'subscription.expired'   => 'expired',
            default                  => 'neutral',
        };

        $metadata = is_array($activity->metadata) ? $activity->metadata : [];

        return [
            'source' => 'activity',
            'status' => $status,
            'action' => $activity->action,
            'description' => $this->resolveDescription($activity->description),
            'title' => $this->resolveDescription($activity->description),
            'subtitle' => null,
            'entity_type' => $activity->entity_type,
            'created_at' => $activity->created_at?->toIso8601String(),
            'amount' => null,
            'currency' => null,
            'provider' => null,
            'plan_name' => isset($metadata['plan']) ? (string) $metadata['plan'] : null,
            'is_trial' => false,
            'trial_days' => null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapPaymentItem(Payment $payment): array
    {
        $plan = $payment->subscription?->plan ?? $payment->order?->plan;
        $isTrial = $payment->type === 'trial_activation' || (float) $payment->amount === 0.0;
        $provider = $payment->payment_provider?->value ?? 'unknown';
        $status = $isTrial ? 'trial' : (string) $payment->status;

        return [
            'source' => 'payment',
            'status' => $status,
            'action' => (string) $payment->type,
            'description' => $isTrial ? 'Trial активовано' : 'Оплата підписки',
            'title' => $isTrial ? 'Trial активовано' : 'Оплата підписки',
            'subtitle' => null,
            'entity_type' => 'payment',
            'created_at' => $payment->created_at?->toIso8601String(),
            'amount' => (float) $payment->amount,
            'currency' => $payment->currency,
            'provider' => strtoupper($provider),
            'plan_name' => $plan?->name,
            'is_trial' => $isTrial,
            'trial_days' => $plan?->trial_days,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapNotificationItem(AppNotification $notification): array
    {
        $type = $notification->type?->value;

        return [
            'source' => 'notification',
            'status' => $this->notificationStatus($type),
            'action' => (string) $type,
            'description' => $notification->translated('title'),
            'title' => $notification->translated('title'),
            'subtitle' => $notification->translated('body'),
            'entity_type' => 'notification',
            'created_at' => $notification->created_at?->toIso8601String(),
            'amount' => null,
            'currency' => null,
            'provider' => null,
            'plan_name' => null,
            'is_trial' => false,
            'trial_days' => null,
        ];
    }

    private function notificationStatus(?string $type): string
    {
        return match ($type) {
            'payment_success' => 'success',
            'payment_failed' => 'failed',
            'trial_warning' => 'trial',
            default => 'info',
        };
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
