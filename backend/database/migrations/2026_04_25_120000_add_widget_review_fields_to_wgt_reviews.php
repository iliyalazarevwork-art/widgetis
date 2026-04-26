<?php

declare(strict_types=1);

use App\Enums\ReviewStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Add widget-review fields to wgt_reviews.
 *
 * Connection strategy (matching the rename migration approach):
 *   • No `protected $connection` is set — the migration runs on the DEFAULT
 *     connection just like the rename migration did.
 *   • On production (pgsql), both pgsql and pgsql_runtime point to the same
 *     PostgreSQL database, so Schema:: (default) touches the same tables.
 *   • On SQLite (tests), all connections use the same :memory: database.
 *     SQLite doesn't support ALTER COLUMN, so we recreate wgt_reviews with the
 *     full new schema (safe: tests always start from migrate:fresh, no data).
 */
return new class () extends Migration {
    public function up(): void
    {
        $isSqlite = DB::getDriverName() === 'sqlite';

        if ($isSqlite) {
            $this->recreateForSqlite();

            return;
        }

        // PostgreSQL path:
        // 1. Drop user_id FK if it exists (may have been dropped by a prior migration).
        $this->dropFkIfExists('wgt_reviews', 'wgt_reviews_user_id_foreign');
        $this->dropFkIfExists('wgt_reviews', 'reviews_user_id_foreign');

        // 2. Make user_id nullable.
        Schema::table('wgt_reviews', function (Blueprint $table) {
            $table->uuid('user_id')->nullable()->change();
        });

        // 3. Add new columns.
        Schema::table('wgt_reviews', function (Blueprint $table) {
            $table->uuid('site_id')->nullable()->after('user_id');
            $table->string('external_product_id', 64)->nullable()->after('site_id');
            $table->string('visitor_name', 120)->nullable()->after('external_product_id');
            $table->string('visitor_email', 180)->nullable()->after('visitor_name');
            $table->jsonb('media')->default('[]')->after('status');
        });

        // 4. FK and indexes.
        Schema::table('wgt_reviews', function (Blueprint $table) {
            $table->foreign('site_id')->references('id')->on('wgt_sites')->onDelete('cascade');
            $table->index('external_product_id');
            $table->index(['site_id', 'external_product_id']);
        });
    }

    public function down(): void
    {
        $isSqlite = DB::getDriverName() === 'sqlite';

        if ($isSqlite) {
            // In SQLite tests, just drop and return — next migrate:fresh recreates from scratch.
            Schema::dropIfExists('wgt_reviews');

            return;
        }

        Schema::table('wgt_reviews', function (Blueprint $table) {
            $table->dropForeign(['site_id']);
            $table->dropIndex(['external_product_id']);
            $table->dropIndex(['site_id', 'external_product_id']);
            $table->dropColumn(['site_id', 'external_product_id', 'visitor_name', 'visitor_email', 'media']);
        });

        Schema::table('wgt_reviews', function (Blueprint $table) {
            $table->uuid('user_id')->nullable(false)->change();
        });
    }

    /**
     * SQLite does not support ALTER COLUMN, so we drop and recreate the table
     * with the full desired schema including nullable user_id.
     * This is safe in tests because RefreshDatabase always starts fresh.
     */
    private function recreateForSqlite(): void
    {
        Schema::dropIfExists('wgt_reviews');

        Schema::create('wgt_reviews', function (Blueprint $table) {
            $table->id();
            $table->uuid('user_id')->nullable();
            $table->uuid('site_id')->nullable();
            $table->string('external_product_id', 64)->nullable()->index();
            $table->string('visitor_name', 120)->nullable();
            $table->string('visitor_email', 180)->nullable();
            $table->smallInteger('rating')->nullable();
            $table->string('title')->nullable();
            $table->text('body');
            $table->string('status', 20)->default(ReviewStatus::Pending->value);
            $table->text('media')->nullable(); // JSON stored as TEXT in SQLite
            $table->timestamps();

            $table->index(['site_id', 'external_product_id']);
        });
    }

    /**
     * Drop a foreign key constraint by raw SQL, ignoring errors if it doesn't exist.
     */
    private function dropFkIfExists(string $table, string $constraint): void
    {
        DB::statement("ALTER TABLE \"{$table}\" DROP CONSTRAINT IF EXISTS \"{$constraint}\"");
    }
};
