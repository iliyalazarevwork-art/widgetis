<?php

declare(strict_types=1);

use App\Enums\LeadStatus;
use App\Enums\ManagerRequestType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('manager_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->nullable()->constrained();
            $table->foreignUuid('site_id')->nullable()->constrained();
            $table->string('type', 30)->default(ManagerRequestType::InstallHelp->value);
            $table->string('messenger', 30)->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 20)->nullable();
            $table->jsonb('widgets')->nullable();
            $table->text('message')->nullable();
            $table->string('status', 20)->default(LeadStatus::New->value);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('manager_requests');
    }
};
