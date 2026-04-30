<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('customer_cases', function (Blueprint $table) {
            $table->decimal('review_rating', 3, 1)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('customer_cases', function (Blueprint $table) {
            $table->smallInteger('review_rating')->nullable()->change();
        });
    }
};
