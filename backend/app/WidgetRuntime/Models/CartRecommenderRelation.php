<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Models;

use App\WidgetRuntime\Enums\CartRecommenderRelationSource;
use Database\Factories\CartRecommenderRelationFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CartRecommenderRelation extends Model
{
    /** @use HasFactory<CartRecommenderRelationFactory> */
    use HasFactory;

    protected $connection = 'pgsql_runtime';

    protected $table = 'wgt_cart_recommender_relations';

    /** @var list<string> */
    protected $fillable = [
        'site_id',
        'source_product_id',
        'related_product_id',
        'score',
        'rationale_ua',
        'rationale_en',
        'source',
        'computed_at',
        'expires_at',
    ];

    /**
     * @return array<string, mixed>
     */
    protected function casts(): array
    {
        return [
            'score' => 'float',
            'source' => CartRecommenderRelationSource::class,
            'computed_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    protected static function newFactory(): CartRecommenderRelationFactory
    {
        return CartRecommenderRelationFactory::new();
    }

    /**
     * @return BelongsTo<Site, $this>
     */
    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    /**
     * @return BelongsTo<CatalogProduct, $this>
     */
    public function sourceProduct(): BelongsTo
    {
        return $this->belongsTo(CatalogProduct::class, 'source_product_id');
    }

    /**
     * @return BelongsTo<CatalogProduct, $this>
     */
    public function relatedProduct(): BelongsTo
    {
        return $this->belongsTo(CatalogProduct::class, 'related_product_id');
    }

    /**
     * @param Builder<CartRecommenderRelation> $q
     * @return Builder<CartRecommenderRelation>
     */
    public function scopeFresh(Builder $q): Builder
    {
        return $q->where(function (Builder $query) {
            $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
        });
    }
}
