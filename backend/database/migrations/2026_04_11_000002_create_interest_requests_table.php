<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('interest_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('anonymous_id', 100)->nullable();
            $table->string('interestable_type');
            $table->unsignedBigInteger('interestable_id');
            $table->string('ip_hash', 64)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamps();

            $table->index(['interestable_type', 'interestable_id']);
        });

        DB::statement(
            'CREATE UNIQUE INDEX interest_requests_user_unique ON interest_requests (user_id, interestable_type, interestable_id) WHERE user_id IS NOT NULL',
        );

        DB::statement(
            'CREATE UNIQUE INDEX interest_requests_anon_unique ON interest_requests (anonymous_id, interestable_type, interestable_id) WHERE anonymous_id IS NOT NULL',
        );

        DB::statement(
            'ALTER TABLE interest_requests ADD CONSTRAINT interest_requests_owner_check CHECK ((user_id IS NOT NULL AND anonymous_id IS NULL) OR (user_id IS NULL AND anonymous_id IS NOT NULL))',
        );
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE interest_requests DROP CONSTRAINT IF EXISTS interest_requests_owner_check');
        DB::statement('DROP INDEX IF EXISTS interest_requests_user_unique');
        DB::statement('DROP INDEX IF EXISTS interest_requests_anon_unique');
        Schema::dropIfExists('interest_requests');
    }
};
