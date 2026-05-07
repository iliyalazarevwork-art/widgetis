<?php

declare(strict_types=1);

namespace App\Providers;

use App\Core\Models\Product;
use App\Core\Models\User;
use App\Core\Services\Bridge\EloquentSubscriptionGate;
use App\Core\Services\Bridge\EloquentUserResolver;
use App\Core\Services\Bridge\EloquentWidgetCatalog;
use App\Core\Services\Plan\FoundingService;
use App\Shared\Contracts\SiteOwnershipInterface;
use App\Shared\Contracts\SubscriptionGateInterface;
use App\Shared\Contracts\UserResolverInterface;
use App\Shared\Contracts\WidgetCatalogInterface;
use App\Shared\Contracts\WidgetRuntimeStatsInterface;
use App\WidgetRuntime\Services\Bridge\EloquentSiteOwnership;
use App\WidgetRuntime\Services\Bridge\EloquentWidgetRuntimeStats;
use App\WidgetRuntime\Services\Widget\CartRecommender\Composer\ComposerInterface;
use App\WidgetRuntime\Services\Widget\CartRecommender\Composer\OnDemandComposer;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(UserResolverInterface::class, EloquentUserResolver::class);
        $this->app->singleton(SubscriptionGateInterface::class, EloquentSubscriptionGate::class);
        $this->app->singleton(WidgetCatalogInterface::class, EloquentWidgetCatalog::class);
        $this->app->singleton(SiteOwnershipInterface::class, EloquentSiteOwnership::class);
        $this->app->singleton(WidgetRuntimeStatsInterface::class, EloquentWidgetRuntimeStats::class);
        $this->app->singleton(ComposerInterface::class, OnDemandComposer::class);

        $this->app->singleton(FoundingService::class, fn () => new FoundingService(
            maxSlots: (int) config('founding.max_slots', 20),
            proLockedPriceMonthly: (int) config('founding.pro_locked_price_monthly', 299),
        ));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Relation::enforceMorphMap([
            'product' => Product::class,
            'user' => User::class,
        ]);
    }
}
