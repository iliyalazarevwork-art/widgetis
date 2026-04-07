# Step 10 — Subscriptions, Trial & Lifecycle

## Goal
Complete subscription lifecycle: create subscription (trial or paid), change plan with proration,
cancel subscription, handle expiration. No payment integration yet — that will be separate.

## Prerequisites
Steps 01–09 completed. Plans exist and are seeded.

## Actions

### 1. Create Subscription model

**`app/Models/Subscription.php`**
```php
<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\SubscriptionStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    protected $fillable = [
        'user_id',
        'plan_id',
        'billing_period',
        'status',
        'is_trial',
        'trial_ends_at',
        'current_period_start',
        'current_period_end',
        'cancelled_at',
        'cancel_reason',
        'grace_period_ends_at',
        'payment_retry_count',
        'next_payment_retry_at',
        'payment_provider',
        'payment_provider_subscription_id',
    ];

    protected function casts(): array
    {
        return [
            'is_trial' => 'boolean',
            'trial_ends_at' => 'datetime',
            'current_period_start' => 'datetime',
            'current_period_end' => 'datetime',
            'cancelled_at' => 'datetime',
            'grace_period_ends_at' => 'datetime',
            'next_payment_retry_at' => 'datetime',
            'status' => SubscriptionStatus::class,
        ];
    }

    // --- Relations ---

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    // --- Scopes ---

    public function scopeActive($query)
    {
        return $query->whereIn('status', [
            SubscriptionStatus::Active,
            SubscriptionStatus::Trial,
        ]);
    }

    // --- Helpers ---

    public function isActive(): bool
    {
        return in_array($this->status, [
            SubscriptionStatus::Active,
            SubscriptionStatus::Trial,
        ]);
    }

    public function isTrial(): bool
    {
        return $this->status === SubscriptionStatus::Trial;
    }

    public function isCancelled(): bool
    {
        return $this->status === SubscriptionStatus::Cancelled;
    }

    public function isInGracePeriod(): bool
    {
        return $this->status === SubscriptionStatus::PastDue
            && $this->grace_period_ends_at?->isFuture();
    }

    public function daysRemainingInPeriod(): int
    {
        return max(0, (int) now()->diffInDays($this->current_period_end, false));
    }

    public function daysInPeriod(): int
    {
        return max(1, (int) $this->current_period_start->diffInDays($this->current_period_end));
    }
}
```

### 2. Create SubscriptionStatus enum

**`app/Enums/SubscriptionStatus.php`**
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum SubscriptionStatus: string
{
    case Active = 'active';
    case Trial = 'trial';
    case PastDue = 'past_due';
    case Cancelled = 'cancelled';
    case Expired = 'expired';
}
```

### 3. Create BillingPeriod enum

**`app/Enums/BillingPeriod.php`**
```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum BillingPeriod: string
{
    case Monthly = 'monthly';
    case Yearly = 'yearly';
}
```

### 4. Add subscription relation to User

Add to `app/Models/User.php`:

```php
use Illuminate\Database\Eloquent\Relations\HasOne;

public function subscription(): HasOne
{
    return $this->hasOne(Subscription::class);
}

public function activeSubscription(): HasOne
{
    return $this->hasOne(Subscription::class)->active();
}

public function currentPlan(): ?Plan
{
    return $this->subscription?->plan;
}

public function hasActivePlan(): bool
{
    return $this->subscription?->isActive() ?? false;
}
```

### 5. Create SubscriptionService

This is the core service for all subscription operations.

**`app/Services/Billing/SubscriptionService.php`**
```php
<?php

declare(strict_types=1);

namespace App\Services\Billing;

use App\Enums\BillingPeriod;
use App\Enums\SubscriptionStatus;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SubscriptionService
{
    private const TRIAL_DAYS = 7;

    /**
     * Create a trial subscription for a new user.
     */
    public function createTrial(User $user, Plan $plan): Subscription
    {
        return DB::transaction(function () use ($user, $plan) {
            $subscription = Subscription::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'plan_id' => $plan->id,
                    'billing_period' => BillingPeriod::Monthly->value,
                    'status' => SubscriptionStatus::Trial,
                    'is_trial' => true,
                    'trial_ends_at' => now()->addDays(self::TRIAL_DAYS),
                    'current_period_start' => now(),
                    'current_period_end' => now()->addDays(self::TRIAL_DAYS),
                ],
            );

            Log::channel('payments')->info('trial.created', [
                'user_id' => $user->id,
                'plan' => $plan->slug,
                'trial_ends_at' => $subscription->trial_ends_at->toIso8601String(),
            ]);

            return $subscription;
        });
    }

    /**
     * Activate a paid subscription (after payment).
     */
    public function activate(
        User $user,
        Plan $plan,
        BillingPeriod $billingPeriod,
        ?string $paymentProvider = null,
        ?string $providerSubscriptionId = null,
    ): Subscription {
        return DB::transaction(function () use ($user, $plan, $billingPeriod, $paymentProvider, $providerSubscriptionId) {
            $periodEnd = $billingPeriod === BillingPeriod::Yearly
                ? now()->addYear()
                : now()->addMonth();

            $subscription = Subscription::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'plan_id' => $plan->id,
                    'billing_period' => $billingPeriod->value,
                    'status' => SubscriptionStatus::Active,
                    'is_trial' => false,
                    'trial_ends_at' => null,
                    'current_period_start' => now(),
                    'current_period_end' => $periodEnd,
                    'cancelled_at' => null,
                    'cancel_reason' => null,
                    'grace_period_ends_at' => null,
                    'payment_retry_count' => 0,
                    'next_payment_retry_at' => null,
                    'payment_provider' => $paymentProvider,
                    'payment_provider_subscription_id' => $providerSubscriptionId,
                ],
            );

            Log::channel('payments')->info('subscription.activated', [
                'user_id' => $user->id,
                'plan' => $plan->slug,
                'billing_period' => $billingPeriod->value,
                'period_end' => $periodEnd->toIso8601String(),
            ]);

            return $subscription;
        });
    }

    /**
     * Change plan (upgrade or downgrade). Returns proration info.
     */
    public function changePlan(Subscription $subscription, Plan $newPlan): Subscription
    {
        return DB::transaction(function () use ($subscription, $newPlan) {
            $oldPlan = $subscription->plan;

            $subscription->update([
                'plan_id' => $newPlan->id,
            ]);

            Log::channel('payments')->info('subscription.plan_changed', [
                'user_id' => $subscription->user_id,
                'old_plan' => $oldPlan->slug,
                'new_plan' => $newPlan->slug,
            ]);

            return $subscription->fresh('plan');
        });
    }

    /**
     * Calculate proration when changing plans.
     */
    public function calculateProration(Subscription $subscription, Plan $targetPlan): array
    {
        $currentPlan = $subscription->plan;
        $billingPeriod = BillingPeriod::from($subscription->billing_period);

        $currentPrice = $billingPeriod === BillingPeriod::Yearly
            ? (float) $currentPlan->price_yearly / 12
            : (float) $currentPlan->price_monthly;

        $targetPrice = $billingPeriod === BillingPeriod::Yearly
            ? (float) $targetPlan->price_yearly / 12
            : (float) $targetPlan->price_monthly;

        $daysRemaining = $subscription->daysRemainingInPeriod();
        $daysTotal = $subscription->daysInPeriod();
        $proratePercentage = $daysTotal > 0 ? $daysRemaining / $daysTotal : 0;

        $priceDifference = $targetPrice - $currentPrice;
        $amountDueNow = max(0, round($priceDifference * $proratePercentage, 2));

        return [
            'current_plan' => $currentPlan->slug,
            'target_plan' => $targetPlan->slug,
            'price_difference_monthly' => round($priceDifference, 2),
            'days_remaining' => $daysRemaining,
            'days_total' => $daysTotal,
            'prorate_percentage' => round($proratePercentage * 100, 1),
            'amount_due_now' => $amountDueNow,
            'next_billing_amount' => $billingPeriod === BillingPeriod::Yearly
                ? (float) $targetPlan->price_yearly
                : (float) $targetPlan->price_monthly,
            'next_billing_date' => $subscription->current_period_end->toIso8601String(),
        ];
    }

    /**
     * Cancel subscription. Access continues until period end.
     */
    public function cancel(Subscription $subscription, ?string $reason = null): Subscription
    {
        $subscription->update([
            'status' => SubscriptionStatus::Cancelled,
            'cancelled_at' => now(),
            'cancel_reason' => $reason,
        ]);

        Log::channel('payments')->info('subscription.cancelled', [
            'user_id' => $subscription->user_id,
            'plan' => $subscription->plan->slug,
            'access_until' => $subscription->current_period_end->toIso8601String(),
            'reason' => $reason,
        ]);

        return $subscription;
    }

    /**
     * Expire a subscription (called by cron when period ends).
     */
    public function expire(Subscription $subscription): void
    {
        $subscription->update([
            'status' => SubscriptionStatus::Expired,
        ]);

        Log::channel('payments')->info('subscription.expired', [
            'user_id' => $subscription->user_id,
            'plan' => $subscription->plan->slug,
        ]);
    }

    /**
     * Renew an active subscription for next period (called after successful payment).
     */
    public function renew(Subscription $subscription): Subscription
    {
        $billingPeriod = BillingPeriod::from($subscription->billing_period);

        $newPeriodEnd = $billingPeriod === BillingPeriod::Yearly
            ? $subscription->current_period_end->addYear()
            : $subscription->current_period_end->addMonth();

        $subscription->update([
            'status' => SubscriptionStatus::Active,
            'current_period_start' => $subscription->current_period_end,
            'current_period_end' => $newPeriodEnd,
            'grace_period_ends_at' => null,
            'payment_retry_count' => 0,
            'next_payment_retry_at' => null,
        ]);

        Log::channel('payments')->info('subscription.renewed', [
            'user_id' => $subscription->user_id,
            'plan' => $subscription->plan->slug,
            'new_period_end' => $newPeriodEnd->toIso8601String(),
        ]);

        return $subscription;
    }
}
```

### 6. Create SubscriptionResource

**`app/Http/Resources/Api/V1/SubscriptionResource.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'plan' => new PlanResource($this->whenLoaded('plan')),
            'billing_period' => $this->billing_period,
            'status' => $this->status->value,
            'is_trial' => $this->is_trial,
            'trial_ends_at' => $this->trial_ends_at?->toIso8601String(),
            'current_period_start' => $this->current_period_start->toIso8601String(),
            'current_period_end' => $this->current_period_end->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'days_remaining' => $this->daysRemainingInPeriod(),
        ];
    }
}
```

### 7. Create Subscription Controller (profile)

**`app/Http/Controllers/Api/V1/Profile/SubscriptionController.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Resources\Api\V1\PlanResource;
use App\Http\Resources\Api\V1\SubscriptionResource;
use App\Models\Plan;
use App\Services\Billing\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends BaseController
{
    public function __construct(
        private readonly SubscriptionService $subscriptionService,
    ) {}

    /**
     * GET /api/v1/profile/subscription
     */
    public function show(): JsonResponse
    {
        $user = $this->currentUser();
        $subscription = $user->subscription?->load('plan');

        if (!$subscription) {
            return $this->error('NO_SUBSCRIPTION', 'No active subscription.', 404);
        }

        $plan = $subscription->plan;

        return $this->success([
            'data' => new SubscriptionResource($subscription),
            'limits' => [
                'widgets_used' => $user->siteWidgets()->count(),
                'widgets_max' => $plan->max_widgets,
                'sites_used' => $user->sites()->count(),
                'sites_max' => $plan->max_sites,
            ],
        ]);
    }

    /**
     * GET /api/v1/profile/subscription/prorate?target_plan_slug=max
     */
    public function prorate(Request $request): JsonResponse
    {
        $request->validate([
            'target_plan_slug' => ['required', 'string', 'exists:plans,slug'],
        ]);

        $subscription = $this->currentUser()->subscription;

        if (!$subscription) {
            return $this->error('NO_SUBSCRIPTION', 'No active subscription.', 404);
        }

        $targetPlan = Plan::where('slug', $request->input('target_plan_slug'))->firstOrFail();
        $proration = $this->subscriptionService->calculateProration($subscription, $targetPlan);

        return $this->success(['data' => $proration]);
    }

    /**
     * POST /api/v1/profile/subscription/change
     */
    public function change(Request $request): JsonResponse
    {
        $request->validate([
            'plan_slug' => ['required', 'string', 'exists:plans,slug'],
        ]);

        $subscription = $this->currentUser()->subscription;

        if (!$subscription) {
            return $this->error('NO_SUBSCRIPTION', 'No active subscription.', 404);
        }

        $newPlan = Plan::where('slug', $request->input('plan_slug'))->firstOrFail();
        $updated = $this->subscriptionService->changePlan($subscription, $newPlan);

        return $this->success([
            'data' => new SubscriptionResource($updated->load('plan')),
        ]);
    }

    /**
     * POST /api/v1/profile/subscription/cancel
     */
    public function cancel(Request $request): JsonResponse
    {
        $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $subscription = $this->currentUser()->subscription;

        if (!$subscription || !$subscription->isActive()) {
            return $this->error('NO_ACTIVE_SUBSCRIPTION', 'No active subscription to cancel.', 404);
        }

        $cancelled = $this->subscriptionService->cancel(
            $subscription,
            $request->input('reason'),
        );

        return $this->success([
            'data' => new SubscriptionResource($cancelled->load('plan')),
            'message' => 'Subscription cancelled. Access continues until ' . $cancelled->current_period_end->toDateString(),
        ]);
    }
}
```

### 8. Add relations to User for widget counting

Add to `app/Models/User.php`:

```php
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

public function sites(): HasMany
{
    return $this->hasMany(Site::class);
}

public function siteWidgets(): HasManyThrough
{
    return $this->hasManyThrough(SiteWidget::class, Site::class);
}
```

Note: `Site` and `SiteWidget` models don't exist yet. Create stub models for now — they will be completed in Step 11.

**`app/Models/Site.php`** (stub):
```php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Site extends Model
{
    protected $fillable = ['user_id', 'name', 'domain', 'url', 'platform', 'status'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

**`app/Models/SiteWidget.php`** (stub):
```php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SiteWidget extends Model
{
    protected $fillable = ['site_id', 'product_id', 'is_enabled', 'config'];

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }
}
```

### 9. Register routes

Add to `routes/api.php` inside the profile group:

```php
Route::prefix('v1/profile')->middleware(['auth:api', 'role:customer,admin'])->group(function () {
    Route::get('subscription', [SubscriptionController::class, 'show']);
    Route::get('subscription/prorate', [SubscriptionController::class, 'prorate']);
    Route::post('subscription/change', [SubscriptionController::class, 'change']);
    Route::post('subscription/cancel', [SubscriptionController::class, 'cancel']);
});
```

Add the import:
```php
use App\Http\Controllers\Api\V1\Profile\SubscriptionController;
```

## How to Verify

```bash
# 1. Fresh seed
docker compose -f docker-compose.dev.yml exec backend php artisan migrate:fresh --seed

# 2. Create a user and give them a trial subscription via tinker
docker compose -f docker-compose.dev.yml exec backend php artisan tinker --execute="\
  \$user = \App\Models\User::where('email', 'admin@widgetis.com')->first(); \
  \$plan = \App\Models\Plan::where('slug', 'pro')->first(); \
  \$sub = app(\App\Services\Billing\SubscriptionService::class)->createTrial(\$user, \$plan); \
  echo 'Trial created: ' . \$sub->status->value . ' until ' . \$sub->trial_ends_at;"

# 3. Login as admin and check subscription
# (first get a JWT token via OTP flow, then):
curl http://localhost:9002/api/v1/profile/subscription \
  -H "Authorization: Bearer YOUR_TOKEN"
# Should return subscription with plan info and limits

# 4. Check proration for upgrade to max
curl "http://localhost:9002/api/v1/profile/subscription/prorate?target_plan_slug=max" \
  -H "Authorization: Bearer YOUR_TOKEN"
# Should return proration calculation

# 5. Cancel subscription
curl -X POST http://localhost:9002/api/v1/profile/subscription/cancel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "testing"}'
# Should return cancelled subscription with access_until date

# 6. Check payment log
docker compose -f docker-compose.dev.yml exec backend cat storage/logs/payments.log | tail -10
# Should show trial.created, subscription.cancelled events
```

## Commit

```
feat: add subscription model, service, and profile API
```
