<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Prod-like content seeder: tariffs, products, widget tags, roles,
 * plus public content (reviews, customer cases).
 *
 * Does NOT create real customer accounts with sites, subscriptions,
 * orders, payments, notifications or activity logs. Review authors
 * are lightweight User records needed only as FK targets.
 */
class FullContentSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(ProductionBootstrapSeeder::class);

        $demo = new DemoDataSeeder();
        $customers = $demo->seedCustomers();

        $demo->seedReviews($customers, now());
        $demo->seedCustomerCases(now());
    }
}
