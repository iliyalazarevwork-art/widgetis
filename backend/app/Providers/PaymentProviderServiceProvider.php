<?php

declare(strict_types=1);

namespace App\Providers;

use App\Core\Services\Billing\Adapters\MonobankAdapter;
use App\Core\Services\Billing\Adapters\MonobankAdapterConfig;
use App\Core\Services\Billing\Adapters\WayForPayAdapter;
use App\Core\Services\Billing\BillingOrchestrator;
use App\Core\Services\Billing\MonobankWebhookService;
use App\Core\Services\Billing\PaymentProviderRegistry;
use App\Core\Services\Billing\SubscriptionActivationService;
use App\Core\Services\Billing\SubscriptionService;
use App\Core\Services\Billing\WebhookDispatcher;
use App\Core\Services\Plan\FoundingService;
use AratKruglik\Monobank\Contracts\ClientInterface as MonobankClient;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\ServiceProvider;

/**
 * Wires concrete payment-provider adapters into the PaymentProviderRegistry.
 */
final class PaymentProviderServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // SubscriptionActivationService receives a lazy resolver for
        // SubscriptionService to break the circular dependency chain:
        // Registry → MonobankAdapter → MonobankWebhookService → ActivationService → SubscriptionService → Registry
        $this->app->singleton(SubscriptionActivationService::class, function (Application $app): SubscriptionActivationService {
            return new SubscriptionActivationService(
                subscriptionServiceResolver: fn () => $app->make(SubscriptionService::class),
                foundingService: $app->make(FoundingService::class),
            );
        });

        $this->app->singleton(MonobankAdapter::class, function (Application $app): MonobankAdapter {
            return new MonobankAdapter(
                client: $app->make(MonobankClient::class),
                config: new MonobankAdapterConfig(
                    hasToken: config('monobank.token') !== null,
                    webhookUrl: (string) config('monobank.webhook_url'),
                    redirectUrl: (string) config('monobank.redirect_url'),
                ),
                webhookService: $app->make(MonobankWebhookService::class),
            );
        });

        $this->app->singleton(PaymentProviderRegistry::class, function (Application $app): PaymentProviderRegistry {
            $registry = new PaymentProviderRegistry();

            $registry->register($app->make(WayForPayAdapter::class));
            $registry->register($app->make(MonobankAdapter::class));

            return $registry;
        });

        $this->app->singleton(BillingOrchestrator::class);
        $this->app->singleton(WebhookDispatcher::class);
    }
}
