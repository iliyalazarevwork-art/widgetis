<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    protected $connection = 'pgsql_runtime';

    protected $table = 'wgt_reviews';

    /** @var list<string> */
    protected $fillable = ['user_id', 'rating', 'title', 'body', 'status'];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @param Builder<Review> $query
     * @return Builder<Review>
     */
    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', 'approved');
    }
}
