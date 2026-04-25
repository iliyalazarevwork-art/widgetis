<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Core\Models\Order;
use App\Core\Models\Payment;
use App\Core\Models\User;
use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'order_id' => Order::factory(),
            'subscription_id' => null,
            'type' => PaymentType::Charge->value,
            'amount' => 499,
            'currency' => 'UAH',
            'status' => PaymentStatus::Pending->value,
            'payment_provider' => PaymentProvider::Monobank,
            'payment_method' => null,
            'transaction_id' => null,
            'description' => ['en' => 'Test payment', 'uk' => 'Тестова оплата'],
            'metadata' => [],
        ];
    }

    public function success(): static
    {
        return $this->state(fn () => [
            'status' => PaymentStatus::Success->value,
            'payment_method' => 'card',
            'transaction_id' => 'TXN-'.fake()->unique()->numerify('########'),
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn () => [
            'status' => PaymentStatus::Failed->value,
        ]);
    }
}
