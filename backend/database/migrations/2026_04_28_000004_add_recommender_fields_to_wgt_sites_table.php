<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('wgt_sites', function (Blueprint $table) {
            $table->string('recommender_vertical', 32)->default('generic');
            $table->string('cartum_login', 128)->nullable();
            $table->text('cartum_password_encrypted')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('wgt_sites', function (Blueprint $table) {
            $table->dropColumn(['recommender_vertical', 'cartum_login', 'cartum_password_encrypted']);
        });
    }
};
