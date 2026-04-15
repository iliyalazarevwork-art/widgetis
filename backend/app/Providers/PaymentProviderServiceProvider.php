<?php

declare(strict_types=1);

namespace App\Providers;

use App\Services\Billing\PaymentProviderRegistry;
use App\Services\Billing\Providers\LiqPayProvider;
use App\Services\Billing\Providers\MonobankProvider;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\ServiceProvider;

/**
 * Wires concrete payment-provider adapters into the PaymentProviderRegistry.
 *
 * Adapters are registered here from a single place so that adding a new
 * provider (Monobank, Fondy, ...) only touches this file and the adapter
 * class itself — business code keeps depending on the abstract registry.
 */
class PaymentProviderServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PaymentProviderRegistry::class, function (Application $app): PaymentProviderRegistry {
            $registry = new PaymentProviderRegistry();

            $registry->register($app->make(LiqPayProvider::class));
            $registry->register($app->make(MonobankProvider::class));

            return $registry;
        });
    }
}
