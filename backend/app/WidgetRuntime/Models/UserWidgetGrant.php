<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * @property Carbon|null $expires_at
 */
class UserWidgetGrant extends Model
{
    protected $connection = 'pgsql_runtime';

    protected $table = 'wgt_user_widget_grants';

    /** @var list<string> */
    protected $fillable = [
        'user_id',
        'product_id',
        'reason',
        'expires_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
        ];
    }

    public function isActive(): bool
    {
        return $this->expires_at === null || $this->expires_at->gt(now());
    }

    /**
     * @param Builder<UserWidgetGrant> $query
     * @return Builder<UserWidgetGrant>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where(function (Builder $q): void {
            $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
        });
    }
}
