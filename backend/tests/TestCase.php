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

        if ($this->app->bound('db') && Schema::hasTable('roles')) {
            $this->seed(RoleSeeder::class);
        }
    }
}
