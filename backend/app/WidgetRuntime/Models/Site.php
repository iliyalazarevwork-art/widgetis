<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Models;

use App\Enums\SiteStatus;
use App\Models\Concerns\HasUuidV7;
use App\Models\User;
use Database\Factories\SiteFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Site extends Model
{
    /** @use HasFactory<SiteFactory> */
    use HasFactory;
    use HasUuidV7;

    protected $connection = 'pgsql_runtime';

    protected static function newFactory(): SiteFactory
    {
        return SiteFactory::new();
    }

    protected $table = 'wgt_sites';

    /** @var list<string> */
    protected $fillable = [
        'user_id',
        'site_key',
        'name',
        'domain',
        'allowed_origins',
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
            'allowed_origins' => 'array',
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
     * @return HasMany<OtpProviderConfig, $this>
     */
    public function otpProviderConfigs(): HasMany
    {
        return $this->hasMany(OtpProviderConfig::class);
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
        $host = is_array($parsed) ? ($parsed['host'] ?? null) : null;
        $normalized = strtolower(trim((string) ($host ?? $url)));
        $normalized = rtrim($normalized, '.');
        $normalized = (string) preg_replace('/^www\./i', '', $normalized);

        if ($normalized !== '' && function_exists('idn_to_ascii')) {
            $ascii = idn_to_ascii(
                $normalized,
                IDNA_DEFAULT,
                defined('INTL_IDNA_VARIANT_UTS46') ? INTL_IDNA_VARIANT_UTS46 : 0,
            );

            if (is_string($ascii) && $ascii !== '') {
                $normalized = strtolower($ascii);
            }
        }

        return $normalized;
    }
}
