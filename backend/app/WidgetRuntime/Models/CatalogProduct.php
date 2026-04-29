<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Models;

use Database\Factories\CatalogProductFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class CatalogProduct extends Model
{
    /** @use HasFactory<CatalogProductFactory> */
    use HasFactory;

    protected $connection = 'pgsql_runtime';

    protected $table = 'wgt_catalog_products';

    /** @var list<string> */
    protected $fillable = [
        'site_id',
        'sku',
        'parent_sku',
        'alias',
        'horoshop_id',
        'external_url',
        'title_ua',
        'title_en',
        'title_ru',
        'category_path',
        'brand',
        'description_ua',
        'description_en',
        'short_description_ua',
        'short_description_en',
        'price',
        'old_price',
        'currency',
        'image_url',
        'image_urls',
        'in_stock',
        'raw_attributes',
        'ai_tags',
        'source_hash',
        'ai_tagged_at',
        'embedded_at',
    ];

    /**
     * @return array<string, mixed>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'old_price' => 'decimal:2',
            'horoshop_id' => 'integer',
            'in_stock' => 'boolean',
            'image_urls' => 'array',
            'raw_attributes' => 'array',
            'ai_tags' => 'array',
            'ai_tagged_at' => 'datetime',
            'embedded_at' => 'datetime',
        ];
    }

    protected static function newFactory(): CatalogProductFactory
    {
        return CatalogProductFactory::new();
    }

    /**
     * @return BelongsTo<Site, $this>
     */
    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    /**
     * @return HasMany<CartRecommenderRelation, $this>
     */
    public function sourceRelations(): HasMany
    {
        return $this->hasMany(CartRecommenderRelation::class, 'source_product_id');
    }

    /**
     * @param Builder<CatalogProduct> $q
     * @return Builder<CatalogProduct>
     */
    public function scopeNeedingTagging(Builder $q): Builder
    {
        return $q->whereNull('ai_tagged_at');
    }

    /**
     * @param Builder<CatalogProduct> $q
     * @return Builder<CatalogProduct>
     */
    public function scopeNeedingEmbedding(Builder $q): Builder
    {
        return $q->whereNull('embedded_at')->whereNotNull('ai_tagged_at');
    }

    /**
     * Products that can be rendered by the widget and added to a Horoshop cart.
     *
     * @param Builder<CatalogProduct> $q
     * @return Builder<CatalogProduct>
     */
    public function scopePurchasableForWidget(Builder $q): Builder
    {
        return $q
            ->where('in_stock', true)
            ->whereNotNull('horoshop_id')
            ->whereNotNull('alias')
            ->where('alias', '!=', '');
    }
}
