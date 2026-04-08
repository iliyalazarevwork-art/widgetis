<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SiteScriptBuild extends Model
{
    public $timestamps = false;

    /** @var list<string> */
    protected $fillable = [
        'site_script_id',
        'version',
        'config',
        'file_url',
        'file_hash',
        'status',
        'built_at',
        'created_at',
    ];

    /**
     * @return array<string, mixed>
     */
    protected function casts(): array
    {
        return [
            'config' => 'array',
            'built_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<SiteScript, $this>
     */
    public function script(): BelongsTo
    {
        return $this->belongsTo(SiteScript::class, 'site_script_id');
    }
}
