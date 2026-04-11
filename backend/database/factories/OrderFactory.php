<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\BillingPeriod;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_number' => 'TEST-'.fake()->unique()->numerify('########'),
            'user_id' => User::factory(),
            'plan_id' => Plan::factory(),
            'billing_period' => BillingPeriod::Monthly->value,
            'amount' => 499,
            'discount_amount' => 0,
            'currency' => 'UAH',
            'status' => OrderStatus::Pending,
            'payment_provider' => 'liqpay',
        ];
    }

    public function paid(): static
    {
        return $this->state(fn () => [
            'status' => OrderStatus::Paid,
            'paid_at' => now(),
            'transaction_id' => 'TXN-'.fake()->unique()->numerify('########'),
        ]);
    }

    public function yearly(): static
    {
        return $this->state(fn () => [
            'billing_period' => BillingPeriod::Yearly->value,
            'amount' => 4990,
        ]);
    }
}
