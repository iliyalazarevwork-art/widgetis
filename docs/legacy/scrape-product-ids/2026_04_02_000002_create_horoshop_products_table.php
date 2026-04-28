<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('horoshop_products', function (Blueprint $table) {
            $table->id();
            $table->string('site', 255);
            $table->string('article', 255);
            $table->unsignedInteger('horoshop_id');
            $table->timestamps();

            $table->unique(['site', 'article']); // покрывает и WHERE site=? AND article=?, и WHERE site=?
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('horoshop_products');
    }
};
