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
                'config_schema' => [
                    'enabled' => ['type' => 'boolean', 'default' => true, 'label' => ['en' => 'Enabled', 'uk' => 'Увімкнено']],
                    'speed' => ['type' => 'number', 'default' => 80, 'min' => 10, 'max' => 300, 'label' => ['en' => 'Scroll speed (px/s)', 'uk' => 'Швидкість прокрутки (пкс/с)']],
                    'height' => ['type' => 'number', 'default' => 36, 'min' => 20, 'max' => 100, 'label' => ['en' => 'Height (px)', 'uk' => 'Висота (пкс)']],
                    'mode' => ['type' => 'select', 'options' => ['shift', 'overlay'], 'default' => 'shift', 'label' => ['en' => 'Display mode', 'uk' => 'Режим відображення']],
                    'isFixed' => ['type' => 'boolean', 'default' => true, 'label' => ['en' => 'Fixed position', 'uk' => 'Фіксована позиція']],
                    'ttlHours' => ['type' => 'number', 'default' => 24, 'min' => 1, 'max' => 168, 'label' => ['en' => 'Show once per N hours', 'uk' => 'Показувати раз на N годин']],
                    'colors' => [
                        'type' => 'group',
                        'label' => ['en' => 'Colors', 'uk' => 'Кольори'],
                        'fields' => [
                            'desktop' => [
                                'type' => 'group',
                                'label' => ['en' => 'Desktop', 'uk' => 'Десктоп'],
                                'fields' => [
                                    'backgroundColor' => ['type' => 'color', 'default' => '#1e1b4b', 'label' => ['en' => 'Background', 'uk' => 'Фон']],
                                    'textColor' => ['type' => 'color', 'default' => '#e0e7ff', 'label' => ['en' => 'Text color', 'uk' => 'Колір тексту']],
                                ],
                            ],
                            'mobile' => [
                                'type' => 'group',
                                'label' => ['en' => 'Mobile', 'uk' => 'Мобільний'],
                                'fields' => [
                                    'backgroundColor' => ['type' => 'color', 'default' => '#1e1b4b', 'label' => ['en' => 'Background', 'uk' => 'Фон']],
                                    'textColor' => ['type' => 'color', 'default' => '#e0e7ff', 'label' => ['en' => 'Text color', 'uk' => 'Колір тексту']],
                                ],
                            ],
                        ],
                    ],
                ],
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
                'config_schema' => [
                    'enabled' => ['type' => 'boolean', 'default' => true, 'label' => ['en' => 'Enabled', 'uk' => 'Увімкнено']],
                    'offsetDays' => ['type' => 'number', 'default' => 3, 'min' => 0, 'max' => 30, 'label' => ['en' => 'Delivery offset (days)', 'uk' => 'Зсув доставки (дні)']],
                    'selectors' => [
                        'type' => 'selectors',
                        'default' => [
                            ['selector' => '#page > main > div > div.product__grid > div.product__column.product__column--right > div.product__block.product__block--orderBox.j-product-block > div > div.product-card.product-card--main > div', 'insert' => 'before'],
                        ],
                        'label' => ['en' => 'DOM selectors', 'uk' => 'DOM-селектори'],
                    ],
                ],
            ],
            [
                'slug' => 'visitor-counter',
                'name' => ['en' => 'Visitor Counter', 'uk' => 'Лічильник відвідувачів'],
                'description' => ['en' => 'Show how many people are viewing a product right now', 'uk' => 'Показує скільки людей зараз переглядають товар'],
                'icon' => 'eye',
                'tag_slug' => 'social-proof',
                'builder_module' => 'visitor-counter',
                'sort_order' => 2,
                'config_schema' => [
                    'enabled' => ['type' => 'boolean', 'default' => true, 'label' => ['en' => 'Enabled', 'uk' => 'Увімкнено']],
                ],
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
                'config_schema' => [
                    'enabled' => ['type' => 'boolean', 'default' => true, 'label' => ['en' => 'Enabled', 'uk' => 'Увімкнено']],
                ],
            ],
            [
                'slug' => 'purchase-notification',
                'name' => ['en' => 'Purchase Notification', 'uk' => 'Сповіщення про покупку'],
                'description' => ['en' => 'Show recent purchase popups to boost social proof', 'uk' => 'Показує нещодавні покупки для підвищення довіри'],
                'icon' => 'shopping-bag',
                'tag_slug' => 'social-proof',
                'builder_module' => 'purchase-notification',
                'sort_order' => 4,
                'config_schema' => [
                    'enabled' => ['type' => 'boolean', 'default' => true, 'label' => ['en' => 'Enabled', 'uk' => 'Увімкнено']],
                    'minCount' => ['type' => 'number', 'default' => 8, 'min' => 1, 'max' => 999, 'label' => ['en' => 'Min count to show', 'uk' => 'Мін. кількість для показу']],
                    'maxCount' => ['type' => 'number', 'default' => 50, 'min' => 1, 'max' => 999, 'label' => ['en' => 'Max count to show', 'uk' => 'Макс. кількість для показу']],
                    'updateInterval' => ['type' => 'number', 'default' => 45, 'min' => 5, 'max' => 300, 'label' => ['en' => 'Update interval (sec)', 'uk' => 'Інтервал оновлення (сек)']],
                    'showForOutOfStock' => ['type' => 'boolean', 'default' => false, 'label' => ['en' => 'Show for out-of-stock', 'uk' => 'Показувати для товарів не в наявності']],
                    'backgroundColor' => ['type' => 'color', 'default' => '#4c1d95', 'label' => ['en' => 'Background', 'uk' => 'Фон']],
                    'textColor' => ['type' => 'color', 'default' => '#ede9fe', 'label' => ['en' => 'Text color', 'uk' => 'Колір тексту']],
                ],
            ],
            [
                'slug' => 'free-shipping-bar',
                'name' => ['en' => 'Free Shipping Bar', 'uk' => 'Безкоштовна доставка'],
                'description' => ['en' => 'Progress bar showing how much more to spend for free shipping', 'uk' => 'Прогрес-бар показує скільки залишилось до безкоштовної доставки'],
                'icon' => 'package',
                'tag_slug' => 'conversion',
                'builder_module' => 'free-shipping-bar',
                'sort_order' => 5,
                'config_schema' => [
                    'enabled' => ['type' => 'boolean', 'default' => true, 'label' => ['en' => 'Enabled', 'uk' => 'Увімкнено']],
                    'threshold' => ['type' => 'number', 'default' => 1000, 'min' => 0, 'label' => ['en' => 'Free shipping threshold (UAH)', 'uk' => 'Поріг безкоштовної доставки (грн)']],
                    'floatingWidget' => ['type' => 'boolean', 'default' => true, 'label' => ['en' => 'Floating widget', 'uk' => 'Плаваючий віджет']],
                    'desktopIconOnly' => ['type' => 'boolean', 'default' => false, 'label' => ['en' => 'Icon only on desktop', 'uk' => 'Тільки іконка на десктопі']],
                    'background' => ['type' => 'color', 'default' => '#172554', 'label' => ['en' => 'Background', 'uk' => 'Фон']],
                    'achievedBackground' => ['type' => 'color', 'default' => '#14532d', 'label' => ['en' => 'Background (achieved)', 'uk' => 'Фон (досягнуто)']],
                    'textColor' => ['type' => 'color', 'default' => '#bfdbfe', 'label' => ['en' => 'Text color', 'uk' => 'Колір тексту']],
                    'positionDesktop' => [
                        'type' => 'group',
                        'label' => ['en' => 'Position (desktop)', 'uk' => 'Позиція (десктоп)'],
                        'fields' => [
                            'right' => ['type' => 'number', 'default' => 16, 'label' => ['en' => 'Right (px)', 'uk' => 'Справа (пкс)']],
                            'bottom' => ['type' => 'number', 'default' => 25, 'label' => ['en' => 'Bottom (px)', 'uk' => 'Знизу (пкс)']],
                        ],
                    ],
                    'positionMobile' => [
                        'type' => 'group',
                        'label' => ['en' => 'Position (mobile)', 'uk' => 'Позиція (мобільний)'],
                        'fields' => [
                            'left' => ['type' => 'number', 'default' => 16, 'label' => ['en' => 'Left (px)', 'uk' => 'Зліва (пкс)']],
                            'bottom' => ['type' => 'number', 'default' => 25, 'label' => ['en' => 'Bottom (px)', 'uk' => 'Знизу (пкс)']],
                        ],
                    ],
                ],
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
