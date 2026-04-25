<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property Carbon|null $expires_at
 */
class DemoSession extends Model
{
    /** Characters without ambiguous glyphs (no I, L, O, 0, 1) */
    private const CODE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

    /** @var list<string> */
    protected $fillable = [
        'code', 'domain', 'config', 'created_by', 'view_count', 'expires_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'config' => 'array',
            'expires_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @param Builder<self> $query
     * @return Builder<self>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('expires_at', '>', now());
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public static function generateCode(int $length = 6): string
    {
        $chars = self::CODE_CHARSET;
        $max = strlen($chars) - 1;

        do {
            $code = '';
            for ($i = 0; $i < $length; $i++) {
                $code .= $chars[random_int(0, $max)];
            }
        } while (self::where('code', $code)->exists());

        return $code;
    }
}
