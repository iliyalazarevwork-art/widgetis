<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Models;

use App\WidgetRuntime\Enums\CartRecommenderEventType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CartRecommenderEvent extends Model
{
    public $timestamps = false;

    protected $connection = 'pgsql_runtime';

    protected $table = 'wgt_cart_recommender_events';

    /** @var list<string> */
    protected $fillable = [
        'site_id',
        'source_product_id',
        'related_product_id',
        'event_type',
        'lifecycle_token',
        'occurred_at',
    ];

    /**
     * @return array<string, mixed>
     */
    protected function casts(): array
    {
        return [
            'event_type' => CartRecommenderEventType::class,
            'occurred_at' => 'datetime',
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
}
