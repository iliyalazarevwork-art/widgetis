<?php

declare(strict_types=1);

namespace App\Core\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ManagerRequest extends Model
{
    use SoftDeletes;

    /** @var list<string> */
    protected $fillable = [
        'user_id', 'site_id', 'type', 'messenger', 'email', 'name',
        'phone', 'widgets', 'message', 'status', 'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['widgets' => 'array'];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Note: site() relationship removed to break Core→WidgetRuntime FK.
    // site_id column is kept; admin SPA renders it as raw text.
}
