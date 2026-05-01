<?php

declare(strict_types=1);

namespace App\SmartSearch\Models;

use App\Shared\Concerns\HasUuidV7;
use App\SmartSearch\Enums\FeedSyncStatus;
use App\WidgetRuntime\Models\Site;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $site_id
 * @property string $lang
 * @property string $feed_url
 * @property string|null $sitemap_url
 * @property Carbon|null $last_synced_at
 * @property Carbon|null $sync_started_at
 * @property FeedSyncStatus $status
 * @property string|null $error
 * @property int $items_count
 */
final class SiteSearchFeed extends Model
{
    use HasUuidV7;

    protected $connection = 'pgsql_runtime';

    protected $table = 'wgt_smart_search_feeds';

    /** @var list<string> */
    protected $fillable = [
        'site_id',
        'lang',
        'feed_url',
        'sitemap_url',
        'last_synced_at',
        'sync_started_at',
        'status',
        'error',
        'items_count',
    ];

    /**
     * @return array<string, mixed>
     */
    protected function casts(): array
    {
        return [
            'last_synced_at'   => 'datetime',
            'sync_started_at'  => 'datetime',
            'items_count'      => 'integer',
            'status'           => FeedSyncStatus::class,
        ];
    }

    /**
     * @return BelongsTo<Site, $this>
     */
    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }
}
