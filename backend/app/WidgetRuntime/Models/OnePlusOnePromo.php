<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class OnePlusOnePromo extends Model
{
    protected $connection = 'pgsql_runtime';

    protected $table = 'wgt_one_plus_one_promos';

    /** @var list<string> */
    protected $fillable = [
        'site_id',
        'name',
        'is_active',
        'catalog_url',
        'catalog_format',
        'categories',
        'product_map',
        'article_categories',
        'article_suffix',
        'min_items',
        'one_uah_price',
        'settings',
    ];

    /**
     * @return array<string, mixed>
     */
    protected function casts(): array
    {
        return [
            'is_active'          => 'boolean',
            'categories'         => 'array',
            'product_map'        => 'array',
            'article_categories' => 'array',
            'settings'           => 'array',
            'min_items'          => 'integer',
            'one_uah_price'      => 'float',
        ];
    }

    /**
     * @return BelongsTo<Site, $this>
     */
    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    /**
     * @param  Builder<OnePlusOnePromo>  $query
     * @return Builder<OnePlusOnePromo>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * @param  Builder<OnePlusOnePromo>  $query
     * @return Builder<OnePlusOnePromo>
     */
    public function scopeForSite(Builder $query, string $siteId): Builder
    {
        return $query->where('site_id', $siteId);
    }
}
