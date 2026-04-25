<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $connection = 'pgsql_runtime';

    protected $table = 'wgt_reviews';

    /** @var list<string> */
    protected $fillable = ['user_id', 'rating', 'title', 'body', 'status'];

    /**
     * @param Builder<Review> $query
     * @return Builder<Review>
     */
    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', 'approved');
    }
}
