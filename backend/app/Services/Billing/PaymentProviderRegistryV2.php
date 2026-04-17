<?php

declare(strict_types=1);

namespace App\Services\Billing;

use App\Enums\PaymentProvider;
use App\Exceptions\UnknownPaymentProviderException;
use App\Models\Subscription;
use App\Services\Billing\Contracts\PaymentProviderInterfaceV2;

/**
 * V2 registry — typed against PaymentProviderInterfaceV2.
 *
 * Mirrors the v1 PaymentProviderRegistry pattern but operates with the
 * new adapter contract so the BillingOrchestrator and WebhookDispatcher
 * never touch v1 classes.
 */
final class PaymentProviderRegistryV2
{
    /** @var array<string, PaymentProviderInterfaceV2> keyed by PaymentProvider value */
    private array $providers = [];

    public function register(PaymentProviderInterfaceV2 $provider): void
    {
        $this->providers[$provider->name()->value] = $provider;
    }

    public function has(PaymentProvider $provider): bool
    {
        return isset($this->providers[$provider->value]);
    }

    public function get(PaymentProvider $provider): PaymentProviderInterfaceV2
    {
        return $this->providers[$provider->value]
            ?? throw UnknownPaymentProviderException::notRegistered($provider);
    }

    public function for(Subscription $subscription): PaymentProviderInterfaceV2
    {
        if ($subscription->payment_provider === null) {
            throw UnknownPaymentProviderException::subscriptionHasNoProvider($subscription->id);
        }

        return $this->get($subscription->payment_provider);
    }

    /**
     * @return list<PaymentProviderInterfaceV2>
     */
    public function all(): array
    {
        return array_values($this->providers);
    }
}
