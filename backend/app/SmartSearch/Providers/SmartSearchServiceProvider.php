<?php

declare(strict_types=1);

namespace App\SmartSearch\Providers;

use App\SmartSearch\Console\SeedFromJsonFeedCommand;
use App\SmartSearch\Console\SyncAllFeedsCommand;
use App\SmartSearch\Console\SyncFeedCommand;
use App\SmartSearch\Services\Cache\RedisSearchCache;
use App\SmartSearch\Services\Cache\SearchCache;
use App\SmartSearch\Services\Feed\FeedFetcher;
use App\SmartSearch\Services\Feed\FeedParser;
use App\SmartSearch\Services\Feed\HoroshopYmlFeedParser;
use App\SmartSearch\Services\Feed\HttpFeedFetcher;
use App\SmartSearch\Services\Search\PgProductSearchEngine;
use App\SmartSearch\Services\Search\ProductSearchEngine;
use Illuminate\Support\ServiceProvider;

final class SmartSearchServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(SearchCache::class, RedisSearchCache::class);
        $this->app->bind(ProductSearchEngine::class, PgProductSearchEngine::class);
        $this->app->bind(FeedFetcher::class, HttpFeedFetcher::class);
        $this->app->bind(FeedParser::class, HoroshopYmlFeedParser::class);
    }

    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([
                SyncFeedCommand::class,
                SyncAllFeedsCommand::class,
                SeedFromJsonFeedCommand::class,
            ]);
        }
    }
}
