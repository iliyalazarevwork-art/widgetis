<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ProductionBootstrapSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            AdminSeeder::class,
            AdminTestSitesSeeder::class,
            PlanSeeder::class,
            WidgetTagSeeder::class,
            ProductSeeder::class,
            ProductPlanAccessSeeder::class,
            CustomerCaseSitesSeeder::class,
            CustomerCasesSeeder::class,
        ]);
    }
}
