<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class InterestRequest extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'user_id',
        'anonymous_id',
        'interestable_type',
        'interestable_id',
        'ip_hash',
        'user_agent',
    ];

    /**
     * @return MorphTo<Model, $this>
     */
    public function interestable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
