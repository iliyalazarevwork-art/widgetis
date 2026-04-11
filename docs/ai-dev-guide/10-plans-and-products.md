# Step 09 — Plans, Products, Tags & Public Catalog API

## Goal
Full product catalog API: list widgets with filtering/search/pagination, widget detail page, tags.
Plans API with comparison matrix. All data is translatable and seeded.

## Prerequisites
Steps 01–08 completed. Plan model and seeder exist from Step 07.

## Actions

### 1. Create WidgetTag model

**`app/Models/WidgetTag.php`**
```php
<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WidgetTag extends Model
{
    use HasTranslations;

    protected $primaryKey = 'slug';
    public $incrementing = false;
    protected $keyType = 'string';

    public array $translatable = ['name'];

    protected $fillable = [
        'slug',
        'name',
        'color',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'name' => 'array',
        ];
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'tag_slug', 'slug');
    }
}
```

### 2. Create Product model

**`app/Models/Product.php`**
```php
<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasTranslations;

    public array $translatable = ['name', 'description', 'long_description', 'features'];

    protected $fillable = [
        'slug',
        'name',
        'description',
        'long_description',
        'features',
        'icon',
        'tag_slug',
        'platform',
        'status',
        'is_popular',
        'is_new',
        'preview_before',
        'preview_after',
        'builder_module',
        'config_schema',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'name' => 'array',
            'description' => 'array',
            'long_description' => 'array',
            'features' => 'array',
            'config_schema' => 'array',
            'is_popular' => 'boolean',
            'is_new' => 'boolean',
        ];
    }

    // --- Relations ---

    public function tag(): BelongsTo
    {
        return $this->belongsTo(WidgetTag::class, 'tag_slug', 'slug');
    }

    public function plans(): BelongsToMany
    {
        return $this->belongsToMany(Plan::class, 'product_plan_access');
    }

    public function siteWidgets(): HasMany
    {
        return $this->hasMany(SiteWidget::class);
    }

    // --- Scopes ---

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForPlatform($query, string $platform)
    {
        return $query->where('platform', $platform);
    }

    public function scopeByTag($query, string $tagSlug)
    {
        return $query->where('tag_slug', $tagSlug);
    }
}
```

### 3. Create PlanFeature and PlanFeatureValue models

**`app/Models/PlanFeature.php`**
```php
<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PlanFeature extends Model
{
    use HasTranslations;

    public array $translatable = ['name'];

    protected $fillable = [
        'feature_key',
        'name',
        'category',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'name' => 'array',
        ];
    }

    public function values(): HasMany
    {
        return $this->hasMany(PlanFeatureValue::class);
    }
}
```

**`app/Models/PlanFeatureValue.php`**
```php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlanFeatureValue extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'plan_id',
        'plan_feature_id',
        'value',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'array',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function feature(): BelongsTo
    {
        return $this->belongsTo(PlanFeature::class, 'plan_feature_id');
    }
}
```

### 4. Add relations to Plan model

Add these to `app/Models/Plan.php`:

```php
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

// --- Relations ---

public function products(): BelongsToMany
{
    return $this->belongsToMany(Product::class, 'product_plan_access');
}

public function featureValues(): HasMany
{
    return $this->hasMany(PlanFeatureValue::class);
}

// --- Scopes ---

public function scopeActive($query)
{
    return $query->where('is_active', true);
}
```

### 5. Create seeders

**`database/seeders/WidgetTagSeeder.php`**
```php
<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\WidgetTag;
use Illuminate\Database\Seeder;

class WidgetTagSeeder extends Seeder
{
    public function run(): void
    {
        $tags = [
            ['slug' => 'social-proof', 'name' => ['en' => 'Social Proof', 'uk' => 'Соціальний доказ'], 'color' => '#3B82F6', 'sort_order' => 0],
            ['slug' => 'urgency', 'name' => ['en' => 'Urgency', 'uk' => 'Терміновість'], 'color' => '#EF4444', 'sort_order' => 1],
            ['slug' => 'trust', 'name' => ['en' => 'Trust', 'uk' => 'Довіра'], 'color' => '#10B981', 'sort_order' => 2],
            ['slug' => 'conversion', 'name' => ['en' => 'Conversion', 'uk' => 'Конверсія'], 'color' => '#F59E0B', 'sort_order' => 3],
            ['slug' => 'engagement', 'name' => ['en' => 'Engagement', 'uk' => 'Залучення'], 'color' => '#8B5CF6', 'sort_order' => 4],
        ];

        foreach ($tags as $tag) {
            WidgetTag::updateOrCreate(['slug' => $tag['slug']], $tag);
        }
    }
}
```

**`database/seeders/ProductSeeder.php`**
```php
<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                'slug' => 'promo-line',
                'name' => ['en' => 'PromoLine', 'uk' => 'Промо-стрічка'],
                'description' => ['en' => 'Scrolling announcement bar at the top of the site', 'uk' => 'Прокручуваний рядок з оголошеннями вгорі сайту'],
                'icon' => 'megaphone',
                'tag_slug' => 'engagement',
                'is_popular' => true,
                'builder_module' => 'marquee',
                'sort_order' => 0,
            ],
            [
                'slug' => 'delivery-date',
                'name' => ['en' => 'DeliveryDay', 'uk' => 'Дата доставки'],
                'description' => ['en' => 'Show expected delivery date on product pages', 'uk' => 'Показує очікувану дату доставки на сторінці товару'],
                'icon' => 'truck',
                'tag_slug' => 'trust',
                'is_new' => true,
                'builder_module' => 'delivery-date',
                'sort_order' => 1,
            ],
            [
                'slug' => 'freeship-goal',
                'name' => ['en' => 'FreeShip Goal', 'uk' => 'До безкоштовної доставки'],
                'description' => ['en' => 'Floating progress bar showing how much more to spend for free shipping', 'uk' => 'Плаваючий прогрес-бар показує скільки залишилось до безкоштовної доставки'],
                'icon' => 'package',
                'tag_slug' => 'conversion',
                'is_popular' => true,
                'builder_module' => 'cart-goal',
                'sort_order' => 2,
            ],
            [
                'slug' => 'minorder-goal',
                'name' => ['en' => 'MinOrder Goal', 'uk' => 'Мінімальне замовлення'],
                'description' => ['en' => 'Floating progress bar for minimum order threshold', 'uk' => 'Плаваючий прогрес-бар для мінімальної суми замовлення'],
                'icon' => 'shopping-cart',
                'tag_slug' => 'conversion',
                'builder_module' => 'min-order',
                'sort_order' => 3,
            ],
            [
                'slug' => 'one-plus-one-deal',
                'name' => ['en' => '1+1=3 Deal', 'uk' => '1+1=3 акція'],
                'description' => ['en' => 'Buy 2 products — cheapest one for 1 UAH. Increases average order value', 'uk' => 'Купи два товари — найдешевший у кошику за 1 гривню. Збільшує середній чек'],
                'icon' => 'gift',
                'tag_slug' => 'conversion',
                'is_new' => true,
                'builder_module' => 'one-plus-one',
                'sort_order' => 4,
            ],
            [
                'slug' => 'video-preview',
                'name' => ['en' => 'VideoPreview', 'uk' => 'Відео товару'],
                'description' => ['en' => 'Floating product video preview in the corner of the page', 'uk' => 'Плаваючий відео-превʼю товару в куті сторінки'],
                'icon' => 'video',
                'tag_slug' => 'engagement',
                'is_new' => true,
                'builder_module' => 'product-video-preview',
                'sort_order' => 5,
            ],
            [
                'slug' => 'buyer-count',
                'name' => ['en' => 'BuyerCount', 'uk' => 'Бейдж продажів'],
                'description' => ['en' => 'Shows how many people bought this product, updates in real time', 'uk' => 'Показує скільки людей купили цей товар, оновлюється в реальному часі'],
                'icon' => 'users',
                'tag_slug' => 'social-proof',
                'is_popular' => true,
                'builder_module' => 'social-proof',
                'sort_order' => 6,
            ],
        ];

        foreach ($products as $data) {
            Product::updateOrCreate(
                ['slug' => $data['slug']],
                array_merge([
                    'platform' => 'horoshop',
                    'status' => 'active',
                    'is_popular' => false,
                    'is_new' => false,
                ], $data),
            );
        }
    }
}
```

**`database/seeders/ProductPlanAccessSeeder.php`**
```php
<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductPlanAccessSeeder extends Seeder
{
    public function run(): void
    {
        $allProducts = Product::pluck('id')->toArray();

        // Free: first 2 products
        $free = Plan::where('slug', 'free')->first();
        $free?->products()->sync(array_slice($allProducts, 0, 2));

        // Basic: first 4 products
        $basic = Plan::where('slug', 'basic')->first();
        $basic?->products()->sync(array_slice($allProducts, 0, 4));

        // Pro: all but last product
        $pro = Plan::where('slug', 'pro')->first();
        $pro?->products()->sync(array_slice($allProducts, 0, max(1, count($allProducts) - 1)));

        // Max: all products
        $max = Plan::where('slug', 'max')->first();
        $max?->products()->sync($allProducts);
    }
}
```

Update `DatabaseSeeder`:
```php
$this->call([
    RoleSeeder::class,
    AdminSeeder::class,
    PlanSeeder::class,
    WidgetTagSeeder::class,
    ProductSeeder::class,
    ProductPlanAccessSeeder::class,
]);
```

### 6. Create API Resources

**`app/Http/Resources/Api/V1/WidgetTagResource.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WidgetTagResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'slug' => $this->slug,
            'name' => $this->translated('name'),
            'color' => $this->color,
        ];
    }
}
```

**`app/Http/Resources/Api/V1/ProductResource.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->translated('name'),
            'description' => $this->translated('description'),
            'icon' => $this->icon,
            'tag' => $this->whenLoaded('tag', fn () => new WidgetTagResource($this->tag)),
            'platform' => $this->platform,
            'is_popular' => $this->is_popular,
            'is_new' => $this->is_new,
        ];
    }
}
```

**`app/Http/Resources/Api/V1/ProductDetailResource.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->translated('name'),
            'description' => $this->translated('description'),
            'long_description' => $this->translated('long_description'),
            'features' => $this->features,
            'icon' => $this->icon,
            'tag' => $this->whenLoaded('tag', fn () => new WidgetTagResource($this->tag)),
            'platform' => $this->platform,
            'is_popular' => $this->is_popular,
            'is_new' => $this->is_new,
            'preview_before' => $this->preview_before,
            'preview_after' => $this->preview_after,
            'config_schema' => $this->config_schema,
            'related_products' => ProductResource::collection($this->whenLoaded('relatedProducts')),
        ];
    }
}
```

### 7. Create Controllers

**`app/Http/Controllers/Api/V1/Public/ProductController.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Resources\Api\V1\ProductDetailResource;
use App\Http\Resources\Api\V1\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::active()->with('tag');

        if ($request->filled('platform')) {
            $query->forPlatform($request->input('platform'));
        }

        if ($request->filled('tag')) {
            $query->byTag($request->input('tag'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $locale = $this->locale();
            $query->where(function ($q) use ($search, $locale) {
                $q->whereRaw("name->>? ILIKE ?", [$locale, "%{$search}%"])
                  ->orWhereRaw("description->>? ILIKE ?", [$locale, "%{$search}%"]);
            });
        }

        $sort = $request->input('sort', 'default');
        $query = match ($sort) {
            'name_asc' => $query->orderByRaw("name->>? ASC", [$this->locale()]),
            'name_desc' => $query->orderByRaw("name->>? DESC", [$this->locale()]),
            'popular' => $query->orderByDesc('is_popular')->orderBy('sort_order'),
            'new' => $query->orderByDesc('is_new')->orderBy('sort_order'),
            default => $query->orderBy('sort_order'),
        };

        $perPage = min((int) $request->input('per_page', 12), 50);
        $paginator = $query->paginate($perPage);

        return $this->paginated(
            $paginator,
            ['data' => ProductResource::collection($paginator->items())],
        );
    }

    public function show(string $slug): JsonResponse
    {
        $product = Product::active()
            ->with('tag')
            ->where('slug', $slug)
            ->firstOrFail();

        // Get related products (same tag, different product)
        $related = Product::active()
            ->with('tag')
            ->where('tag_slug', $product->tag_slug)
            ->where('id', '!=', $product->id)
            ->limit(4)
            ->get();

        $product->setRelation('relatedProducts', $related);

        return $this->success([
            'data' => new ProductDetailResource($product),
        ]);
    }
}
```

**`app/Http/Controllers/Api/V1/Public/TagController.php`**
```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Resources\Api\V1\WidgetTagResource;
use App\Models\WidgetTag;
use Illuminate\Http\JsonResponse;

class TagController extends BaseController
{
    public function index(): JsonResponse
    {
        $tags = WidgetTag::orderBy('sort_order')->get();

        return $this->success([
            'data' => WidgetTagResource::collection($tags),
        ]);
    }
}
```

Update **PlanController** to add the features comparison endpoint:

```php
// Add to PlanController

public function features(): JsonResponse
{
    $plans = Plan::active()->orderBy('sort_order')->get();
    $features = \App\Models\PlanFeature::with(['values.plan'])
        ->orderBy('sort_order')
        ->get();

    $matrix = $features->map(function ($feature) use ($plans) {
        $row = [
            'key' => $feature->feature_key,
            'name' => $feature->translated('name'),
            'category' => $feature->category,
        ];

        foreach ($plans as $plan) {
            $value = $feature->values->firstWhere('plan_id', $plan->id);
            $row['plans'][$plan->slug] = $value?->value;
        }

        return $row;
    });

    return $this->success(['data' => $matrix]);
}
```

### 8. Register routes

Add to `routes/api.php` in the public v1 group:

```php
// --- Public catalog ---
Route::get('products', [ProductController::class, 'index']);
Route::get('products/{slug}', [ProductController::class, 'show']);
Route::get('tags', [TagController::class, 'index']);
Route::get('plans', [PlanController::class, 'index']);
Route::get('plans/features', [PlanController::class, 'features']);
Route::get('settings', [SettingsController::class, 'index']);
```

Add the imports at the top:
```php
use App\Http\Controllers\Api\V1\Public\ProductController;
use App\Http\Controllers\Api\V1\Public\TagController;
use App\Http\Controllers\Api\V1\Public\PlanController;
use App\Http\Controllers\Api\V1\Public\SettingsController;
```

## How to Verify

```bash
# 1. Seed all data
docker compose -f docker-compose.dev.yml exec backend php artisan migrate:fresh --seed

# 2. List all products
curl -s http://localhost:9002/api/v1/products | python3 -m json.tool
# Should return 6 products with names, tags, icons

# 3. Filter by tag
curl -s "http://localhost:9002/api/v1/products?tag=social-proof"
# Should return only social proof products

# 4. Search
curl -s "http://localhost:9002/api/v1/products?search=ticker" \
  -H "Accept-Language: en"
# Should find Marquee Ticker

# 5. Product detail
curl -s http://localhost:9002/api/v1/products/promo-line | python3 -m json.tool
# Should return full product with related_products

# 6. Tags
curl -s http://localhost:9002/api/v1/tags
# Should return 5 tags

# 7. Plans
curl -s http://localhost:9002/api/v1/plans
# Should return 4 plans

# 8. Ukrainian vs English
curl -s http://localhost:9002/api/v1/products -H "Accept-Language: uk" | grep name
curl -s http://localhost:9002/api/v1/products -H "Accept-Language: en" | grep name
# Names should differ by locale
```

## Commit

```
feat: add products catalog, tags, and plans API with seeders
```
