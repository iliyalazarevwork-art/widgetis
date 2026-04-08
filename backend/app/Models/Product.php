<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasTranslations;

    /** @var list<string> */
    public array $translatable = ['name', 'description', 'long_description', 'features'];

    /** @var list<string> */
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

    /**
     * @return array<string, string>
     */
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

    /**
     * @return BelongsTo<WidgetTag, $this>
     */
    public function tag(): BelongsTo
    {
        return $this->belongsTo(WidgetTag::class, 'tag_slug', 'slug');
    }

    /**
     * @return BelongsToMany<Plan, $this>
     */
    public function plans(): BelongsToMany
    {
        return $this->belongsToMany(Plan::class, 'product_plan_access');
    }

    /**
     * @return HasMany<SiteWidget, $this>
     */
    public function siteWidgets(): HasMany
    {
        return $this->hasMany(SiteWidget::class);
    }

    /**
     * @param Builder<Product> $query
     * @return Builder<Product>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    /**
     * @param Builder<Product> $query
     * @return Builder<Product>
     */
    public function scopeForPlatform(Builder $query, string $platform): Builder
    {
        return $query->where('platform', $platform);
    }

    /**
     * @param Builder<Product> $query
     * @return Builder<Product>
     */
    public function scopeByTag(Builder $query, string $tagSlug): Builder
    {
        return $query->where('tag_slug', $tagSlug);
    }
}
