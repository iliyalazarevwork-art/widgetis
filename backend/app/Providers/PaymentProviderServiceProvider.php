<?php

declare(strict_types=1);

namespace App\Providers;

use App\Services\Billing\PaymentProviderRegistry;
use App\Services\Billing\Providers\MonobankProvider;
use App\Services\Billing\Providers\WayForPayProvider;
use App\Services\Billing\SubscriptionActivationService;
use App\Services\Billing\SubscriptionService;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\ServiceProvider;

/**
 * Wires concrete payment-provider adapters into the PaymentProviderRegistry.
 *
 * Adapters are registered here from a single place so that adding a new
 * provider (Monobank, WayForPay, ...) only touches this file and the adapter
 * class itself — business code keeps depending on the abstract registry.
 */
class PaymentProviderServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // SubscriptionActivationService receives a lazy resolver for
        // SubscriptionService to break the circular dependency chain:
        // Registry → MonobankProvider → MonobankWebhookService → ActivationService → SubscriptionService → Registry
        $this->app->singleton(SubscriptionActivationService::class, function (Application $app): SubscriptionActivationService {
            return new SubscriptionActivationService(
                subscriptionServiceResolver: fn () => $app->make(SubscriptionService::class),
            );
        });

        $this->app->singleton(PaymentProviderRegistry::class, function (Application $app): PaymentProviderRegistry {
            $registry = new PaymentProviderRegistry();

            $registry->register($app->make(MonobankProvider::class));
            $registry->register($app->make(WayForPayProvider::class));

            return $registry;
        });
    }
}
