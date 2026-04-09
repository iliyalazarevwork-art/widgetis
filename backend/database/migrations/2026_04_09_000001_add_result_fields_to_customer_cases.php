<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('customer_cases', function (Blueprint $table) {
            $table->string('result_metric')->nullable()->after('review_rating');
            $table->string('result_period')->nullable()->after('result_metric');
            $table->string('color', 30)->nullable()->after('result_period');
        });
    }

    public function down(): void
    {
        Schema::table('customer_cases', function (Blueprint $table) {
            $table->dropColumn(['result_metric', 'result_period', 'color']);
        });
    }
};
