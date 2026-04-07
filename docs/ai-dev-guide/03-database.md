# Step 03 — Database and Migrations

## Goal
All project tables are created, migrations work, `migrate:fresh` passes cleanly.
Every status/type column defaults to the correct enum value.

## Prerequisites
Steps 01–02 completed. Enums exist in `app/Enums/`.

## Important: Enum usage in migrations

For every column that represents a status, type, or fixed set of values:
- Use `$table->string('column', N)` (not DB-level enum — better for portability)
- Set the default using the PHP enum: `->default(EnumName::Value->value)`
- Add a comment listing valid values for clarity

Example:
```php
use App\Enums\SubscriptionStatus;

$table->string('status', 20)->default(SubscriptionStatus::Active->value);
// Valid: active, trial, past_due, cancelled, expired
```

## Actions

### 1. Delete the default Laravel migrations

Delete ALL files from `database/migrations/` — we will create our own.

### 2. Create migrations

Create migrations **in this order**. Use timestamps in filenames so they run sequentially
(e.g., `0001_01_01_000001_`, `0001_01_01_000002_`, etc.).

Add these imports at the top of each migration that uses enums:
```php
use App\Enums\SubscriptionStatus;
use App\Enums\OrderStatus;
// ... etc.
```

#### 2.1 users

```php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name')->nullable();
    $table->string('email')->unique();
    $table->string('phone', 20)->nullable()->unique();
    $table->string('password')->nullable();
    $table->string('avatar_url', 500)->nullable();
    $table->string('telegram', 100)->nullable();
    $table->string('company')->nullable();
    $table->string('locale', 2)->default('uk');
    $table->string('timezone', 50)->default('Europe/Kyiv');
    $table->timestamp('onboarding_completed_at')->nullable();
    $table->timestamp('email_verified_at')->nullable();
    $table->timestamp('phone_verified_at')->nullable();
    $table->boolean('two_factor_enabled')->default(false);
    $table->string('two_factor_method', 20)->default('email');
    $table->boolean('notification_enabled')->default(true);
    $table->timestamps();
    $table->softDeletes();
});
```

#### 2.2 password_reset_tokens

```php
Schema::create('password_reset_tokens', function (Blueprint $table) {
    $table->string('email')->primary();
    $table->string('token');
    $table->timestamp('created_at')->nullable();
});
```

#### 2.3 sessions

```php
Schema::create('sessions', function (Blueprint $table) {
    $table->string('id')->primary();
    $table->foreignId('user_id')->nullable()->index();
    $table->string('ip_address', 45)->nullable();
    $table->text('user_agent')->nullable();
    $table->longText('payload');
    $table->integer('last_activity')->index();
});
```

#### 2.4 cache + cache_locks

```php
Schema::create('cache', function (Blueprint $table) {
    $table->string('key')->primary();
    $table->mediumText('value');
    $table->integer('expiration');
});

Schema::create('cache_locks', function (Blueprint $table) {
    $table->string('key')->primary();
    $table->string('owner');
    $table->integer('expiration');
});
```

#### 2.5 jobs + job_batches + failed_jobs

```php
Schema::create('jobs', function (Blueprint $table) {
    $table->id();
    $table->string('queue')->index();
    $table->longText('payload');
    $table->unsignedTinyInteger('attempts');
    $table->unsignedInteger('reserved_at')->nullable();
    $table->unsignedInteger('available_at');
    $table->unsignedInteger('created_at');
});

Schema::create('job_batches', function (Blueprint $table) {
    $table->string('id')->primary();
    $table->string('name');
    $table->integer('total_jobs');
    $table->integer('pending_jobs');
    $table->integer('failed_jobs');
    $table->longText('failed_job_ids');
    $table->mediumText('options')->nullable();
    $table->integer('cancelled_at')->nullable();
    $table->integer('created_at');
    $table->integer('finished_at')->nullable();
});

Schema::create('failed_jobs', function (Blueprint $table) {
    $table->id();
    $table->string('uuid')->unique();
    $table->text('connection');
    $table->text('queue');
    $table->longText('payload');
    $table->longText('exception');
    $table->timestamp('failed_at')->useCurrent();
});
```

#### 2.6 social_accounts

```php
Schema::create('social_accounts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('provider', 50);    // google, facebook, etc.
    $table->string('provider_id');
    $table->text('provider_token')->nullable();
    $table->text('provider_refresh_token')->nullable();
    $table->timestamps();
    $table->unique(['provider', 'provider_id']);
});
```

#### 2.7 plans

```php
Schema::create('plans', function (Blueprint $table) {
    $table->id();
    $table->string('slug', 50)->unique();
    $table->jsonb('name');
    $table->jsonb('description')->nullable();
    $table->decimal('price_monthly', 10, 2)->default(0);
    $table->decimal('price_yearly', 10, 2)->default(0);
    $table->integer('max_sites')->default(1);
    $table->integer('max_widgets')->default(2);
    $table->jsonb('features')->default('[]');
    $table->boolean('is_recommended')->default(false);
    $table->integer('sort_order')->default(0);
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});
```

#### 2.8 plan_features + plan_feature_values

```php
Schema::create('plan_features', function (Blueprint $table) {
    $table->id();
    $table->string('feature_key', 100);
    $table->jsonb('name');
    $table->string('category', 50);
    $table->integer('sort_order')->default(0);
    $table->timestamps();
});

Schema::create('plan_feature_values', function (Blueprint $table) {
    $table->id();
    $table->foreignId('plan_id')->constrained()->cascadeOnDelete();
    $table->foreignId('plan_feature_id')->constrained()->cascadeOnDelete();
    $table->jsonb('value');
    $table->unique(['plan_id', 'plan_feature_id']);
});
```

#### 2.9 widget_tags

```php
Schema::create('widget_tags', function (Blueprint $table) {
    $table->string('slug', 50)->primary();
    $table->jsonb('name');
    $table->string('color', 7);
    $table->integer('sort_order')->default(0);
    $table->timestamps();
});
```

#### 2.10 products

```php
use App\Enums\ProductStatus;
use App\Enums\Platform;

Schema::create('products', function (Blueprint $table) {
    $table->id();
    $table->string('slug', 100)->unique();
    $table->jsonb('name');
    $table->jsonb('description');
    $table->jsonb('long_description')->nullable();
    $table->jsonb('features')->nullable();
    $table->string('icon', 50);
    $table->string('tag_slug', 50)->nullable();
    $table->string('platform', 30)->default(Platform::Horoshop->value);
    $table->string('status', 20)->default(ProductStatus::Active->value);
    $table->boolean('is_popular')->default(false);
    $table->boolean('is_new')->default(false);
    $table->string('preview_before', 500)->nullable();
    $table->string('preview_after', 500)->nullable();
    $table->string('builder_module', 100)->nullable();
    $table->jsonb('config_schema')->nullable();
    $table->integer('sort_order')->default(0);
    $table->timestamps();
    $table->foreign('tag_slug')->references('slug')->on('widget_tags')->nullOnDelete();
});
```

#### 2.11 product_plan_access

```php
Schema::create('product_plan_access', function (Blueprint $table) {
    $table->id();
    $table->foreignId('product_id')->constrained()->cascadeOnDelete();
    $table->foreignId('plan_id')->constrained()->cascadeOnDelete();
    $table->unique(['product_id', 'plan_id']);
});
```

#### 2.12 subscriptions

```php
use App\Enums\SubscriptionStatus;
use App\Enums\BillingPeriod;

Schema::create('subscriptions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('plan_id')->constrained();
    $table->string('billing_period', 10)->default(BillingPeriod::Monthly->value);
    $table->string('status', 20)->default(SubscriptionStatus::Active->value);
    $table->boolean('is_trial')->default(false);
    $table->timestamp('trial_ends_at')->nullable();
    $table->timestamp('current_period_start');
    $table->timestamp('current_period_end');
    $table->timestamp('cancelled_at')->nullable();
    $table->text('cancel_reason')->nullable();
    $table->timestamp('grace_period_ends_at')->nullable();
    $table->integer('payment_retry_count')->default(0);
    $table->timestamp('next_payment_retry_at')->nullable();
    $table->string('payment_provider', 20)->nullable();
    $table->string('payment_provider_subscription_id')->nullable();
    $table->timestamps();
    $table->unique('user_id');
});
```

#### 2.13 orders

```php
use App\Enums\OrderStatus;

Schema::create('orders', function (Blueprint $table) {
    $table->id();
    $table->string('order_number', 20)->unique();
    $table->foreignId('user_id')->constrained();
    $table->foreignId('plan_id')->constrained();
    $table->string('billing_period', 10);
    $table->decimal('amount', 10, 2);
    $table->decimal('discount_amount', 10, 2)->default(0);
    $table->string('currency', 3)->default('UAH');
    $table->string('status', 20)->default(OrderStatus::Pending->value);
    $table->string('payment_provider', 20)->nullable();
    $table->string('payment_method', 50)->nullable();
    $table->string('transaction_id')->nullable();
    $table->timestamp('paid_at')->nullable();
    $table->timestamp('refunded_at')->nullable();
    $table->jsonb('notes')->nullable();
    $table->timestamps();
});
```

#### 2.14 payments

```php
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;

Schema::create('payments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained();
    $table->foreignId('order_id')->nullable()->constrained();
    $table->foreignId('subscription_id')->nullable()->constrained();
    $table->string('type', 20);   // PaymentType enum
    $table->decimal('amount', 10, 2);
    $table->string('currency', 3)->default('UAH');
    $table->string('status', 20)->default(PaymentStatus::Pending->value);
    $table->string('payment_provider', 20)->nullable();
    $table->string('payment_method', 50)->nullable();
    $table->string('transaction_id')->nullable();
    $table->jsonb('description')->nullable();
    $table->jsonb('metadata')->nullable();
    $table->timestamps();
});
```

#### 2.15 sites

```php
use App\Enums\SiteStatus;
use App\Enums\Platform;

Schema::create('sites', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('name')->nullable();
    $table->string('domain');
    $table->string('url', 500);
    $table->string('platform', 30)->default(Platform::Horoshop->value);
    $table->string('status', 20)->default(SiteStatus::Pending->value);
    $table->boolean('script_installed')->default(false);
    $table->timestamp('script_installed_at')->nullable();
    $table->timestamp('connected_at')->nullable();
    $table->timestamp('deactivated_at')->nullable();
    $table->timestamps();
    $table->unique(['domain', 'user_id']);
});
```

#### 2.16 site_scripts

```php
Schema::create('site_scripts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('site_id')->constrained()->cascadeOnDelete();
    $table->string('token', 64)->unique();
    $table->boolean('is_active')->default(false);
    $table->timestamps();
    $table->unique('site_id');
});
```

#### 2.17 site_script_builds

```php
use App\Enums\ScriptBuildStatus;

Schema::create('site_script_builds', function (Blueprint $table) {
    $table->id();
    $table->foreignId('site_script_id')->constrained()->cascadeOnDelete();
    $table->integer('version');
    $table->jsonb('config');
    $table->string('file_url', 500);
    $table->string('file_hash', 64)->nullable();
    $table->string('status', 20)->default(ScriptBuildStatus::Active->value);
    $table->timestamp('built_at');
    $table->timestamp('created_at');
});
```

#### 2.18 site_widgets

```php
Schema::create('site_widgets', function (Blueprint $table) {
    $table->id();
    $table->foreignId('site_id')->constrained()->cascadeOnDelete();
    $table->foreignId('product_id')->constrained()->cascadeOnDelete();
    $table->boolean('is_enabled')->default(true);
    $table->jsonb('config')->nullable();
    $table->timestamp('enabled_at')->nullable();
    $table->timestamp('disabled_at')->nullable();
    $table->timestamps();
    $table->unique(['site_id', 'product_id']);
});
```

#### 2.19 customer_cases

```php
Schema::create('customer_cases', function (Blueprint $table) {
    $table->id();
    $table->string('store');
    $table->string('store_url', 500);
    $table->string('store_logo_url', 500)->nullable();
    $table->string('owner')->nullable();
    $table->string('platform', 30)->nullable();
    $table->jsonb('description')->nullable();
    $table->text('review_text')->nullable();
    $table->smallInteger('review_rating')->nullable();
    $table->jsonb('screenshot_urls')->nullable();
    $table->jsonb('widgets')->nullable();
    $table->boolean('is_published')->default(false);
    $table->integer('sort_order')->default(0);
    $table->timestamps();
    $table->softDeletes();
});
```

#### 2.20 consultations

```php
use App\Enums\LeadStatus;

Schema::create('consultations', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('phone', 20)->nullable();
    $table->string('email')->nullable();
    $table->timestamp('preferred_at')->nullable();
    $table->string('status', 20)->default(LeadStatus::New->value);
    $table->text('notes')->nullable();
    $table->timestamps();
});
```

#### 2.21 manager_requests

```php
use App\Enums\LeadStatus;
use App\Enums\ManagerRequestType;

Schema::create('manager_requests', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->nullable()->constrained();
    $table->foreignId('site_id')->nullable()->constrained();
    $table->string('type', 30)->default(ManagerRequestType::InstallHelp->value);
    $table->string('messenger', 30)->nullable();
    $table->string('email')->nullable();
    $table->string('phone', 20)->nullable();
    $table->jsonb('widgets')->nullable();
    $table->text('message')->nullable();
    $table->string('status', 20)->default(LeadStatus::New->value);
    $table->text('notes')->nullable();
    $table->timestamps();
    $table->softDeletes();
});
```

#### 2.22 reviews

```php
use App\Enums\ReviewStatus;

Schema::create('reviews', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained();
    $table->smallInteger('rating');
    $table->string('title')->nullable();
    $table->text('body');
    $table->string('status', 20)->default(ReviewStatus::Pending->value);
    $table->timestamps();
});
```

#### 2.23 demo_sessions

```php
Schema::create('demo_sessions', function (Blueprint $table) {
    $table->id();
    $table->string('code', 8)->unique();
    $table->string('domain');
    $table->jsonb('config');
    $table->foreignId('created_by')->nullable()->constrained('users');
    $table->integer('view_count')->default(0);
    $table->timestamp('expires_at');
    $table->timestamps();
});
```

#### 2.24 notifications

```php
Schema::create('notifications', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('type', 50);   // NotificationType enum
    $table->jsonb('title');
    $table->jsonb('body');
    $table->jsonb('data')->nullable();
    $table->boolean('is_read')->default(false);
    $table->timestamp('read_at')->nullable();
    $table->timestamp('created_at');
    $table->index(['user_id', 'is_read']);
    $table->index(['user_id', 'created_at']);
});
```

#### 2.25 activity_log

```php
Schema::create('activity_log', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->nullable()->constrained();
    $table->string('action', 100);
    $table->string('entity_type', 50)->nullable();
    $table->unsignedBigInteger('entity_id')->nullable();
    $table->jsonb('description')->nullable();
    $table->jsonb('metadata')->nullable();
    $table->timestamp('created_at');
    $table->index(['user_id', 'created_at']);
});
```

#### 2.26 faq_items

```php
Schema::create('faq_items', function (Blueprint $table) {
    $table->id();
    $table->string('category', 50);
    $table->jsonb('question');
    $table->jsonb('answer');
    $table->integer('sort_order')->default(0);
    $table->boolean('is_published')->default(true);
    $table->timestamps();
});
```

### 3. Run migrations

```bash
docker compose -f docker-compose.dev.yml exec backend php artisan migrate
```

## How to Verify

```bash
# All migrations passed
docker compose -f docker-compose.dev.yml exec backend php artisan migrate:status
# Each should show [Ran]

# migrate:fresh runs without errors
docker compose -f docker-compose.dev.yml exec backend php artisan migrate:fresh
# Should pass cleanly

# Check the number of tables (should be ~30+)
docker compose -f docker-compose.dev.yml exec backend php artisan tinker \
  --execute="echo count(DB::select(\"SELECT tablename FROM pg_tables WHERE schemaname = 'public'\"));"

# Spot-check: subscriptions table has correct default
docker compose -f docker-compose.dev.yml exec backend php artisan tinker \
  --execute="echo \Illuminate\Support\Facades\Schema::getColumnDefault('subscriptions', 'status');"
# Expected: active
```

## Commit

```bash
git add -A
git commit -m "feat: add all database migrations (26 tables) with enum defaults"
git push origin main
```
