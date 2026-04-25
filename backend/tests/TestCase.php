<?php

declare(strict_types=1);

namespace Tests;

use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Schema;

abstract class TestCase extends BaseTestCase
{
    /**
     * Seed roles table once the schema exists.
     *
     * Feature tests rely on spatie roles (admin, customer) — seeding them here
     * means every test using RefreshDatabase gets the full role set for free.
     * Tests that do not use RefreshDatabase (and therefore have no schema) are
     * skipped transparently.
     */
    protected function setUp(): void
    {
        parent::setUp();

        // When running under SQLite (test env), wire pgsql_runtime to share the
        // same in-memory PDO as the default connection so WidgetRuntime model tables
        // (which Eloquent routes to pgsql_runtime) are visible alongside Core tables.
        // parent::setUp() triggers RefreshDatabase which runs migrate:fresh and creates
        // the in-memory PDO. We then point pgsql_runtime at the same PDO handle.
        if ($this->app->bound('db') && config('database.default') === 'sqlite') {
            $defaultPdo = $this->app->make('db')->connection()->getPdo();
            $this->app->make('db')->connection('pgsql_runtime')->setPdo($defaultPdo);
        }

        if ($this->app->bound('db') && Schema::hasTable('roles')) {
            $this->seed(RoleSeeder::class);
        }
    }
}
