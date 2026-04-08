<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\SiteStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Site extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'user_id',
        'name',
        'domain',
        'url',
        'platform',
        'status',
        'script_installed',
        'script_installed_at',
        'connected_at',
        'deactivated_at',
    ];

    /**
     * @return array<string, mixed>
     */
    protected function casts(): array
    {
        return [
            'script_installed' => 'boolean',
            'script_installed_at' => 'datetime',
            'connected_at' => 'datetime',
            'deactivated_at' => 'datetime',
            'status' => SiteStatus::class,
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasOne<SiteScript, $this>
     */
    public function script(): HasOne
    {
        return $this->hasOne(SiteScript::class);
    }

    /**
     * @return HasMany<SiteWidget, $this>
     */
    public function widgets(): HasMany
    {
        return $this->hasMany(SiteWidget::class);
    }

    /**
     * @param Builder<Site> $query
     * @return Builder<Site>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', SiteStatus::Active);
    }

    public function isActive(): bool
    {
        return $this->status === SiteStatus::Active;
    }

    public static function domainFromUrl(string $url): string
    {
        $parsed = parse_url($url);
        $host = $parsed['host'] ?? $url;

        return (string) preg_replace('/^www\./', '', $host);
    }
}
