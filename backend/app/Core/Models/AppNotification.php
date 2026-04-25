<?php

declare(strict_types=1);

namespace App\Core\Models;

use App\Core\Models\Concerns\HasTranslations;
use App\Enums\NotificationType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppNotification extends Model
{
    use HasTranslations;

    protected $table = 'notifications';
    public $timestamps = false;

    /** @var list<string> */
    public array $translatable = ['title', 'body'];

    /** @var list<string> */
    protected $fillable = [
        'user_id', 'type', 'title', 'body', 'data',
        'is_read', 'read_at', 'created_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'title' => 'array',
            'body' => 'array',
            'data' => 'array',
            'is_read' => 'boolean',
            'read_at' => 'datetime',
            'created_at' => 'datetime',
            'type' => NotificationType::class,
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @param Builder<AppNotification> $query
     * @return Builder<AppNotification>
     */
    public function scopeUnread(Builder $query): Builder
    {
        return $query->where('is_read', false);
    }
}
