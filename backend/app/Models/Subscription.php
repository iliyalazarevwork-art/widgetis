<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\SubscriptionStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'user_id',
        'plan_id',
        'billing_period',
        'status',
        'is_trial',
        'trial_ends_at',
        'current_period_start',
        'current_period_end',
        'cancelled_at',
        'cancel_reason',
        'grace_period_ends_at',
        'payment_retry_count',
        'next_payment_retry_at',
        'payment_provider',
        'payment_provider_subscription_id',
    ];

    /**
     * @return array<string, mixed>
     */
    protected function casts(): array
    {
        return [
            'is_trial' => 'boolean',
            'trial_ends_at' => 'datetime',
            'current_period_start' => 'datetime',
            'current_period_end' => 'datetime',
            'cancelled_at' => 'datetime',
            'grace_period_ends_at' => 'datetime',
            'next_payment_retry_at' => 'datetime',
            'status' => SubscriptionStatus::class,
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Plan, $this>
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * @param Builder<Subscription> $query
     * @return Builder<Subscription>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', [
            SubscriptionStatus::Active,
            SubscriptionStatus::Trial,
        ]);
    }

    public function isActive(): bool
    {
        return in_array($this->status, [
            SubscriptionStatus::Active,
            SubscriptionStatus::Trial,
        ]);
    }

    public function isTrial(): bool
    {
        return $this->status === SubscriptionStatus::Trial;
    }

    public function isCancelled(): bool
    {
        return $this->status === SubscriptionStatus::Cancelled;
    }

    public function daysRemainingInPeriod(): int
    {
        return max(0, (int) now()->diffInDays($this->current_period_end, false));
    }

    public function daysInPeriod(): int
    {
        return max(1, (int) $this->current_period_start->diffInDays($this->current_period_end));
    }
}
