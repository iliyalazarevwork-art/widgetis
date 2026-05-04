<?php

declare(strict_types=1);

use App\Core\Enums\Widget\WidgetSlug;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    public function up(): void
    {
        foreach (WidgetSlug::cases() as $slug) {
            $en = $slug->translatedName('en');
            $uk = $slug->translatedName('uk');

            DB::table('products')->where('slug', $slug->value)->update([
                'name' => json_encode(['en' => $en, 'uk' => $uk], JSON_UNESCAPED_UNICODE),
            ]);
        }
    }

    public function down(): void
    {
        // no-op: history preserved in git
    }
};
