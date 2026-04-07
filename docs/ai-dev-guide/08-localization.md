# Step 07 — Localization & Translatable Models

## Goal
Multi-language support (uk/en) working end-to-end.
Translatable models return content in the language from `Accept-Language` header.
Default locale: `uk`. Fallback: `en`.

## Prerequisites
Steps 01–06 completed.

## Actions

### 1. Install Spatie Translatable

```bash
docker compose -f docker-compose.dev.yml exec backend composer require spatie/laravel-translatable:^6.0
```

No migration needed — this package works with jsonb columns already in the schema.

### 2. Configure app locale

Edit `config/app.php`:

```php
'locale' => 'uk',
'fallback_locale' => 'en',
'faker_locale' => 'uk_UA',
```

### 3. Create a Translatable base model

This base model provides consistent translation handling.

**`app/Models/Concerns/HasTranslations.php`**
```php
<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use Spatie\Translatable\HasTranslations as SpatieHasTranslations;

trait HasTranslations
{
    use SpatieHasTranslations;

    /**
     * Get translation for current app locale, falling back to 'en'.
     */
    public function translated(string $attribute): ?string
    {
        return $this->getTranslation($attribute, app()->getLocale())
            ?: $this->getTranslation($attribute, 'en');
    }

    /**
     * Get all translations for an attribute.
     * Returns: {"en": "...", "uk": "..."}
     */
    public function allTranslations(string $attribute): array
    {
        return $this->getTranslations($attribute);
    }
}
```

### 4. Create a sample translatable model (Plan)

This demonstrates the pattern. All models with jsonb translated fields will follow this.

**`app/Models/Plan.php`**
```php
<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    use HasTranslations;

    public array $translatable = ['name', 'description'];

    protected $fillable = [
        'slug',
        'name',
        'description',
        'price_monthly',
        'price_yearly',
        'max_sites',
        'max_widgets',
        'features',
        'is_recommended',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'name' => 'array',
            'description' => 'array',
            'features' => 'array',
            'price_monthly' => 'decimal:2',
            'price_yearly' => 'decimal:2',
            'is_recommended' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}
```

### 5. Create API Resource with locale-aware output

**`app/Http/Resources/Api/V1/PlanResource.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->translated('name'),
            'description' => $this->translated('description'),
            'price_monthly' => (float) $this->price_monthly,
            'price_yearly' => (float) $this->price_yearly,
            'max_sites' => $this->max_sites,
            'max_widgets' => $this->max_widgets,
            'features' => $this->features,
            'is_recommended' => $this->is_recommended,
        ];
    }
}
```

### 6. Create Plan seeder

**`database/seeders/PlanSeeder.php`**
```php
<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'slug' => 'free',
                'name' => ['en' => 'Free', 'uk' => 'Безкоштовний'],
                'description' => ['en' => 'Get started for free', 'uk' => 'Почніть безкоштовно'],
                'price_monthly' => 0,
                'price_yearly' => 0,
                'max_sites' => 1,
                'max_widgets' => 2,
                'features' => [],
                'is_recommended' => false,
                'sort_order' => 0,
            ],
            [
                'slug' => 'basic',
                'name' => ['en' => 'Basic', 'uk' => 'Базовий'],
                'description' => ['en' => 'For small stores', 'uk' => 'Для невеликих магазинів'],
                'price_monthly' => 799,
                'price_yearly' => 7990,
                'max_sites' => 1,
                'max_widgets' => 4,
                'features' => [],
                'is_recommended' => false,
                'sort_order' => 1,
            ],
            [
                'slug' => 'pro',
                'name' => ['en' => 'Pro', 'uk' => 'Pro'],
                'description' => ['en' => 'Optimal for growth', 'uk' => 'Оптимальний для росту'],
                'price_monthly' => 1599,
                'price_yearly' => 15990,
                'max_sites' => 3,
                'max_widgets' => 12,
                'features' => [],
                'is_recommended' => true,
                'sort_order' => 2,
            ],
            [
                'slug' => 'max',
                'name' => ['en' => 'Max', 'uk' => 'Max'],
                'description' => ['en' => 'All widgets, maximum power', 'uk' => 'Усі віджети, максимум можливостей'],
                'price_monthly' => 2899,
                'price_yearly' => 28990,
                'max_sites' => 5,
                'max_widgets' => 17,
                'features' => [],
                'is_recommended' => false,
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(
                ['slug' => $plan['slug']],
                $plan,
            );
        }
    }
}
```

Add `PlanSeeder::class` to `DatabaseSeeder::run()`.

### 7. Create a test endpoint to verify localization

Add to `routes/api.php` inside the v1 public group:

```php
// --- Public ---
Route::prefix('v1')->group(function () {
    // ... health, auth ...

    Route::get('plans', [\App\Http\Controllers\Api\V1\Public\PlanController::class, 'index']);
});
```

**`app/Http/Controllers/Api/V1/Public/PlanController.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Resources\Api\V1\PlanResource;
use App\Models\Plan;
use Illuminate\Http\JsonResponse;

class PlanController extends BaseController
{
    public function index(): JsonResponse
    {
        $plans = Plan::where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return $this->success([
            'data' => PlanResource::collection($plans),
        ]);
    }
}
```

## How to Verify

```bash
# 1. Seed the plans
docker compose -f docker-compose.dev.yml exec backend php artisan db:seed --class=PlanSeeder

# 2. Request plans in Ukrainian (default)
curl http://localhost:9002/api/v1/plans
# "name" should be "Безкоштовний", "Базовий", "Pro", "Max"

# 3. Request plans in English
curl http://localhost:9002/api/v1/plans \
  -H "Accept-Language: en"
# "name" should be "Free", "Basic", "Pro", "Max"

# 4. Request with unsupported locale → falls back to uk
curl http://localhost:9002/api/v1/plans \
  -H "Accept-Language: de"
# Should return Ukrainian names (default)
```

## Commit

```
feat: add localization support with translatable models and Plan seeder
```
