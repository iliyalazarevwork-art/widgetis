<?php

declare(strict_types=1);

namespace App\SmartSearch\Models;

use App\Shared\Concerns\HasUuidV7;
use Illuminate\Database\Eloquent\Model;

final class SiteSearchProduct extends Model
{
    use HasUuidV7;

    protected $connection = 'pgsql_runtime';

    protected $table = 'wgt_smart_search_products';

    /** @var list<string> */
    protected $fillable = [
        'site_id',
        'lang',
        'external_id',
        'name',
        'vendor',
        'category_id',
        'category_path',
        'category_name',
        'picture',
        'url',
        'price',
        'oldprice',
        'currency',
        'available',
        'search_text',
        'popularity',
    ];

    /**
     * @return array<string, mixed>
     */
    protected function casts(): array
    {
        return [
            'available' => 'boolean',
            'oldprice'  => 'integer',
            'price'     => 'integer',
            'popularity' => 'integer',
        ];
    }
}
