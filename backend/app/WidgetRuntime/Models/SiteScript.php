<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Models;

use App\Enums\ScriptBuildStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class SiteScript extends Model
{
    protected $connection = 'pgsql_runtime';

    protected $table = 'wgt_site_scripts';

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
        return Str::random(5);
    }

    public function getScriptTagAttribute(): ?string
    {
        $url = $this->script_url;

        if ($url === null) {
            return null;
        }

        return sprintf('<script src="%s" async></script>', $url);
    }

    public function getScriptUrlAttribute(): ?string
    {
        return $this->activeBuild()?->file_url;
    }

    public function activeBuild(): ?SiteScriptBuild
    {
        return $this->builds()
            ->where('status', ScriptBuildStatus::Active->value)
            ->orderByDesc('version')
            ->first();
    }
}
