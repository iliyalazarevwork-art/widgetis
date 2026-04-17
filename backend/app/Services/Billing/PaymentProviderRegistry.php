<?php

declare(strict_types=1);

namespace App\Services\Billing;

use App\Enums\PaymentProvider;
use App\Exceptions\UnknownPaymentProviderException;
use App\Models\Subscription;
use App\Services\Billing\Contracts\PaymentProviderInterface;

/**
 * V2 registry — typed against PaymentProviderInterface.
 *
 * Mirrors the v1 PaymentProviderRegistry pattern but operates with the
 * new adapter contract so the BillingOrchestrator and WebhookDispatcher
 * never touch v1 classes.
 */
final class PaymentProviderRegistry
{
    /** @var array<string, PaymentProviderInterface> keyed by PaymentProvider value */
    private array $providers = [];

    public function register(PaymentProviderInterface $provider): void
    {
        $this->providers[$provider->name()->value] = $provider;
    }

    public function has(PaymentProvider $provider): bool
    {
        return isset($this->providers[$provider->value]);
    }

    public function get(PaymentProvider $provider): PaymentProviderInterface
    {
        return $this->providers[$provider->value]
            ?? throw UnknownPaymentProviderException::notRegistered($provider);
    }

    public function for(Subscription $subscription): PaymentProviderInterface
    {
        if ($subscription->payment_provider === null) {
            throw UnknownPaymentProviderException::subscriptionHasNoProvider($subscription->id);
        }

        return $this->get($subscription->payment_provider);
    }

    /**
     * @return list<PaymentProviderInterface>
     */
    public function all(): array
    {
        return array_values($this->providers);
    }
}
