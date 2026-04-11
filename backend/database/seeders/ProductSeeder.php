<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // Remove stale widgets that no longer exist as real builder modules
        Product::whereNotIn('slug', [
            'promo-line',
            'delivery-day',
            'freeship-goal',
            'minorder-goal',
            'one-plus-one-deal',
            'video-preview',
            'buyer-count',
        ])->delete();

        $products = [
            [
                'slug' => 'promo-line',
                'name' => ['en' => 'PromoLine', 'uk' => 'Промо-стрічка'],
                'description' => ['en' => 'Scrolling announcement bar at the top of the site', 'uk' => 'Прокручуваний рядок з оголошеннями вгорі сайту'],
                'icon' => 'megaphone',
                'tag_slug' => 'engagement',
                'is_popular' => true,
                'is_new' => false,
                'builder_module' => 'marquee',
                'sort_order' => 0,
                'config_schema' => [
                    'enabled' => ['type' => 'boolean', 'default' => true, 'label' => ['en' => 'Enabled', 'uk' => 'Увімкнено']],
                    'speed' => ['type' => 'number', 'default' => 80, 'label' => ['en' => 'Scroll speed (px/s)', 'uk' => 'Швидкість прокрутки (пкс/с)']],
                    'height' => ['type' => 'number', 'default' => 36, 'min' => 20, 'max' => 100, 'label' => ['en' => 'Height (px)', 'uk' => 'Висота (пкс)']],
                    'zIndex' => ['type' => 'number', 'default' => 999, 'label' => ['en' => 'Z-index', 'uk' => 'Z-індекс']],
                    'mode' => ['type' => 'select', 'options' => ['shift', 'overlay'], 'default' => 'shift', 'label' => ['en' => 'Display mode', 'uk' => 'Режим відображення']],
                    'ttlHours' => ['type' => 'number', 'default' => 24, 'min' => 1, 'max' => 168, 'label' => ['en' => 'Show once per N hours', 'uk' => 'Показувати раз на N годин']],
                    'isFixed' => ['type' => 'boolean', 'default' => true, 'label' => ['en' => 'Fixed position', 'uk' => 'Фіксована позиція']],
                    'mount' => [
                        'type' => 'group',
                        'label' => ['en' => 'Mount point', 'uk' => 'Точка монтування'],
                        'fields' => [
                            'selector' => ['type' => 'string', 'default' => '', 'label' => ['en' => 'CSS selector', 'uk' => 'CSS-селектор']],
                            'insert' => ['type' => 'select', 'options' => ['before', 'after'], 'default' => 'before', 'label' => ['en' => 'Insert position', 'uk' => 'Позиція вставки']],
                        ],
                    ],
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
                'slug' => 'delivery-day',
                'name' => ['en' => 'DeliveryDay', 'uk' => 'Дата доставки'],
                'description' => ['en' => 'Show expected delivery date on product pages', 'uk' => 'Показує очікувану дату доставки на сторінці товару'],
                'icon' => 'truck',
                'tag_slug' => 'trust',
                'is_popular' => false,
                'is_new' => true,
                'builder_module' => 'delivery-date',
                'sort_order' => 1,
                'config_schema' => [
                    'enabled' => ['type' => 'boolean', 'default' => true, 'label' => ['en' => 'Enabled', 'uk' => 'Увімкнено']],
                    'offsetDays' => ['type' => 'number', 'default' => 3, 'min' => 0, 'max' => 30, 'label' => ['en' => 'Delivery offset (days)', 'uk' => 'Зсув доставки (дні)']],
                    'selectors' => [
                        'type' => 'selectors',
                        'default' => [
                            [
                                'selector' => '#page > main > div > div.product__grid > div.product__column.product__column--right > div.product__block.product__block--orderBox.j-product-block > div > div.product-card.product-card--main > div',
                                'insert' => 'before',
                            ],
                            [
                                'selector' => '#main > div.wrapper > section > div > div.product__column.product__column--right.product__column--sticky > div > div:nth-child(1) > div > div:nth-child(5)',
                                'insert' => 'after',
                            ],
                        ],
                        'label' => ['en' => 'DOM selectors', 'uk' => 'DOM-селектори'],
                    ],
                ],
            ],
            [
                'slug' => 'freeship-goal',
                'name' => ['en' => 'FreeShip Goal', 'uk' => 'До безкоштовної доставки'],
                'description' => ['en' => 'Floating progress bar showing how much more to spend for free shipping', 'uk' => 'Плаваючий прогрес-бар показує скільки залишилось до безкоштовної доставки'],
                'icon' => 'package',
                'tag_slug' => 'conversion',
                'is_popular' => true,
                'is_new' => false,
                'builder_module' => 'cart-goal',
                'sort_order' => 2,
                'config_schema' => [
                    'enabled' => ['type' => 'boolean', 'default' => true, 'label' => ['en' => 'Enabled', 'uk' => 'Увімкнено']],
                    'threshold' => ['type' => 'number', 'default' => 1000, 'min' => 0, 'label' => ['en' => 'Free shipping threshold (UAH)', 'uk' => 'Поріг безкоштовної доставки (грн)']],
                    'minimum' => ['type' => 'number', 'default' => 0, 'min' => 0, 'label' => ['en' => 'Minimum order amount (UAH)', 'uk' => 'Мінімальна сума замовлення (грн)']],
                    'floatingWidget' => ['type' => 'boolean', 'default' => true, 'label' => ['en' => 'Floating widget', 'uk' => 'Плаваючий віджет']],
                    'background' => ['type' => 'color', 'default' => '#172554', 'label' => ['en' => 'Background', 'uk' => 'Фон']],
                    'achievedBackground' => ['type' => 'color', 'default' => '#14532d', 'label' => ['en' => 'Background (achieved)', 'uk' => 'Фон (досягнуто)']],
                    'textColor' => ['type' => 'color', 'default' => '#bfdbfe', 'label' => ['en' => 'Text color', 'uk' => 'Колір тексту']],
                    'shakeInterval' => ['type' => 'number', 'default' => 3000, 'min' => 0, 'label' => ['en' => 'Shake interval (ms)', 'uk' => 'Інтервал тряски (мс)']],
                    'desktopIconOnly' => ['type' => 'boolean', 'default' => false, 'label' => ['en' => 'Icon only on desktop', 'uk' => 'Тільки іконка на десктопі']],
                    'zIndex' => ['type' => 'number', 'default' => 999, 'label' => ['en' => 'Z-index', 'uk' => 'Z-індекс']],
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
            [
                'slug' => 'minorder-goal',
                'name' => ['en' => 'MinOrder Goal', 'uk' => 'Мінімальне замовлення'],
                'description' => ['en' => 'Floating progress bar for minimum order threshold', 'uk' => 'Плаваючий прогрес-бар для мінімальної суми замовлення'],
                'icon' => 'shopping-cart',
                'tag_slug' => 'conversion',
                'is_popular' => false,
                'is_new' => false,
                'builder_module' => 'min-order',
                'sort_order' => 3,
                'config_schema' => [
                    'enabled' => ['type' => 'boolean', 'default' => true, 'label' => ['en' => 'Enabled', 'uk' => 'Увімкнено']],
                    'threshold' => ['type' => 'number', 'default' => 500, 'min' => 0, 'label' => ['en' => 'Minimum order threshold (UAH)', 'uk' => 'Мінімальна сума замовлення (грн)']],
                    'background' => ['type' => 'color', 'default' => '#431407', 'label' => ['en' => 'Background', 'uk' => 'Фон']],
                    'achievedBackground' => ['type' => 'color', 'default' => '#14532d', 'label' => ['en' => 'Background (achieved)', 'uk' => 'Фон (досягнуто)']],
                    'textColor' => ['type' => 'color', 'default' => '#fed7aa', 'label' => ['en' => 'Text color', 'uk' => 'Колір тексту']],
                    'zIndex' => ['type' => 'number', 'default' => 999, 'label' => ['en' => 'Z-index', 'uk' => 'Z-індекс']],
                    'floatingWidget' => ['type' => 'boolean', 'default' => true, 'label' => ['en' => 'Floating widget', 'uk' => 'Плаваючий віджет']],
                    'shakeInterval' => ['type' => 'number', 'default' => 3000, 'min' => 0, 'label' => ['en' => 'Shake interval (ms)', 'uk' => 'Інтервал тряски (мс)']],
                    'desktopIconOnly' => ['type' => 'boolean', 'default' => true, 'label' => ['en' => 'Icon only on desktop', 'uk' => 'Тільки іконка на десктопі']],
                    'positionDesktop' => [
                        'type' => 'group',
                        'label' => ['en' => 'Position (desktop)', 'uk' => 'Позиція (десктоп)'],
                        'fields' => [
                            'left' => ['type' => 'number', 'default' => 16, 'label' => ['en' => 'Left (px)', 'uk' => 'Зліва (пкс)']],
                            'bottom' => ['type' => 'number', 'default' => 65, 'label' => ['en' => 'Bottom (px)', 'uk' => 'Знизу (пкс)']],
                        ],
                    ],
                    'positionMobile' => [
                        'type' => 'group',
                        'label' => ['en' => 'Position (mobile)', 'uk' => 'Позиція (мобільний)'],
                        'fields' => [
                            'left' => ['type' => 'number', 'default' => 16, 'label' => ['en' => 'Left (px)', 'uk' => 'Зліва (пкс)']],
                            'bottom' => ['type' => 'number', 'default' => 65, 'label' => ['en' => 'Bottom (px)', 'uk' => 'Знизу (пкс)']],
                        ],
                    ],
                ],
            ],
            [
                'slug' => 'one-plus-one-deal',
                'name' => ['en' => '1+1=3 Deal', 'uk' => '1+1=3 акція'],
                'description' => ['en' => 'Buy 2 products — cheapest one for 1 UAH. Increases average order value', 'uk' => 'Купи два товари — найдешевший у кошику за 1 гривню. Збільшує середній чек'],
                'icon' => 'gift',
                'tag_slug' => 'conversion',
                'is_popular' => false,
                'is_new' => true,
                'builder_module' => 'one-plus-one',
                'sort_order' => 4,
                'config_schema' => [
                    'enabled' => ['type' => 'boolean', 'default' => true, 'label' => ['en' => 'Enabled', 'uk' => 'Увімкнено']],
                    'apiUrl' => ['type' => 'string', 'default' => 'https://widgetality.com', 'label' => ['en' => 'API URL', 'uk' => 'URL API']],
                    'site' => ['type' => 'string', 'default' => '', 'label' => ['en' => 'Site domain', 'uk' => 'Домен сайту']],
                ],
            ],
            [
                'slug' => 'video-preview',
                'name' => ['en' => 'VideoPreview', 'uk' => 'Відео товару'],
                'description' => ['en' => 'Floating product video preview in the corner of the page', 'uk' => 'Плаваючий відео-превʼю товару в куті сторінки'],
                'icon' => 'video',
                'tag_slug' => 'engagement',
                'is_popular' => false,
                'is_new' => true,
                'builder_module' => 'product-video-preview',
                'sort_order' => 5,
                'config_schema' => [
                    'enabled' => ['type' => 'boolean', 'default' => true, 'label' => ['en' => 'Enabled', 'uk' => 'Увімкнено']],
                    'testVideoUrl' => ['type' => 'string', 'default' => 'https://lzrv.agency/pila.mp4', 'label' => ['en' => 'Test video URL', 'uk' => 'URL тестового відео']],
                    'mp4Selector' => ['type' => 'string', 'default' => 'a[href$=".mp4"]', 'label' => ['en' => 'MP4 link selector', 'uk' => 'Селектор MP4-посилання']],
                    'desktopSize' => ['type' => 'number', 'default' => 180, 'min' => 80, 'max' => 400, 'label' => ['en' => 'Desktop size (px)', 'uk' => 'Розмір на десктопі (пкс)']],
                    'mobileSize' => ['type' => 'number', 'default' => 160, 'min' => 60, 'max' => 300, 'label' => ['en' => 'Mobile size (px)', 'uk' => 'Розмір на мобільному (пкс)']],
                    'desktopMinimizedSize' => ['type' => 'number', 'default' => 140, 'min' => 60, 'max' => 300, 'label' => ['en' => 'Desktop minimized size (px)', 'uk' => 'Згорнутий розмір на десктопі (пкс)']],
                    'mobileMinimizedSize' => ['type' => 'number', 'default' => 120, 'min' => 40, 'max' => 200, 'label' => ['en' => 'Mobile minimized size (px)', 'uk' => 'Згорнутий розмір на мобільному (пкс)']],
                    'insetDesktop' => ['type' => 'number', 'default' => 30, 'min' => 0, 'label' => ['en' => 'Inset desktop (px)', 'uk' => 'Відступ на десктопі (пкс)']],
                    'insetMobile' => ['type' => 'number', 'default' => 15, 'min' => 0, 'label' => ['en' => 'Inset mobile (px)', 'uk' => 'Відступ на мобільному (пкс)']],
                    'borderColor' => ['type' => 'color', 'default' => '#7c3aed', 'label' => ['en' => 'Border color', 'uk' => 'Колір рамки']],
                    'observeSpa' => ['type' => 'boolean', 'default' => true, 'label' => ['en' => 'Observe SPA navigation', 'uk' => 'Відстежувати SPA-навігацію']],
                    'showOnMobile' => ['type' => 'boolean', 'default' => true, 'label' => ['en' => 'Show on mobile', 'uk' => 'Показувати на мобільному']],
                    'showOnDesktop' => ['type' => 'boolean', 'default' => true, 'label' => ['en' => 'Show on desktop', 'uk' => 'Показувати на десктопі']],
                ],
            ],
            [
                'slug' => 'buyer-count',
                'name' => ['en' => 'BuyerCount', 'uk' => 'Бейдж продажів'],
                'description' => ['en' => 'Shows how many people bought this product, updates in real time', 'uk' => 'Показує скільки людей купили цей товар, оновлюється в реальному часі'],
                'icon' => 'users',
                'tag_slug' => 'social-proof',
                'is_popular' => true,
                'is_new' => false,
                'builder_module' => 'social-proof',
                'sort_order' => 6,
                'config_schema' => [
                    'enabled' => ['type' => 'boolean', 'default' => true, 'label' => ['en' => 'Enabled', 'uk' => 'Увімкнено']],
                    'selectors' => [
                        'type' => 'selectors',
                        'default' => [
                            [
                                'selector' => '#page > main > div > div.product__grid > div.product__column.product__column--right > div.product__block.product__block--orderBox.j-product-block > div > div.product-card.product-card--main > div.product-card__body > div.product-card__price-box',
                                'insert' => 'after',
                            ],
                        ],
                        'label' => ['en' => 'DOM selectors', 'uk' => 'DOM-селектори'],
                    ],
                    'minCount' => ['type' => 'number', 'default' => 8, 'min' => 1, 'max' => 999, 'label' => ['en' => 'Min count to show', 'uk' => 'Мін. кількість для показу']],
                    'maxCount' => ['type' => 'number', 'default' => 50, 'min' => 1, 'max' => 999, 'label' => ['en' => 'Max count to show', 'uk' => 'Макс. кількість для показу']],
                    'updateInterval' => ['type' => 'number', 'default' => 45, 'min' => 5, 'max' => 300, 'label' => ['en' => 'Update interval (sec)', 'uk' => 'Інтервал оновлення (сек)']],
                    'showForOutOfStock' => ['type' => 'boolean', 'default' => false, 'label' => ['en' => 'Show for out-of-stock', 'uk' => 'Показувати для товарів не в наявності']],
                    'backgroundColor' => ['type' => 'color', 'default' => '#4c1d95', 'label' => ['en' => 'Background', 'uk' => 'Фон']],
                    'textColor' => ['type' => 'color', 'default' => '#ede9fe', 'label' => ['en' => 'Text color', 'uk' => 'Колір тексту']],
                ],
            ],
        ];

        foreach ($products as $data) {
            Product::updateOrCreate(
                ['slug' => $data['slug']],
                array_merge([
                    'platform' => 'horoshop',
                    'status' => 'active',
                    'availability' => 'available',
                    'is_popular' => false,
                    'is_new' => false,
                ], $data),
            );
        }
    }
}
