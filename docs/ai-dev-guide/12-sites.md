# Step 11 — Sites, Scripts & Widget Configuration

## Goal
Users can add sites (stores), get embed scripts, verify installation, enable/disable widgets per site.
Plan limits enforced (max sites, max widgets).

## Prerequisites
Steps 01–10 completed. Site and SiteWidget stub models exist.

## Actions

### 1. Complete Site model

Replace the stub `app/Models/Site.php` with the full version:

```php
<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\SiteStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Site extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'domain',
        'url',
        'platform',
        'status',
        'script_installed',
        'script_installed_at',
        'connected_at',
        'deactivated_at',
    ];

    protected function casts(): array
    {
        return [
            'script_installed' => 'boolean',
            'script_installed_at' => 'datetime',
            'connected_at' => 'datetime',
            'deactivated_at' => 'datetime',
            'status' => SiteStatus::class,
        ];
    }

    // --- Relations ---

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function script(): HasOne
    {
        return $this->hasOne(SiteScript::class);
    }

    public function widgets(): HasMany
    {
        return $this->hasMany(SiteWidget::class);
    }

    // --- Scopes ---

    public function scopeActive($query)
    {
        return $query->where('status', SiteStatus::Active);
    }

    // --- Helpers ---

    public function isActive(): bool
    {
        return $this->status === SiteStatus::Active;
    }

    /**
     * Extract domain from URL if not provided.
     */
    public static function domainFromUrl(string $url): string
    {
        $parsed = parse_url($url);
        $host = $parsed['host'] ?? $url;

        return preg_replace('/^www\./', '', $host);
    }
}
```

### 2. Create SiteStatus enum

**`app/Enums/SiteStatus.php`**
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum SiteStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
    case Deactivated = 'deactivated';
}
```

### 3. Complete SiteWidget model

Replace the stub `app/Models/SiteWidget.php`:

```php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SiteWidget extends Model
{
    protected $fillable = [
        'site_id',
        'product_id',
        'is_enabled',
        'config',
        'enabled_at',
        'disabled_at',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'config' => 'array',
            'enabled_at' => 'datetime',
            'disabled_at' => 'datetime',
        ];
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
```

### 4. Create SiteScript model

**`app/Models/SiteScript.php`**
```php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class SiteScript extends Model
{
    protected $fillable = [
        'site_id',
        'token',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function builds(): HasMany
    {
        return $this->hasMany(SiteScriptBuild::class);
    }

    public static function generateToken(): string
    {
        return Str::random(64);
    }

    public function getScriptTagAttribute(): string
    {
        $cdnUrl = config('services.r2.public_url', 'https://cdn.widgetis.com');

        return sprintf(
            '<script src="%s/loader.js" data-id="%s" async></script>',
            $cdnUrl,
            $this->token,
        );
    }

    public function getScriptUrlAttribute(): string
    {
        $cdnUrl = config('services.r2.public_url', 'https://cdn.widgetis.com');

        return "{$cdnUrl}/loader.js";
    }
}
```

### 5. Create SiteScriptBuild model

**`app/Models/SiteScriptBuild.php`**
```php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SiteScriptBuild extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'site_script_id',
        'version',
        'config',
        'file_url',
        'file_hash',
        'status',
        'built_at',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'config' => 'array',
            'built_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function script(): BelongsTo
    {
        return $this->belongsTo(SiteScript::class, 'site_script_id');
    }
}
```

### 6. Create SiteService

**`app/Services/Site/SiteService.php`**
```php
<?php

declare(strict_types=1);

namespace App\Services\Site;

use App\Enums\SiteStatus;
use App\Models\Plan;
use App\Models\Site;
use App\Models\SiteScript;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SiteService
{
    /**
     * Create a new site for a user. Checks plan limits.
     *
     * @throws \App\Exceptions\PlanLimitExceededException
     */
    public function create(User $user, string $url, string $platform, ?string $name = null): Site
    {
        $this->checkSiteLimit($user);

        $domain = Site::domainFromUrl($url);

        return DB::transaction(function () use ($user, $url, $platform, $name, $domain) {
            $site = Site::create([
                'user_id' => $user->id,
                'name' => $name ?? $domain,
                'domain' => $domain,
                'url' => $url,
                'platform' => $platform,
                'status' => SiteStatus::Pending,
            ]);

            // Auto-create script token
            SiteScript::create([
                'site_id' => $site->id,
                'token' => SiteScript::generateToken(),
                'is_active' => false,
            ]);

            return $site->load('script');
        });
    }

    public function checkSiteLimit(User $user): void
    {
        $plan = $user->currentPlan();
        $maxSites = $plan?->max_sites ?? 1;
        $currentCount = $user->sites()->count();

        if ($currentCount >= $maxSites) {
            throw new \App\Exceptions\PlanLimitExceededException(
                "Site limit reached ({$currentCount}/{$maxSites}). Upgrade your plan.",
            );
        }
    }

    public function checkWidgetLimit(User $user): void
    {
        $plan = $user->currentPlan();
        $maxWidgets = $plan?->max_widgets ?? 2;
        $currentCount = $user->siteWidgets()->where('is_enabled', true)->count();

        if ($currentCount >= $maxWidgets) {
            throw new \App\Exceptions\PlanLimitExceededException(
                "Widget limit reached ({$currentCount}/{$maxWidgets}). Upgrade your plan.",
            );
        }
    }

    /**
     * Get platform-specific installation instructions.
     */
    public function getInstallInstructions(string $platform): array
    {
        return match ($platform) {
            'horoshop' => [
                ['step' => 1, 'title' => 'Open Horoshop admin panel', 'description' => 'Go to your store admin at admin.horoshop.ua'],
                ['step' => 2, 'title' => 'Navigate to Scripts', 'description' => 'Go to Settings → Scripts → Scripts before </body>'],
                ['step' => 3, 'title' => 'Paste the code', 'description' => 'Paste the copied script into the field'],
                ['step' => 4, 'title' => 'Save', 'description' => 'Click Save and wait up to 5 minutes for activation'],
            ],
            'shopify' => [
                ['step' => 1, 'title' => 'Open Shopify admin', 'description' => 'Go to your store admin'],
                ['step' => 2, 'title' => 'Edit theme code', 'description' => 'Go to Online Store → Themes → Edit code'],
                ['step' => 3, 'title' => 'Edit theme.liquid', 'description' => 'Open theme.liquid and paste the script before </body>'],
                ['step' => 4, 'title' => 'Save', 'description' => 'Click Save'],
            ],
            default => [
                ['step' => 1, 'title' => 'Open site admin', 'description' => 'Go to your site admin panel'],
                ['step' => 2, 'title' => 'Find script injection', 'description' => 'Find the section for adding custom scripts'],
                ['step' => 3, 'title' => 'Paste before </body>', 'description' => 'Paste the script before the closing </body> tag'],
                ['step' => 4, 'title' => 'Save', 'description' => 'Save changes'],
            ],
        };
    }
}
```

### 7. Create PlanLimitExceededException

**`app/Exceptions/PlanLimitExceededException.php`**
```php
<?php

declare(strict_types=1);

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\HttpException;

class PlanLimitExceededException extends HttpException
{
    public function __construct(string $message = 'Plan limit exceeded.')
    {
        parent::__construct(403, $message);
    }
}
```

### 8. Create Site Controller

**`app/Http/Controllers/Api/V1/Profile/SiteController.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Api\V1\BaseController;
use App\Models\Site;
use App\Services\Site\SiteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiteController extends BaseController
{
    public function __construct(
        private readonly SiteService $siteService,
    ) {}

    /**
     * GET /api/v1/profile/sites
     */
    public function index(): JsonResponse
    {
        $user = $this->currentUser();
        $sites = $user->sites()->with('script')->orderByDesc('created_at')->get();
        $plan = $user->currentPlan();

        return $this->success([
            'data' => $sites->map(fn (Site $site) => [
                'id' => $site->id,
                'name' => $site->name,
                'domain' => $site->domain,
                'url' => $site->url,
                'platform' => $site->platform,
                'status' => $site->status->value,
                'script_installed' => $site->script_installed,
                'widgets_count' => $site->widgets()->where('is_enabled', true)->count(),
                'connected_at' => $site->connected_at?->toIso8601String(),
                'created_at' => $site->created_at->toIso8601String(),
            ]),
            'limits' => [
                'used' => $sites->count(),
                'max' => $plan?->max_sites ?? 1,
                'plan' => $plan?->slug ?? 'free',
            ],
        ]);
    }

    /**
     * POST /api/v1/profile/sites
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'url' => ['required', 'url', 'max:500'],
            'platform' => ['required', 'string', 'in:horoshop,shopify,woocommerce,opencart,wordpress,other'],
            'name' => ['nullable', 'string', 'max:255'],
        ]);

        $site = $this->siteService->create(
            $this->currentUser(),
            $request->input('url'),
            $request->input('platform'),
            $request->input('name'),
        );

        return $this->created([
            'data' => [
                'id' => $site->id,
                'domain' => $site->domain,
                'status' => $site->status->value,
                'script' => [
                    'token' => $site->script->token,
                    'script_tag' => $site->script->script_tag,
                    'script_url' => $site->script->script_url,
                ],
                'install_instructions' => $this->siteService->getInstallInstructions($site->platform),
            ],
        ]);
    }

    /**
     * GET /api/v1/profile/sites/{id}
     */
    public function show(int $id): JsonResponse
    {
        $site = $this->currentUser()->sites()
            ->with(['script', 'widgets.product'])
            ->findOrFail($id);

        return $this->success([
            'data' => [
                'id' => $site->id,
                'name' => $site->name,
                'domain' => $site->domain,
                'url' => $site->url,
                'platform' => $site->platform,
                'status' => $site->status->value,
                'script_installed' => $site->script_installed,
                'connected_at' => $site->connected_at?->toIso8601String(),
                'script' => $site->script ? [
                    'token' => $site->script->token,
                    'script_tag' => $site->script->script_tag,
                    'is_active' => $site->script->is_active,
                ] : null,
                'widgets' => $site->widgets->map(fn ($w) => [
                    'product_id' => $w->product_id,
                    'name' => $w->product?->translated('name'),
                    'icon' => $w->product?->icon,
                    'is_enabled' => $w->is_enabled,
                    'config' => $w->config,
                ]),
            ],
        ]);
    }

    /**
     * DELETE /api/v1/profile/sites/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $site = $this->currentUser()->sites()->findOrFail($id);
        $site->delete();

        return $this->noContent();
    }

    /**
     * POST /api/v1/profile/sites/{id}/verify
     */
    public function verify(int $id): JsonResponse
    {
        $site = $this->currentUser()->sites()->with('script')->findOrFail($id);

        // TODO: In production, make an HTTP request to the site and check if the script tag exists.
        // For now, mark as verified if script token exists.
        $verified = $site->script !== null;

        if ($verified && !$site->script_installed) {
            $site->update([
                'script_installed' => true,
                'script_installed_at' => now(),
                'status' => 'active',
                'connected_at' => now(),
            ]);
        }

        return $this->success([
            'verified' => $verified,
            'message' => $verified
                ? 'Script verified. Site is now active.'
                : 'Script not found. Please install the script and try again.',
        ]);
    }

    /**
     * GET /api/v1/profile/sites/{id}/script
     */
    public function script(int $id): JsonResponse
    {
        $site = $this->currentUser()->sites()->with('script')->findOrFail($id);

        if (!$site->script) {
            return $this->error('NO_SCRIPT', 'No script generated for this site.', 404);
        }

        return $this->success([
            'data' => [
                'token' => $site->script->token,
                'script_tag' => $site->script->script_tag,
                'script_url' => $site->script->script_url,
                'install_instructions' => $this->siteService->getInstallInstructions($site->platform),
            ],
        ]);
    }

    /**
     * PUT /api/v1/profile/sites/{siteId}/widgets/{productId}
     */
    public function updateWidget(Request $request, int $siteId, int $productId): JsonResponse
    {
        $request->validate([
            'is_enabled' => ['sometimes', 'boolean'],
            'config' => ['sometimes', 'array'],
        ]);

        $site = $this->currentUser()->sites()->findOrFail($siteId);

        // If enabling, check widget limit
        if ($request->input('is_enabled', false)) {
            $this->siteService->checkWidgetLimit($this->currentUser());
        }

        $siteWidget = $site->widgets()->updateOrCreate(
            ['product_id' => $productId],
            array_filter([
                'is_enabled' => $request->input('is_enabled'),
                'config' => $request->input('config'),
                'enabled_at' => $request->input('is_enabled') ? now() : null,
                'disabled_at' => $request->input('is_enabled') === false ? now() : null,
            ], fn ($v) => $v !== null),
        );

        return $this->success([
            'data' => [
                'product_id' => $siteWidget->product_id,
                'is_enabled' => $siteWidget->is_enabled,
                'config' => $siteWidget->config,
            ],
        ]);
    }
}
```

### 9. Register routes

Add to the profile group in `routes/api.php`:

```php
use App\Http\Controllers\Api\V1\Profile\SiteController;

Route::prefix('v1/profile')->middleware(['auth:api', 'role:customer,admin'])->group(function () {
    // Subscription (from Step 10)
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

### 10. Add R2 config placeholder

Add to `config/services.php`:

```php
'r2' => [
    'public_url' => env('R2_PUBLIC_URL', 'https://cdn.widgetis.com'),
],
```

Add to `.env`:
```env
R2_PUBLIC_URL=https://cdn.widgetis.com
```

## How to Verify

```bash
# 1. Login and get a token (via OTP flow)

# 2. Create a site
curl -X POST http://localhost:9002/api/v1/profile/sites \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://myshop.horoshop.ua", "platform": "horoshop"}'
# Should return site with script_tag and install_instructions

# 3. List sites
curl http://localhost:9002/api/v1/profile/sites \
  -H "Authorization: Bearer TOKEN"
# Should show the created site with limits

# 4. Get site detail
curl http://localhost:9002/api/v1/profile/sites/1 \
  -H "Authorization: Bearer TOKEN"
# Should show site with script and widgets

# 5. Get install script
curl http://localhost:9002/api/v1/profile/sites/1/script \
  -H "Authorization: Bearer TOKEN"
# Should return script_tag and instructions

# 6. Verify installation
curl -X POST http://localhost:9002/api/v1/profile/sites/1/verify \
  -H "Authorization: Bearer TOKEN"
# Should return verified: true and activate the site

# 7. Enable a widget on the site
curl -X PUT http://localhost:9002/api/v1/profile/sites/1/widgets/1 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_enabled": true, "config": {"color": "#3B82F6", "position": "top"}}'
# Should return widget config

# 8. Try exceeding site limit (create more sites than plan allows)
# Should return 403 with PlanLimitExceededException
```

## Commit

```
feat: add sites, scripts, and widget configuration API
```
