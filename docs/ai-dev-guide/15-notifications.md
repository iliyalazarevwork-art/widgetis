# Step 14 — Notifications

## Goal
In-app notification system: create, list (paginated, grouped by date), mark read, mark all read.
Notification types: trial_warning, widget_activated, update_available, payment_success, payment_failed, plan_changed.

## Prerequisites
Steps 01–13 completed. Notification model and migration exist.

## Actions

### 1. Create Notification model

**`app/Models/AppNotification.php`**
```php
<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\NotificationType;
use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppNotification extends Model
{
    use HasTranslations;

    protected $table = 'notifications';
    public $timestamps = false;
    public array $translatable = ['title', 'body'];

    protected $fillable = [
        'user_id', 'type', 'title', 'body', 'data',
        'is_read', 'read_at', 'created_at',
    ];

    protected function casts(): array
    {
        return [
            'title' => 'array',
            'body' => 'array',
            'data' => 'array',
            'is_read' => 'boolean',
            'read_at' => 'datetime',
            'created_at' => 'datetime',
            'type' => NotificationType::class,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }
}
```

### 2. Create NotificationType enum

**`app/Enums/NotificationType.php`**
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum NotificationType: string
{
    case TrialWarning = 'trial_warning';
    case WidgetActivated = 'widget_activated';
    case UpdateAvailable = 'update_available';
    case PaymentSuccess = 'payment_success';
    case PaymentFailed = 'payment_failed';
    case PlanChanged = 'plan_changed';
    case SubscriptionCancelled = 'subscription_cancelled';
}
```

### 3. Create NotificationService

**`app/Services/Notification/NotificationService.php`**
```php
<?php

declare(strict_types=1);

namespace App\Services\Notification;

use App\Enums\NotificationType;
use App\Models\AppNotification;
use App\Models\User;

class NotificationService
{
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
```

### 4. Create Notification Controller

**`app/Http/Controllers/Api/V1/Profile/NotificationController.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Api\V1\BaseController;
use App\Models\AppNotification;
use App\Services\Notification\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends BaseController
{
    public function __construct(
        private readonly NotificationService $notificationService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $this->currentUser();
        $perPage = min((int) $request->input('per_page', 20), 50);

        $notifications = AppNotification::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return $this->paginated($notifications, [
            'data' => collect($notifications->items())->map(fn ($n) => [
                'id' => $n->id,
                'type' => $n->type->value,
                'title' => $n->translated('title'),
                'body' => $n->translated('body'),
                'data' => $n->data,
                'is_read' => $n->is_read,
                'created_at' => $n->created_at->toIso8601String(),
            ]),
            'unread_count' => $this->notificationService->unreadCount($user),
        ]);
    }

    public function markAsRead(int $id): JsonResponse
    {
        $notification = AppNotification::where('user_id', $this->currentUser()->id)
            ->findOrFail($id);

        $this->notificationService->markAsRead($notification);

        return $this->noContent();
    }

    public function markAllAsRead(): JsonResponse
    {
        $this->notificationService->markAllAsRead($this->currentUser());

        return $this->noContent();
    }
}
```

### 5. Register routes

Add to the profile group in `routes/api.php`:

```php
use App\Http\Controllers\Api\V1\Profile\NotificationController;

// Notifications
Route::get('notifications', [NotificationController::class, 'index']);
Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
```

### 6. Add notification relation to User

Add to `app/Models/User.php`:

```php
public function appNotifications(): HasMany
{
    return $this->hasMany(AppNotification::class);
}
```

## How to Verify

```bash
# 1. Create a test notification via tinker
docker compose -f docker-compose.dev.yml exec backend php artisan tinker --execute="\
  \$user = \App\Models\User::first(); \
  app(\App\Services\Notification\NotificationService::class)->create( \
    \$user, \
    \App\Enums\NotificationType::TrialWarning, \
    ['en' => 'Trial ending in 2 days', 'uk' => 'Trial закінчується через 2 дні'], \
    ['en' => 'After trial, 1599 UAH will be charged for Pro.', 'uk' => 'Після trial буде списано 1599 грн за Pro.'], \
  ); \
  echo 'Created!';"

# 2. List notifications
curl http://localhost:9002/api/v1/profile/notifications \
  -H "Authorization: Bearer TOKEN"
# Should show the notification with unread_count

# 3. Mark as read
curl -X POST http://localhost:9002/api/v1/profile/notifications/1/read \
  -H "Authorization: Bearer TOKEN"
# 204

# 4. Mark all as read
curl -X POST http://localhost:9002/api/v1/profile/notifications/mark-all-read \
  -H "Authorization: Bearer TOKEN"
# 204
```

## Commit

```
feat: add in-app notification system
```
