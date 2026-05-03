<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Models;

use App\WidgetRuntime\Enums\DemoEntrySource;
use Illuminate\Database\Eloquent\Model;

final class DemoEntry extends Model
{
    protected $connection = 'pgsql_runtime';

    protected $table = 'wgt_demo_entries';

    public $timestamps = false;

    /** @var list<string> */
    protected $fillable = ['domain', 'source', 'ip'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'source' => DemoEntrySource::class,
            'created_at' => 'datetime',
        ];
    }
}
