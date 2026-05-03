<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Core\Models\WidgetTag;
use Illuminate\Database\Seeder;

class WidgetTagSeeder extends Seeder
{
    public function run(): void
    {
        $tags = [
            ['slug' => 'social-proof', 'name' => ['en' => 'Social Proof', 'uk' => 'Соціальний доказ'], 'color' => '#3B82F6', 'sort_order' => 0],
            ['slug' => 'urgency', 'name' => ['en' => 'Urgency', 'uk' => 'Терміновість'], 'color' => '#EF4444', 'sort_order' => 1],
            ['slug' => 'trust', 'name' => ['en' => 'Trust', 'uk' => 'Довіра'], 'color' => '#10B981', 'sort_order' => 2],
            ['slug' => 'conversion', 'name' => ['en' => 'Conversion', 'uk' => 'Конверсія'], 'color' => '#F59E0B', 'sort_order' => 3],
            ['slug' => 'engagement', 'name' => ['en' => 'Engagement', 'uk' => 'Залучення'], 'color' => '#8B5CF6', 'sort_order' => 4],
            ['slug' => 'avg-order', 'name' => ['en' => 'Avg. Order', 'uk' => 'Середній чек'], 'color' => '#22C55E', 'sort_order' => 5],
            ['slug' => 'loyalty', 'name' => ['en' => 'Loyalty', 'uk' => 'Лояльність'], 'color' => '#EC4899', 'sort_order' => 6],
            ['slug' => 'visual', 'name' => ['en' => 'Visual', 'uk' => 'Візуал'], 'color' => '#A855F7', 'sort_order' => 7],
        ];

        foreach ($tags as $tag) {
            WidgetTag::updateOrCreate(['slug' => $tag['slug']], $tag);
        }
    }
}
