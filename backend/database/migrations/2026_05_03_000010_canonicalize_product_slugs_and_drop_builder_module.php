<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        DB::table('products')->where('slug', 'freeship-goal')->update(['slug' => 'cart-goal']);
        DB::table('products')->where('slug', 'one-plus-one-deal')->update(['slug' => 'one-plus-one']);

        Schema::table('products', function (Blueprint $table): void {
            $table->dropColumn('builder_module');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->string('builder_module', 100)->nullable();
        });

        DB::table('products')->where('slug', 'cart-goal')->update(['slug' => 'freeship-goal']);
        DB::table('products')->where('slug', 'one-plus-one')->update(['slug' => 'one-plus-one-deal']);
    }
};
