<?php

declare(strict_types=1);

namespace App\Core\Http\Controllers\Api\V1\Profile;

use App\Core\Models\AppNotification;
use App\Core\Services\Notification\NotificationService;
use App\Http\Controllers\Api\V1\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends BaseController
{
    public function __construct(
        private readonly NotificationService $notificationService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $this->currentUser();
        $perPage = min((int) $request->input('per_page', 20), 50);

        $notifications = AppNotification::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return $this->paginated($notifications, [
            'data' => collect($notifications->items())->map(fn (AppNotification $n) => [
                'id' => $n->id,
                'type' => $n->type?->value,
                'title' => $n->translated('title'),
                'body' => $n->translated('body'),
                'data' => $n->data,
                'is_read' => $n->is_read,
                'created_at' => $n->created_at?->toIso8601String(),
            ]),
            'unread_count' => $this->notificationService->unreadCount($user),
        ]);
    }

    public function markAsRead(int $id): JsonResponse
    {
        $notification = AppNotification::where('user_id', $this->currentUser()->id)->findOrFail($id);
        $this->notificationService->markAsRead($notification);

        return $this->noContent();
    }

    public function markAllAsRead(): JsonResponse
    {
        $this->notificationService->markAllAsRead($this->currentUser());

        return $this->noContent();
    }
}
