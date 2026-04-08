<?php

declare(strict_types=1);

namespace App\Services\Notification;

use App\Enums\NotificationType;
use App\Models\AppNotification;
use App\Models\User;

class NotificationService
{
    /**
     * @param array<string, string> $title
     * @param array<string, string> $body
     * @param array<string, mixed>|null $data
     */
    public function create(
        User $user,
        NotificationType $type,
        array $title,
        array $body,
        ?array $data = null,
    ): AppNotification {
        return AppNotification::create([
            'user_id' => $user->id,
            'type' => $type->value,
            'title' => $title,
            'body' => $body,
            'data' => $data,
            'is_read' => false,
            'created_at' => now(),
        ]);
    }

    public function markAsRead(AppNotification $notification): void
    {
        $notification->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
    }

    public function markAllAsRead(User $user): int
    {
        return AppNotification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }

    public function unreadCount(User $user): int
    {
        return AppNotification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();
    }
}
