# Step 12 — Profile API (User Dashboard)

## Goal
Complete user cabinet: dashboard, profile CRUD, my widgets, payment history,
support requests, onboarding, settings. All `/api/v1/profile/*` endpoints.

## Prerequisites
Steps 01–11 completed. Sites and subscriptions work.

## Actions

### 1. Create remaining models

**`app/Models/Payment.php`**
```php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'user_id', 'order_id', 'subscription_id', 'type', 'amount',
        'currency', 'status', 'payment_provider', 'payment_method',
        'transaction_id', 'description', 'metadata',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'description' => 'array',
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function order(): BelongsTo { return $this->belongsTo(Order::class); }
    public function subscription(): BelongsTo { return $this->belongsTo(Subscription::class); }
}
```

**`app/Models/Order.php`**
```php
<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'order_number', 'user_id', 'plan_id', 'billing_period', 'amount',
        'discount_amount', 'currency', 'status', 'payment_provider',
        'payment_method', 'transaction_id', 'paid_at', 'refunded_at', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'paid_at' => 'datetime',
            'refunded_at' => 'datetime',
            'notes' => 'array',
            'status' => OrderStatus::class,
        ];
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function plan(): BelongsTo { return $this->belongsTo(Plan::class); }
    public function payments(): HasMany { return $this->hasMany(Payment::class); }
}
```

**`app/Enums/OrderStatus.php`**
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case Refunded = 'refunded';
}
```

**`app/Models/ManagerRequest.php`**
```php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ManagerRequest extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id', 'site_id', 'type', 'messenger', 'email',
        'phone', 'widgets', 'message', 'status', 'notes',
    ];

    protected function casts(): array
    {
        return ['widgets' => 'array'];
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function site(): BelongsTo { return $this->belongsTo(Site::class); }
}
```

**`app/Models/ActivityLog.php`**
```php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    public $timestamps = false;

    protected $table = 'activity_log';

    protected $fillable = [
        'user_id', 'action', 'entity_type', 'entity_id',
        'description', 'metadata', 'created_at',
    ];

    protected function casts(): array
    {
        return [
            'description' => 'array',
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
```

### 2. Add remaining relations to User

Add to `app/Models/User.php`:

```php
public function orders(): HasMany
{
    return $this->hasMany(Order::class);
}

public function payments(): HasMany
{
    return $this->hasMany(Payment::class);
}

public function managerRequests(): HasMany
{
    return $this->hasMany(ManagerRequest::class);
}

public function activities(): HasMany
{
    return $this->hasMany(ActivityLog::class);
}
```

### 3. Create ActivityLogService

**`app/Services/Activity/ActivityLogService.php`**
```php
<?php

declare(strict_types=1);

namespace App\Services\Activity;

use App\Models\ActivityLog;

class ActivityLogService
{
    public function log(
        ?int $userId,
        string $action,
        ?string $entityType = null,
        ?int $entityId = null,
        ?array $description = null,
        ?array $metadata = null,
    ): ActivityLog {
        return ActivityLog::create([
            'user_id' => $userId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'description' => $description,
            'metadata' => $metadata,
            'created_at' => now(),
        ]);
    }
}
```

### 4. Create Dashboard Controller

**`app/Http/Controllers/Api/V1/Profile/DashboardController.php`**
```php
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
            ->map(fn ($a) => [
                'action' => $a->action,
                'description' => $a->description,
                'entity_type' => $a->entity_type,
                'created_at' => $a->created_at->toIso8601String(),
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
                    'plan_expires_at' => $user->subscription?->current_period_end?->toIso8601String(),
                ],
                'recent_activity' => $recentActivity,
            ],
        ]);
    }
}
```

### 5. Create Profile Controller

**`app/Http/Controllers/Api/V1/Profile/ProfileController.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Api\V1\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends BaseController
{
    public function show(): JsonResponse
    {
        $user = $this->currentUser();

        return $this->success([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'telegram' => $user->telegram,
                'company' => $user->company,
                'avatar_url' => $user->avatar_url,
                'locale' => $user->locale,
                'two_factor_enabled' => $user->two_factor_enabled,
                'two_factor_method' => $user->two_factor_method,
                'notification_enabled' => $user->notification_enabled,
                'onboarding_completed' => $user->onboarding_completed_at !== null,
                'created_at' => $user->created_at->toIso8601String(),
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'telegram' => ['sometimes', 'nullable', 'string', 'max:100'],
            'company' => ['sometimes', 'nullable', 'string', 'max:255'],
            'locale' => ['sometimes', 'string', 'in:uk,en'],
        ]);

        $user = $this->currentUser();
        $user->update($request->only(['name', 'phone', 'telegram', 'company', 'locale']));

        return $this->show();
    }

    public function destroy(Request $request): JsonResponse
    {
        $user = $this->currentUser();
        $user->delete(); // soft delete

        auth('api')->logout();

        return $this->noContent();
    }

    public function completeOnboarding(): JsonResponse
    {
        $user = $this->currentUser();
        $user->update(['onboarding_completed_at' => now()]);

        return $this->noContent();
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $request->validate([
            'notification_enabled' => ['sometimes', 'boolean'],
            'locale' => ['sometimes', 'string', 'in:uk,en'],
        ]);

        $user = $this->currentUser();
        $user->update($request->only(['notification_enabled', 'locale']));

        return $this->success([
            'data' => [
                'notification_enabled' => $user->notification_enabled,
                'locale' => $user->locale,
            ],
        ]);
    }

    public function widgets(): JsonResponse
    {
        $user = $this->currentUser();
        $plan = $user->currentPlan();
        $locale = $this->locale();

        // Products available in user's plan
        $availableProductIds = $plan?->products()->pluck('products.id')->toArray() ?? [];

        // All active products
        $allProducts = \App\Models\Product::active()->with('tag')->orderBy('sort_order')->get();

        // User's active site widgets
        $activeWidgets = $user->siteWidgets()
            ->where('is_enabled', true)
            ->with(['product', 'site'])
            ->get();

        $available = [];
        $locked = [];

        foreach ($allProducts as $product) {
            if (in_array($product->id, $availableProductIds)) {
                $widget = $activeWidgets->firstWhere('product_id', $product->id);
                $available[] = [
                    'product_id' => $product->id,
                    'slug' => $product->slug,
                    'name' => $product->translated('name'),
                    'icon' => $product->icon,
                    'site_domain' => $widget?->site?->domain,
                    'is_enabled' => $widget?->is_enabled ?? false,
                ];
            } else {
                $locked[] = [
                    'product_id' => $product->id,
                    'slug' => $product->slug,
                    'name' => $product->translated('name'),
                    'icon' => $product->icon,
                    'required_plan' => 'max', // simplified; could compute actual minimum plan
                ];
            }
        }

        return $this->success([
            'available' => $available,
            'locked' => $locked,
            'limits' => [
                'used' => $activeWidgets->count(),
                'max' => $plan?->max_widgets ?? 2,
                'plan' => $plan?->slug ?? 'free',
            ],
        ]);
    }

    public function payments(Request $request): JsonResponse
    {
        $user = $this->currentUser();

        $payments = $user->payments()
            ->orderByDesc('created_at')
            ->paginate(min((int) $request->input('per_page', 20), 50));

        $subscription = $user->subscription?->load('plan');

        return $this->paginated($payments, [
            'data' => collect($payments->items())->map(fn ($p) => [
                'id' => $p->id,
                'type' => $p->type,
                'amount' => (float) $p->amount,
                'currency' => $p->currency,
                'status' => $p->status,
                'payment_provider' => $p->payment_provider,
                'payment_method' => $p->payment_method,
                'description' => $p->description,
                'created_at' => $p->created_at->toIso8601String(),
            ]),
            'billing' => $subscription ? [
                'plan' => $subscription->plan->slug,
                'next_billing_date' => $subscription->current_period_end?->toIso8601String(),
                'next_amount' => (float) $subscription->plan->price_monthly,
            ] : null,
        ]);
    }

    public function createSupportRequest(Request $request): JsonResponse
    {
        $request->validate([
            'type' => ['required', 'string', 'in:install_help,general'],
            'site_id' => ['nullable', 'integer', 'exists:sites,id'],
            'messenger' => ['nullable', 'string', 'in:telegram,viber,whatsapp'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        $user = $this->currentUser();

        $mr = \App\Models\ManagerRequest::create([
            'user_id' => $user->id,
            'site_id' => $request->input('site_id'),
            'type' => $request->input('type'),
            'messenger' => $request->input('messenger'),
            'email' => $user->email,
            'message' => $request->input('message'),
            'status' => 'new',
        ]);

        return $this->created(['data' => ['id' => $mr->id, 'status' => $mr->status]]);
    }
}
```

### 6. Register all profile routes

Replace the profile group in `routes/api.php`:

```php
use App\Http\Controllers\Api\V1\Profile\DashboardController;
use App\Http\Controllers\Api\V1\Profile\ProfileController;
use App\Http\Controllers\Api\V1\Profile\SiteController;
use App\Http\Controllers\Api\V1\Profile\SubscriptionController;

Route::prefix('v1/profile')->middleware(['auth:api', 'role:customer,admin'])->group(function () {
    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index']);

    // Profile
    Route::get('/', [ProfileController::class, 'show']);
    Route::put('/', [ProfileController::class, 'update']);
    Route::delete('/', [ProfileController::class, 'destroy']);
    Route::post('onboarding/complete', [ProfileController::class, 'completeOnboarding']);
    Route::get('settings', [ProfileController::class, 'updateSettings'])->name('profile.settings.show');
    Route::put('settings', [ProfileController::class, 'updateSettings']);

    // My widgets
    Route::get('widgets', [ProfileController::class, 'widgets']);

    // Payment history
    Route::get('payments', [ProfileController::class, 'payments']);

    // Support
    Route::post('support-requests', [ProfileController::class, 'createSupportRequest']);

    // Subscription
    Route::get('subscription', [SubscriptionController::class, 'show']);
    Route::get('subscription/prorate', [SubscriptionController::class, 'prorate']);
    Route::post('subscription/change', [SubscriptionController::class, 'change']);
    Route::post('subscription/cancel', [SubscriptionController::class, 'cancel']);

    // Sites
    Route::get('sites', [SiteController::class, 'index']);
    Route::post('sites', [SiteController::class, 'store']);
    Route::get('sites/{id}', [SiteController::class, 'show']);
    Route::delete('sites/{id}', [SiteController::class, 'destroy']);
    Route::post('sites/{id}/verify', [SiteController::class, 'verify']);
    Route::get('sites/{id}/script', [SiteController::class, 'script']);
    Route::put('sites/{siteId}/widgets/{productId}', [SiteController::class, 'updateWidget']);
});
```

## How to Verify

```bash
# Assumes you have a valid JWT token

# 1. Dashboard
curl http://localhost:9002/api/v1/profile/dashboard -H "Authorization: Bearer TOKEN"

# 2. Profile
curl http://localhost:9002/api/v1/profile -H "Authorization: Bearer TOKEN"

# 3. Update profile
curl -X PUT http://localhost:9002/api/v1/profile \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "telegram": "@testuser"}'

# 4. My widgets
curl http://localhost:9002/api/v1/profile/widgets -H "Authorization: Bearer TOKEN"

# 5. Payment history
curl http://localhost:9002/api/v1/profile/payments -H "Authorization: Bearer TOKEN"

# 6. Create support request
curl -X POST http://localhost:9002/api/v1/profile/support-requests \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "general", "messenger": "telegram", "message": "Need help"}'

# 7. Complete onboarding
curl -X POST http://localhost:9002/api/v1/profile/onboarding/complete \
  -H "Authorization: Bearer TOKEN"
```

## Commit

```
feat: add complete profile API with dashboard, widgets, payments, support
```
