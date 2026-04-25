<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property array<string, mixed>|null $config
 */
class SiteWidget extends Model
{
    protected $connection = 'pgsql_runtime';

    protected $table = 'wgt_site_widgets';

    /** @var list<string> */
    protected $fillable = [
        'site_id',
        'product_id',
        'is_enabled',
        'config',
        'enabled_at',
        'disabled_at',
    ];

    /**
     * @return array<string, mixed>
     */
    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'config' => 'array',
            'enabled_at' => 'datetime',
            'disabled_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Site, $this>
     */
    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    // Note: product() relationship removed to break WidgetRuntime→Core FK.
    // product_id column kept. Use product_id to look up product data via Core context.
}
