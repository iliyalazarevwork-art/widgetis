<?php

declare(strict_types=1);

use App\Enums\ScriptBuildStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('site_script_builds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_script_id')->constrained()->cascadeOnDelete();
            $table->integer('version');
            $table->jsonb('config');
            $table->string('file_url', 500);
            $table->string('file_hash', 64)->nullable();
            $table->string('status', 20)->default(ScriptBuildStatus::Active->value);
            $table->timestamp('built_at');
            $table->timestamp('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_script_builds');
    }
};
