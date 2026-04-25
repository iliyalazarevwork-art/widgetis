<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Models;

use App\Enums\ReviewStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

final class Review extends Model
{
    protected $connection = 'pgsql_runtime';

    protected $table = 'wgt_reviews';

    /** @var list<string> */
    protected $fillable = [
        'user_id',
        'site_id',
        'external_product_id',
        'visitor_name',
        'visitor_email',
        'rating',
        'title',
        'body',
        'status',
        'media',
    ];

    /**
     * @return array<string, mixed>
     */
    protected function casts(): array
    {
        return [
            'media'  => 'array',
            'status' => ReviewStatus::class,
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
     * @param Builder<Review> $query
     * @return Builder<Review>
     */
    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', ReviewStatus::Approved->value);
    }

    /**
     * Scope to reviews for a specific site + product combination.
     *
     * @param Builder<Review> $query
     * @return Builder<Review>
     */
    public function scopeForProduct(Builder $query, string $siteId, string $externalProductId): Builder
    {
        return $query
            ->where('site_id', $siteId)
            ->where('external_product_id', $externalProductId);
    }

    /**
     * Scope to reviews that have at least one media item.
     *
     * On PostgreSQL we use jsonb_array_length() for accuracy.
     * On SQLite (test environment) we fall back to a JSON length check
     * that works on a plain TEXT column storing a JSON array.
     *
     * @param Builder<Review> $query
     * @return Builder<Review>
     */
    public function scopeWithMedia(Builder $query): Builder
    {
        $driver = DB::connection($this->connection)->getDriverName();

        if ($driver === 'pgsql') {
            return $query->whereRaw('jsonb_array_length(media) > 0');
        }

        // SQLite fallback: filter out NULL, empty string, and the literal '[]'.
        return $query
            ->whereNotNull('media')
            ->where('media', '!=', '')
            ->where('media', '!=', '[]');
    }
}
