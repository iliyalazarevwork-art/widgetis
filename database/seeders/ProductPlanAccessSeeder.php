<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductPlanAccessSeeder extends Seeder
{
    public function run(): void
    {
        $allProducts = Product::pluck('id')->toArray();

        $free = Plan::where('slug', 'free')->first();
        $free?->products()->sync(array_slice($allProducts, 0, 2));

        $basic = Plan::where('slug', 'basic')->first();
        $basic?->products()->sync(array_slice($allProducts, 0, 4));

        $pro = Plan::where('slug', 'pro')->first();
        $pro?->products()->sync(array_slice($allProducts, 0, max(1, count($allProducts) - 1)));

        $max = Plan::where('slug', 'max')->first();
        $max?->products()->sync($allProducts);
    }
}
