<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PaymentProvider;
use App\Enums\SubscriptionStatus;
use App\Models\Concerns\HasUuidV7;
use Database\Factories\SubscriptionFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property ?PaymentProvider $payment_provider
 * @property ?string $payment_provider_subscription_id
 * @property ?string $monobank_card_token
 * @property ?string $wayforpay_rec_token
 * @property string $user_id
 * @property SubscriptionStatus $status
 * @property \Illuminate\Support\Carbon $current_period_start
 * @property \Illuminate\Support\Carbon $current_period_end
 * @property ?\Illuminate\Support\Carbon $trial_ends_at
 * @property ?\Illuminate\Support\Carbon $cancelled_at
 * @property ?\Illuminate\Support\Carbon $grace_period_ends_at
 * @property ?\Illuminate\Support\Carbon $next_payment_retry_at
 */
class Subscription extends Model
{
    /** @use HasFactory<SubscriptionFactory> */
    use HasFactory;
    use HasUuidV7;


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
        'monobank_card_token',
        'wayforpay_rec_token',
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
            'payment_provider' => PaymentProvider::class,
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
        return $query->whereIn('status', SubscriptionStatus::accessGranting());
    }

    public function isActive(): bool
    {
        return in_array($this->status, SubscriptionStatus::accessGranting(), true);
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
