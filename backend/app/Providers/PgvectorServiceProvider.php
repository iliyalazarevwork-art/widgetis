<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Pgvector\Laravel\Schema as PgvectorSchema;

/**
 * Wraps Pgvector\Laravel without its auto-loaded migration. We register the
 * extension ourselves only on Postgres connections so the existing SQLite test
 * suite is not broken.
 */
final class PgvectorServiceProvider extends ServiceProvider
{
    public function register(): void
    {
    }

    public function boot(): void
    {
        PgvectorSchema::register();
    }
}
