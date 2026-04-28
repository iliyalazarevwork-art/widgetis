<?php

namespace App\Modules\OnePlusOne\Models;

use Illuminate\Database\Eloquent\Model;

class HoroshopProduct extends Model
{
    protected $table = 'horoshop_products';

    protected $fillable = ['site', 'article', 'horoshop_id'];

    protected $casts = [
        'horoshop_id' => 'integer',
    ];

    /**
     * Returns article → horoshop_id map for a given site.
     *
     * @return array<string, int>
     */
    public static function getIdMap(string $site): array
    {
        return self::query()
            ->where('site', $site)
            ->pluck('horoshop_id', 'article')
            ->all();
    }
}
