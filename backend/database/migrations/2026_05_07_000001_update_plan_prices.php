<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    public function up(): void
    {
        DB::table('plans')->where('slug', 'pro')->update([
            'price_monthly' => 499,
            'price_yearly' => 4990,
        ]);

        DB::table('plans')->where('slug', 'max')->update([
            'price_monthly' => 699,
            'price_yearly' => 6990,
        ]);

        $basicPlan = DB::table('plans')->where('slug', 'basic')->first();
        $proPlan = DB::table('plans')->where('slug', 'pro')->first();

        if ($basicPlan && $proPlan) {
            DB::table('subscriptions')->where('plan_id', $basicPlan->id)->update(['plan_id' => $proPlan->id]);
            DB::table('orders')->where('plan_id', $basicPlan->id)->update(['plan_id' => $proPlan->id]);
            DB::table('product_plan_access')->where('plan_id', $basicPlan->id)->delete();
            DB::table('plans')->where('id', $basicPlan->id)->delete();
        }
    }

    public function down(): void
    {
        DB::table('plans')->where('slug', 'pro')->update([
            'price_monthly' => 1599,
            'price_yearly' => 15990,
        ]);

        DB::table('plans')->where('slug', 'max')->update([
            'price_monthly' => 3990,
            'price_yearly' => 39900,
        ]);
    }
};
