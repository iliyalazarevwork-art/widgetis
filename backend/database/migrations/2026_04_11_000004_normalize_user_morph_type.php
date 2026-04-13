<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    public function up(): void
    {
        // Drop legacy rows that would collide with an already-normalised
        // pair on the composite primary key before performing the rename.
        DB::table('model_has_roles AS legacy')
            ->join('model_has_roles AS current', function ($join): void {
                $join->on('legacy.role_id', '=', 'current.role_id')
                    ->on('legacy.model_id', '=', 'current.model_id')
                    ->where('legacy.model_type', '=', 'App\\Models\\User')
                    ->where('current.model_type', '=', 'user');
            })
            ->delete();

        DB::table('model_has_permissions AS legacy')
            ->join('model_has_permissions AS current', function ($join): void {
                $join->on('legacy.permission_id', '=', 'current.permission_id')
                    ->on('legacy.model_id', '=', 'current.model_id')
                    ->where('legacy.model_type', '=', 'App\\Models\\User')
                    ->where('current.model_type', '=', 'user');
            })
            ->delete();

        DB::table('model_has_roles')
            ->where('model_type', 'App\\Models\\User')
            ->update(['model_type' => 'user']);

        DB::table('model_has_permissions')
            ->where('model_type', 'App\\Models\\User')
            ->update(['model_type' => 'user']);
    }

    public function down(): void
    {
        DB::table('model_has_roles')
            ->where('model_type', 'user')
            ->update(['model_type' => 'App\\Models\\User']);

        DB::table('model_has_permissions')
            ->where('model_type', 'user')
            ->update(['model_type' => 'App\\Models\\User']);
    }
};
