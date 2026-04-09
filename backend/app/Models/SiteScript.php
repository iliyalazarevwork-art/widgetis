<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class SiteScript extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'site_id',
        'token',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
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
     * @return HasMany<SiteScriptBuild, $this>
     */
    public function builds(): HasMany
    {
        return $this->hasMany(SiteScriptBuild::class);
    }

    public static function generateToken(): string
    {
        return Str::random(64);
    }

    public function getScriptTagAttribute(): string
    {
        $cdnUrl = rtrim((string) config('services.r2.public_url', 'https://cdn.widgetis.com'), '/');
        $this->loadMissing('site');
        $domain = $this->site !== null ? $this->site->domain : $this->token;

        return sprintf(
            '<script src="%s/sites/%s/bundle.js" async></script>',
            $cdnUrl,
            $domain,
        );
    }

    public function getScriptUrlAttribute(): string
    {
        $cdnUrl = rtrim((string) config('services.r2.public_url', 'https://cdn.widgetis.com'), '/');
        $this->loadMissing('site');
        $domain = $this->site !== null ? $this->site->domain : $this->token;

        return "{$cdnUrl}/sites/{$domain}/bundle.js";
    }
}
