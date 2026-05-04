<?php

declare(strict_types=1);

use App\Enums\ProductStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    private const ARCHIVED_SLUGS = [
        'recently-viewed',
        'floating-messengers',
    ];

    public function up(): void
    {
        DB::table('products')
            ->whereIn('slug', self::ARCHIVED_SLUGS)
            ->update(['status' => ProductStatus::Inactive->value]);
    }

    public function down(): void
    {
        DB::table('products')
            ->whereIn('slug', self::ARCHIVED_SLUGS)
            ->update(['status' => ProductStatus::Active->value]);
    }
};
