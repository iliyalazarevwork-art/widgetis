<?php

declare(strict_types=1);

namespace App\SmartSearch\Models;

use App\Shared\Concerns\HasUuidV7;
use Illuminate\Database\Eloquent\Model;

final class SiteSearchCategory extends Model
{
    use HasUuidV7;

    protected $connection = 'pgsql_runtime';

    protected $table = 'wgt_smart_search_categories';

    /** @var list<string> */
    protected $fillable = [
        'site_id',
        'lang',
        'external_id',
        'parent_id',
        'name',
        'url',
        'products_count',
    ];

    /**
     * @return array<string, mixed>
     */
    protected function casts(): array
    {
        return [
            'products_count' => 'integer',
        ];
    }
}
