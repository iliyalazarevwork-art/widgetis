<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\BillingPeriod;
use App\Enums\PaymentProvider;
use App\Enums\SubscriptionStatus;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Subscription>
 */
class SubscriptionFactory extends Factory
{
    protected $model = Subscription::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'plan_id' => Plan::factory(),
            'billing_period' => BillingPeriod::Monthly->value,
            'status' => SubscriptionStatus::Active,
            'is_trial' => false,
            'trial_ends_at' => null,
            'current_period_start' => now()->subDay(),
            'current_period_end' => now()->addMonth(),
            'payment_provider' => PaymentProvider::Monobank,
            'payment_provider_subscription_id' => 'MONO-SUBSCR-'.fake()->unique()->numerify('######'),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => [
            'status' => SubscriptionStatus::Pending,
            'payment_provider' => null,
            'payment_provider_subscription_id' => null,
        ]);
    }

    public function trial(): static
    {
        return $this->state(fn () => [
            'status' => SubscriptionStatus::Trial,
            'is_trial' => true,
            'trial_ends_at' => now()->addDays(7),
            'current_period_end' => now()->addDays(7),
        ]);
    }

    public function pastDue(): static
    {
        return $this->state(fn () => [
            'status' => SubscriptionStatus::PastDue,
            'grace_period_ends_at' => now()->addDays(3),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn () => [
            'status' => SubscriptionStatus::Cancelled,
            'cancelled_at' => now(),
        ]);
    }

    public function yearly(): static
    {
        return $this->state(fn () => [
            'billing_period' => BillingPeriod::Yearly->value,
            'current_period_end' => now()->addYear(),
        ]);
    }
}
