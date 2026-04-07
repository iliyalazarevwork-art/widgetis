# Step 08 — Spatie Settings & Public Settings API

## Goal
Global site settings (phone, email, socials, messengers, business hours) stored via Spatie Settings.
Public API endpoint returns settings. Filament settings page prepared for later.

## Prerequisites
Steps 01–07 completed.

## Actions

### 1. Install Spatie Settings

```bash
docker compose -f docker-compose.dev.yml exec backend composer require \
  spatie/laravel-settings:^3.7
docker compose -f docker-compose.dev.yml exec backend php artisan vendor:publish --provider="Spatie\LaravelSettings\LaravelSettingsServiceProvider" --tag="migrations"
docker compose -f docker-compose.dev.yml exec backend php artisan migrate
```

### 2. Create GeneralSettings class

**`app/Settings/GeneralSettings.php`**
```php
<?php

declare(strict_types=1);

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class GeneralSettings extends Settings
{
    public string $phone;
    public string $email;
    public string $business_hours;
    public array $socials;       // ['instagram' => '...', 'telegram' => '...', 'facebook' => '...']
    public array $messengers;    // ['telegram' => '...', 'viber' => '...', 'whatsapp' => '...']
    public array $stats;         // ['stores_count' => 120, 'widgets_deployed' => 530]

    public static function group(): string
    {
        return 'general';
    }
}
```

### 3. Create settings migration

**`database/settings/0001_01_01_000001_create_general_settings.php`**
```php
<?php

declare(strict_types=1);

use Spatie\LaravelSettings\Migrations\SettingsMigration;

class CreateGeneralSettings extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('general.phone', '+380 96 149 47 47');
        $this->migrator->add('general.email', 'hello@widgetis.com');
        $this->migrator->add('general.business_hours', 'Mon-Fri 9:00-20:00');
        $this->migrator->add('general.socials', [
            'instagram' => 'https://instagram.com/widgetis',
            'telegram' => 'https://t.me/widgetis',
            'facebook' => '',
        ]);
        $this->migrator->add('general.messengers', [
            'telegram' => 'https://t.me/widgetis_support',
            'viber' => '',
            'whatsapp' => '',
        ]);
        $this->migrator->add('general.stats', [
            'stores_count' => 120,
            'widgets_deployed' => 530,
        ]);
    }
}
```

Run: 
```bash
docker compose -f docker-compose.dev.yml exec backend php artisan migrate
```

### 4. Register settings class

Edit `config/settings.php` — add to the `settings` array (or create the file if it doesn't exist after vendor:publish):

```php
'settings' => [
    \App\Settings\GeneralSettings::class,
],
```

### 5. Create Settings Controller

**`app/Http/Controllers/Api/V1/Public/SettingsController.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Api\V1\BaseController;
use App\Settings\GeneralSettings;
use Illuminate\Http\JsonResponse;

class SettingsController extends BaseController
{
    public function index(GeneralSettings $settings): JsonResponse
    {
        return $this->success([
            'data' => [
                'phone' => $settings->phone,
                'email' => $settings->email,
                'business_hours' => $settings->business_hours,
                'socials' => $settings->socials,
                'messengers' => $settings->messengers,
                'stats' => $settings->stats,
            ],
        ]);
    }
}
```

### 6. Register route

Add to `routes/api.php` in the public v1 group:

```php
Route::get('settings', [\App\Http\Controllers\Api\V1\Public\SettingsController::class, 'index']);
```

## How to Verify

```bash
# 1. Get settings
curl http://localhost:9002/api/v1/settings
# Should return JSON with phone, email, socials, messengers, stats

# 2. Verify data is correct
curl -s http://localhost:9002/api/v1/settings | python3 -m json.tool
# Should show formatted JSON with all fields populated

# 3. Verify settings can be updated via tinker
docker compose -f docker-compose.dev.yml exec backend php artisan tinker --execute="\
  \$s = app(\App\Settings\GeneralSettings::class); \
  \$s->phone = '+380 99 999 99 99'; \
  \$s->save(); \
  echo \$s->phone;"
# Should show the new phone number

# 4. Verify API reflects the change
curl -s http://localhost:9002/api/v1/settings | grep phone
```

## Commit

```
feat: add Spatie Settings with public settings API
```
