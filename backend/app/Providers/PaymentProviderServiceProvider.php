<?php

declare(strict_types=1);

namespace App\Providers;

use App\Services\Billing\Adapters\MonobankAdapter;
use App\Services\Billing\Adapters\MonobankAdapterConfig;
use App\Services\Billing\Adapters\WayForPayAdapter;
use App\Services\Billing\BillingOrchestrator;
use App\Services\Billing\MonobankWebhookService;
use App\Services\Billing\PaymentProviderRegistry;
use App\Services\Billing\PaymentProviderRegistryV2;
use App\Services\Billing\Providers\MonobankProvider;
use App\Services\Billing\Providers\WayForPayProvider;
use App\Services\Billing\SubscriptionActivationService;
use App\Services\Billing\SubscriptionService;
use App\Services\Billing\WebhookDispatcher;
use AratKruglik\Monobank\Contracts\ClientInterface as MonobankClient;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\ServiceProvider;

/**
 * Wires concrete payment-provider adapters into both the v1 PaymentProviderRegistry
 * and the v2 PaymentProviderRegistryV2.
 *
 * V1 registrations are kept intact so existing code that depends on
 * PaymentProviderInterface keeps working until Step 6 removes it.
 * V2 registrations power BillingOrchestrator and WebhookDispatcher.
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

        // V1 registry — kept intact for backward compatibility
        $this->app->singleton(PaymentProviderRegistry::class, function (Application $app): PaymentProviderRegistry {
            $registry = new PaymentProviderRegistry();

            $registry->register($app->make(MonobankProvider::class));
            $registry->register($app->make(WayForPayProvider::class));

            return $registry;
        });

        // V2 registry — powers BillingOrchestrator and WebhookDispatcher
        $this->app->singleton(PaymentProviderRegistryV2::class, function (Application $app): PaymentProviderRegistryV2 {
            $registry = new PaymentProviderRegistryV2();

            $registry->register($app->make(WayForPayAdapter::class));

            $registry->register(new MonobankAdapter(
                client: $app->make(MonobankClient::class),
                config: new MonobankAdapterConfig(
                    hasToken: config('monobank.token') !== null,
                    webhookUrl: (string) config('monobank.webhook_url'),
                    redirectUrl: (string) config('monobank.redirect_url'),
                ),
                webhookService: $app->make(MonobankWebhookService::class),
            ));

            return $registry;
        });

        // V2 application-layer services auto-resolve via DI
        $this->app->singleton(BillingOrchestrator::class);
        $this->app->singleton(WebhookDispatcher::class);
    }
}
