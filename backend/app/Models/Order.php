<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\PaymentProvider;
use App\Models\Concerns\HasUuidV7;
use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property ?PaymentProvider $payment_provider
 */
class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;
    use HasUuidV7;


    /** @var list<string> */
    protected $fillable = [
        'order_number', 'user_id', 'plan_id', 'billing_period', 'amount',
        'discount_amount', 'currency', 'status', 'payment_provider',
        'payment_method', 'transaction_id', 'paid_at', 'refunded_at', 'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'paid_at' => 'datetime',
            'refunded_at' => 'datetime',
            'notes' => 'array',
            'status' => OrderStatus::class,
            'payment_provider' => PaymentProvider::class,
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Plan, $this> */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
