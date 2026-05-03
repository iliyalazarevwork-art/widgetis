<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    protected $connection = 'pgsql_runtime';

    public function up(): void
    {
        Schema::connection($this->connection)->create('wgt_demo_entries', function (Blueprint $table) {
            $table->id();
            $table->string('domain');
            $table->string('source', 16); // public | admin
            $table->string('ip', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('domain');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::connection($this->connection)->dropIfExists('wgt_demo_entries');
    }
};
