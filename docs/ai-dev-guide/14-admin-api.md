# Step 13 — Admin API

## Goal
Complete admin API: dashboard KPI, order management, user management, site management,
subscription listing, finance dashboard, configurator, cases CRUD, leads management.
All `/api/v1/admin/*` endpoints. Protected by `role:admin` middleware.

## Prerequisites
Steps 01–12 completed. All models exist.

## Actions

### 1. Create remaining models

**`app/Models/Consultation.php`**
```php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Consultation extends Model
{
    protected $fillable = [
        'name', 'phone', 'email', 'preferred_at', 'status', 'notes',
    ];

    protected function casts(): array
    {
        return ['preferred_at' => 'datetime'];
    }
}
```

**`app/Models/CustomerCase.php`**
```php
<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomerCase extends Model
{
    use HasTranslations, SoftDeletes;

    protected $table = 'customer_cases';
    public array $translatable = ['description'];

    protected $fillable = [
        'store', 'store_url', 'store_logo_url', 'owner', 'platform',
        'description', 'review_text', 'review_rating', 'screenshot_urls',
        'widgets', 'is_published', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'description' => 'array',
            'screenshot_urls' => 'array',
            'widgets' => 'array',
            'is_published' => 'boolean',
        ];
    }
}
```

**`app/Models/DemoSession.php`**
```php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class DemoSession extends Model
{
    protected $fillable = [
        'code', 'domain', 'config', 'created_by', 'view_count', 'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'config' => 'array',
            'expires_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public static function generateCode(): string
    {
        return strtoupper(Str::random(8));
    }
}
```

**`app/Models/Review.php`**
```php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    protected $fillable = ['user_id', 'rating', 'title', 'body', 'status'];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }

    public function scopeApproved($query) { return $query->where('status', 'approved'); }
}
```

**`app/Models/FaqItem.php`**
```php
<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Model;

class FaqItem extends Model
{
    use HasTranslations;

    public array $translatable = ['question', 'answer'];

    protected $fillable = ['category', 'question', 'answer', 'sort_order', 'is_published'];

    protected function casts(): array
    {
        return [
            'question' => 'array',
            'answer' => 'array',
            'is_published' => 'boolean',
        ];
    }

    public function scopePublished($query) { return $query->where('is_published', true); }
}
```

### 2. Create public endpoints for cases, reviews, FAQ, consultations

**`app/Http/Controllers/Api/V1/Public/CaseController.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Api\V1\BaseController;
use App\Models\CustomerCase;
use Illuminate\Http\JsonResponse;

class CaseController extends BaseController
{
    public function index(): JsonResponse
    {
        $cases = CustomerCase::where('is_published', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'store' => $c->store,
                'store_url' => $c->store_url,
                'store_logo_url' => $c->store_logo_url,
                'platform' => $c->platform,
                'description' => $c->translated('description'),
                'review_rating' => $c->review_rating,
                'widgets' => $c->widgets,
            ]);

        return $this->success(['data' => $cases]);
    }
}
```

**`app/Http/Controllers/Api/V1/Public/FaqController.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Api\V1\BaseController;
use App\Models\FaqItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FaqController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = FaqItem::published()->orderBy('sort_order');

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        $items = $query->get()->map(fn ($f) => [
            'id' => $f->id,
            'category' => $f->category,
            'question' => $f->translated('question'),
            'answer' => $f->translated('answer'),
        ]);

        return $this->success(['data' => $items]);
    }
}
```

**`app/Http/Controllers/Api/V1/Public/ConsultationController.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Api\V1\BaseController;
use App\Models\Consultation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConsultationController extends BaseController
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'preferred_at' => ['nullable', 'date'],
        ]);

        $consultation = Consultation::create($request->only(['name', 'phone', 'email', 'preferred_at']));

        // TODO: Send admin notification email

        return $this->created(['data' => ['id' => $consultation->id, 'status' => $consultation->status]]);
    }
}
```

**`app/Http/Controllers/Api/V1/Public/ManagerRequestController.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Api\V1\BaseController;
use App\Models\ManagerRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ManagerRequestController extends BaseController
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'messenger' => ['required', 'string', 'in:telegram,viber,whatsapp'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'site' => ['nullable', 'string', 'max:500'],
            'widgets' => ['nullable', 'array'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        $mr = ManagerRequest::create(array_merge(
            $request->only(['messenger', 'email', 'phone', 'widgets', 'message']),
            ['type' => 'demo_request', 'status' => 'new'],
        ));

        return $this->created(['data' => ['id' => $mr->id, 'status' => $mr->status]]);
    }
}
```

### 3. Create Admin Controllers

Due to the large number of admin endpoints, create one controller per resource area.
Each follows the same pattern: index (paginated + filters), show, update, and any actions.

**Create these controllers in `app/Http/Controllers/Api/V1/Admin/`:**

- `DashboardController.php` — GET /admin/dashboard (aggregate KPIs)
- `OrderController.php` — CRUD orders + refund + verify-payment + complete
- `UserController.php` — list users + detail + block/unblock + change plan
- `SiteController.php` — list sites + detail + toggle widget + activate/deactivate
- `SubscriptionController.php` — list subscriptions with filters
- `FinanceController.php` — MRR dashboard + transactions + export
- `ConfiguratorController.php` — widget config CRUD + preview + build
- `CaseController.php` — CRUD cases
- `DemoSessionController.php` — CRUD demo sessions
- `ConsultationController.php` — list + update status
- `ManagerRequestController.php` — list + update status

Each controller should extend `BaseController` and use the same response patterns.

**Example — `app/Http/Controllers/Api/V1/Admin/DashboardController.php`:**
```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseController;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Site;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;

class DashboardController extends BaseController
{
    public function index(): JsonResponse
    {
        $ordersCount = Order::count();
        $activeSites = Site::where('status', 'active')->count();
        $activeSubscriptions = Subscription::active()->count();
        $revenue = Payment::where('status', 'success')->where('type', 'charge')->sum('amount');

        $recentOrders = Order::with('user', 'plan')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn ($o) => [
                'id' => $o->id,
                'order_number' => $o->order_number,
                'customer_email' => $o->user?->email,
                'plan' => $o->plan?->slug,
                'amount' => (float) $o->amount,
                'status' => $o->status->value,
                'created_at' => $o->created_at->toIso8601String(),
            ]);

        return $this->success([
            'data' => [
                'kpi' => [
                    'orders_count' => $ordersCount,
                    'active_sites' => $activeSites,
                    'active_subscriptions' => $activeSubscriptions,
                    'revenue' => (float) $revenue,
                ],
                'recent_orders' => $recentOrders,
            ],
        ]);
    }
}
```

**Follow this same pattern for all admin controllers.** Each should:
- Use `$this->success()`, `$this->paginated()`, `$this->error()`, `$this->created()`, `$this->noContent()`
- Validate input with `$request->validate([...])`
- Use Eloquent scopes and relations for filtering
- Return consistent JSON structure

### 4. Register public routes

Add to `routes/api.php` in the public v1 group:

```php
use App\Http\Controllers\Api\V1\Public\CaseController;
use App\Http\Controllers\Api\V1\Public\ConsultationController;
use App\Http\Controllers\Api\V1\Public\FaqController;
use App\Http\Controllers\Api\V1\Public\ManagerRequestController;

// Public
Route::get('cases', [CaseController::class, 'index']);
Route::get('faq', [FaqController::class, 'index']);
Route::post('consultations', [ConsultationController::class, 'store'])->middleware('throttle:3,60');
Route::post('manager-requests', [ManagerRequestController::class, 'store'])->middleware('throttle:3,60');
```

### 5. Register admin routes

```php
use App\Http\Controllers\Api\V1\Admin as Admin;

Route::prefix('v1/admin')->middleware(['auth:api', 'role:admin'])->group(function () {
    Route::get('dashboard', [Admin\DashboardController::class, 'index']);

    // Orders
    Route::get('orders', [Admin\OrderController::class, 'index']);
    Route::get('orders/{id}', [Admin\OrderController::class, 'show']);
    Route::post('orders/{id}/refund', [Admin\OrderController::class, 'refund']);
    Route::post('orders/{id}/verify-payment', [Admin\OrderController::class, 'verifyPayment']);
    Route::post('orders/{id}/complete', [Admin\OrderController::class, 'complete']);

    // Users
    Route::get('users', [Admin\UserController::class, 'index']);
    Route::get('users/{id}', [Admin\UserController::class, 'show']);
    Route::post('users/{id}/block', [Admin\UserController::class, 'block']);
    Route::post('users/{id}/unblock', [Admin\UserController::class, 'unblock']);
    Route::put('users/{id}/plan', [Admin\UserController::class, 'changePlan']);

    // Sites
    Route::get('sites', [Admin\SiteController::class, 'index']);
    Route::get('sites/{id}', [Admin\SiteController::class, 'show']);
    Route::put('sites/{id}/widgets/{wid}/toggle', [Admin\SiteController::class, 'toggleWidget']);
    Route::post('sites/{id}/deactivate', [Admin\SiteController::class, 'deactivate']);
    Route::post('sites/{id}/activate', [Admin\SiteController::class, 'activate']);

    // Subscriptions
    Route::get('subscriptions', [Admin\SubscriptionController::class, 'index']);

    // Finance
    Route::get('finance/dashboard', [Admin\FinanceController::class, 'dashboard']);
    Route::get('finance/transactions', [Admin\FinanceController::class, 'transactions']);
    Route::post('finance/export', [Admin\FinanceController::class, 'export']);

    // Cases
    Route::apiResource('cases', Admin\CaseController::class);

    // Demo sessions
    Route::get('demo-sessions', [Admin\DemoSessionController::class, 'index']);
    Route::post('demo-sessions', [Admin\DemoSessionController::class, 'store']);
    Route::delete('demo-sessions/{id}', [Admin\DemoSessionController::class, 'destroy']);

    // Leads
    Route::get('consultations', [Admin\ConsultationController::class, 'index']);
    Route::patch('consultations/{id}', [Admin\ConsultationController::class, 'update']);
    Route::get('manager-requests', [Admin\ManagerRequestController::class, 'index']);
    Route::patch('manager-requests/{id}', [Admin\ManagerRequestController::class, 'update']);
});
```

### 6. Implement all admin controllers

For each admin controller listed above, follow the DashboardController pattern.
Key guidelines:
- **index()** methods accept query params: `?search=`, `?status=`, `?page=`, `?per_page=`
- **show()** methods return the resource with related data
- **update/patch** methods validate and update specific fields
- **Action methods** (block, refund, etc.) perform the action and return updated resource
- Use `$this->paginated()` for lists, `$this->success()` for single items

## How to Verify

```bash
# Login as admin (get JWT via OTP for admin@widgetis.com)

# 1. Admin dashboard
curl http://localhost:9002/api/v1/admin/dashboard -H "Authorization: Bearer ADMIN_TOKEN"

# 2. List orders
curl http://localhost:9002/api/v1/admin/orders -H "Authorization: Bearer ADMIN_TOKEN"

# 3. List users
curl "http://localhost:9002/api/v1/admin/users?search=test" -H "Authorization: Bearer ADMIN_TOKEN"

# 4. Verify customer cannot access admin
curl http://localhost:9002/api/v1/admin/dashboard -H "Authorization: Bearer CUSTOMER_TOKEN"
# Should return 403

# 5. Public cases
curl http://localhost:9002/api/v1/cases

# 6. Public FAQ
curl "http://localhost:9002/api/v1/faq?category=pricing"

# 7. Submit consultation (rate limited)
curl -X POST http://localhost:9002/api/v1/consultations \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "phone": "+380991234567"}'
```

## Commit

```
feat: add admin API and public endpoints for cases, FAQ, consultations
```
