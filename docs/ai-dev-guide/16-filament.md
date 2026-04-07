# Step 15 — Filament Admin Panel

## Goal
Filament 5 admin panel at `/admin` with login, dashboard, and CRUD resources for all entities.
Admin accesses via web browser (session auth), not JWT.

## Prerequisites
Steps 01–14 completed. All models exist.

## Actions

### 1. Install Filament

```bash
docker compose -f docker-compose.dev.yml exec backend composer require filament/filament:^5.0
docker compose -f docker-compose.dev.yml exec backend php artisan filament:install --panels
```

### 2. Configure Filament panel

Edit `app/Providers/Filament/AdminPanelProvider.php`:

```php
public function panel(Panel $panel): Panel
{
    return $panel
        ->default()
        ->id('admin')
        ->path('admin')
        ->login()
        ->colors([
            'primary' => '#3B82F6',
        ])
        ->discoverResources(in: app_path('Filament/Resources'), for: 'App\\Filament\\Resources')
        ->discoverPages(in: app_path('Filament/Pages'), for: 'App\\Filament\\Pages')
        ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\\Filament\\Widgets')
        ->middleware([
            \Illuminate\Cookie\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ])
        ->authMiddleware([
            \Filament\Http\Middleware\Authenticate::class,
        ]);
}
```

### 3. Make User compatible with Filament

Add to `app/Models/User.php`:

```php
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;

class User extends Authenticatable implements JWTSubject, FilamentUser
{
    // ... existing code ...

    public function canAccessPanel(Panel $panel): bool
    {
        return $this->isAdmin() && $this->hasVerifiedEmail();
    }
}
```

### 4. Create Filament Resources

Use Filament's generator for each model:

```bash
docker compose -f docker-compose.dev.yml exec backend php artisan make:filament-resource Order --generate
docker compose -f docker-compose.dev.yml exec backend php artisan make:filament-resource User --generate --soft-deletes
docker compose -f docker-compose.dev.yml exec backend php artisan make:filament-resource Plan --generate
docker compose -f docker-compose.dev.yml exec backend php artisan make:filament-resource Product --generate
docker compose -f docker-compose.dev.yml exec backend php artisan make:filament-resource Subscription --generate
docker compose -f docker-compose.dev.yml exec backend php artisan make:filament-resource Site --generate
docker compose -f docker-compose.dev.yml exec backend php artisan make:filament-resource CustomerCase --generate --soft-deletes
docker compose -f docker-compose.dev.yml exec backend php artisan make:filament-resource DemoSession --generate
docker compose -f docker-compose.dev.yml exec backend php artisan make:filament-resource Consultation --generate
docker compose -f docker-compose.dev.yml exec backend php artisan make:filament-resource ManagerRequest --generate --soft-deletes
docker compose -f docker-compose.dev.yml exec backend php artisan make:filament-resource Review --generate
docker compose -f docker-compose.dev.yml exec backend php artisan make:filament-resource FaqItem --generate
```

### 5. Customize each resource

After generation, customize the form and table columns for each resource.
Focus on the most important fields and add filters/actions.

Key customizations per resource:
- **OrderResource:** status badges, refund action, filter by status
- **UserResource:** role badges, block action, filter by plan
- **PlanResource:** price formatting, feature editor
- **ProductResource:** translatable name/description, tag select, icon input
- **SubscriptionResource:** status badges, plan select, trial badge
- **SiteResource:** domain link, status badge, script installed indicator
- **CustomerCaseResource:** published toggle, image uploads
- **DemoSessionResource:** code display, expiry date, view count
- **ConsultationResource:** status select, notes editor
- **ManagerRequestResource:** status workflow, messenger display
- **ReviewResource:** approve/reject actions, rating stars
- **FaqItemResource:** category filter, sortable, published toggle

### 6. Create Dashboard Widgets

**`app/Filament/Widgets/StatsOverview.php`**
```php
<?php

declare(strict_types=1);

namespace App\Filament\Widgets;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Site;
use App\Models\Subscription;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverview extends StatsOverviewWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Active Subscriptions', Subscription::active()->count()),
            Stat::make('Active Sites', Site::where('status', 'active')->count()),
            Stat::make('Revenue (UAH)', number_format((float) Payment::where('status', 'success')->where('type', 'charge')->sum('amount'), 0, '.', ',')),
            Stat::make('Orders', Order::count()),
        ];
    }
}
```

### 7. Install Spatie Settings plugin for Filament

```bash
docker compose -f docker-compose.dev.yml exec backend composer require filament/spatie-laravel-settings-plugin:^5.0
```

Create settings page:

**`app/Filament/Pages/ManageGeneralSettings.php`**
```php
<?php

declare(strict_types=1);

namespace App\Filament\Pages;

use App\Settings\GeneralSettings;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Pages\SettingsPage;

class ManageGeneralSettings extends SettingsPage
{
    protected static ?string $navigationIcon = 'heroicon-o-cog-6-tooth';
    protected static string $settings = GeneralSettings::class;
    protected static ?string $navigationGroup = 'Settings';

    public function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('phone')->required(),
            Forms\Components\TextInput::make('email')->email()->required(),
            Forms\Components\TextInput::make('business_hours'),
            Forms\Components\KeyValue::make('socials'),
            Forms\Components\KeyValue::make('messengers'),
            Forms\Components\KeyValue::make('stats'),
        ]);
    }
}
```

## How to Verify

```bash
# 1. Ensure admin has a password for Filament login
docker compose -f docker-compose.dev.yml exec backend php artisan tinker --execute="\
  \$u = \App\Models\User::where('email', 'admin@widgetis.com')->first(); \
  \$u->password = bcrypt('admin123'); \
  \$u->save(); \
  echo 'Password set';"

# 2. Open browser
# Navigate to http://localhost:9002/admin
# Login with admin@widgetis.com / admin123

# 3. Verify:
# - Dashboard shows stats widgets
# - Navigation sidebar has all resources
# - Can view/edit orders, users, plans, products, etc.
# - Settings page shows GeneralSettings form
```

## Commit

```
feat: add Filament admin panel with resources and dashboard
```
