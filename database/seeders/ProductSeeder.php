<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                'slug' => 'marquee',
                'name' => ['en' => 'Marquee Ticker', 'uk' => 'Біжучий рядок'],
                'description' => ['en' => 'Scrolling announcement bar with custom messages', 'uk' => 'Прокручуваний рядок з оголошеннями'],
                'icon' => 'megaphone',
                'tag_slug' => 'engagement',
                'is_popular' => true,
                'builder_module' => 'marquee',
                'sort_order' => 0,
            ],
            [
                'slug' => 'delivery-date',
                'name' => ['en' => 'Delivery Date', 'uk' => 'Дата доставки'],
                'description' => ['en' => 'Show estimated delivery date on product pages', 'uk' => 'Показує очікувану дату доставки на сторінці товару'],
                'icon' => 'truck',
                'tag_slug' => 'trust',
                'is_new' => true,
                'builder_module' => 'delivery-date',
                'sort_order' => 1,
            ],
            [
                'slug' => 'visitor-counter',
                'name' => ['en' => 'Visitor Counter', 'uk' => 'Лічильник відвідувачів'],
                'description' => ['en' => 'Show how many people are viewing a product right now', 'uk' => 'Показує скільки людей зараз переглядають товар'],
                'icon' => 'eye',
                'tag_slug' => 'social-proof',
                'builder_module' => 'visitor-counter',
                'sort_order' => 2,
            ],
            [
                'slug' => 'countdown-timer',
                'name' => ['en' => 'Countdown Timer', 'uk' => 'Таймер знижок'],
                'description' => ['en' => 'Countdown timer for limited-time offers', 'uk' => 'Зворотний відлік для обмежених пропозицій'],
                'icon' => 'timer',
                'tag_slug' => 'urgency',
                'is_popular' => true,
                'builder_module' => 'countdown-timer',
                'sort_order' => 3,
            ],
            [
                'slug' => 'purchase-notification',
                'name' => ['en' => 'Purchase Notification', 'uk' => 'Сповіщення про покупку'],
                'description' => ['en' => 'Show recent purchase popups to boost social proof', 'uk' => 'Показує нещодавні покупки для підвищення довіри'],
                'icon' => 'shopping-bag',
                'tag_slug' => 'social-proof',
                'builder_module' => 'purchase-notification',
                'sort_order' => 4,
            ],
            [
                'slug' => 'free-shipping-bar',
                'name' => ['en' => 'Free Shipping Bar', 'uk' => 'Безкоштовна доставка'],
                'description' => ['en' => 'Progress bar showing how much more to spend for free shipping', 'uk' => 'Прогрес-бар показує скільки залишилось до безкоштовної доставки'],
                'icon' => 'package',
                'tag_slug' => 'conversion',
                'builder_module' => 'free-shipping-bar',
                'sort_order' => 5,
            ],
        ];

        foreach ($products as $data) {
            Product::updateOrCreate(
                ['slug' => $data['slug']],
                array_merge([
                    'platform' => 'horoshop',
                    'status' => 'active',
                    'is_popular' => false,
                    'is_new' => false,
                ], $data),
            );
        }
    }
}
