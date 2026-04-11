<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\BillingPeriod;
use App\Enums\NotificationType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\ReviewStatus;
use App\Enums\SiteStatus;
use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use App\Models\ActivityLog;
use App\Models\AppNotification;
use App\Models\CustomerCase;
use App\Models\DemoSession;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Review;
use App\Models\Site;
use App\Models\SiteScript;
use App\Models\SiteWidget;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $plans = Plan::query()->get()->keyBy('slug');
        $products = Product::query()->get()->keyBy('slug');

        /** @var Plan $proPlan */
        $proPlan = $plans->get('pro');
        /** @var Plan $basicPlan */
        $basicPlan = $plans->get('basic');
        /** @var Plan $maxPlan */
        $maxPlan = $plans->get('max');

        if (!$proPlan || !$basicPlan || !$maxPlan) {
            return;
        }

        $customers = $this->seedCustomers();
        $primaryUser = $customers['primary'];

        $this->seedPrimarySubscription($primaryUser, $proPlan, $now);
        $this->seedSecondarySubscriptions($customers, $basicPlan, $maxPlan, $now);
        $this->seedPrimarySitesAndWidgets($primaryUser, $products, $now);
        $this->seedOrdersAndPayments($customers, $plans, $now);
        $this->seedReviews($customers, $now);
        $this->seedCustomerCases($now);
        $this->seedNotifications($primaryUser, $now);
        $this->seedActivity($primaryUser, $now);
        $this->seedDemoSession($primaryUser, $now);
    }

    /**
     * @return array<string, User>
     */
    public function seedCustomers(): array
    {
        $rows = [
            'primary' => [
                'name' => 'Andrii Kovalenko',
                'email' => 'andrii.kovalenko@widgetis.test',
                'phone' => '+380671234501',
                'telegram' => '@andrii_store',
                'company' => 'Kovalenko Outdoor',
                'timezone' => 'Europe/Warsaw',
                'locale' => 'uk',
                'two_factor_enabled' => true,
            ],
            'olena' => [
                'name' => 'Olena Moroz',
                'email' => 'olena.moroz@widgetis.test',
                'phone' => '+380671234502',
                'telegram' => '@olena_mrz',
                'company' => 'Mori Kids',
                'timezone' => 'Europe/Kyiv',
                'locale' => 'uk',
                'two_factor_enabled' => false,
            ],
            'dmytro' => [
                'name' => 'Dmytro Polishchuk',
                'email' => 'dmytro.polishchuk@widgetis.test',
                'phone' => '+380671234503',
                'telegram' => '@dmytro_shop',
                'company' => 'Urban Craft UA',
                'timezone' => 'Europe/Kyiv',
                'locale' => 'uk',
                'two_factor_enabled' => false,
            ],
            'kateryna' => [
                'name' => 'Kateryna Bilous',
                'email' => 'kateryna.bilous@widgetis.test',
                'phone' => '+380671234504',
                'telegram' => '@kate_bilous',
                'company' => 'Bilo Home Studio',
                'timezone' => 'Europe/Kyiv',
                'locale' => 'uk',
                'two_factor_enabled' => true,
            ],
            'roman' => [
                'name' => 'Roman Koval',
                'email' => 'roman.koval@widgetis.test',
                'phone' => '+380671234505',
                'telegram' => '@roman_goods',
                'company' => 'Koval Bike Parts',
                'timezone' => 'Europe/Kyiv',
                'locale' => 'uk',
                'two_factor_enabled' => false,
            ],
        ];

        $customers = [];

        foreach ($rows as $key => $row) {
            $user = User::updateOrCreate(
                ['email' => $row['email']],
                [
                    'name' => $row['name'],
                    'phone' => $row['phone'],
                    'telegram' => $row['telegram'],
                    'company' => $row['company'],
                    'timezone' => $row['timezone'],
                    'locale' => $row['locale'],
                    'two_factor_enabled' => $row['two_factor_enabled'],
                    'two_factor_method' => 'email',
                    'notification_enabled' => true,
                    'email_verified_at' => now()->subDays(30),
                    'phone_verified_at' => now()->subDays(30),
                    'onboarding_completed_at' => now()->subDays(20),
                    'password' => Hash::make('widgetis123'),
                ],
            );

            $user->assignRole(UserRole::Customer->value);
            $customers[$key] = $user;
        }

        return $customers;
    }

    private function seedPrimarySubscription(User $user, Plan $plan, Carbon $now): Subscription
    {
        return Subscription::updateOrCreate(
            ['user_id' => $user->id],
            [
                'plan_id' => $plan->id,
                'billing_period' => BillingPeriod::Monthly->value,
                'status' => SubscriptionStatus::Trial->value,
                'is_trial' => true,
                'trial_ends_at' => $now->copy()->addDays(5),
                'current_period_start' => $now->copy()->subDays(2),
                'current_period_end' => $now->copy()->addDays(5),
                'cancelled_at' => null,
                'cancel_reason' => null,
                'grace_period_ends_at' => null,
                'payment_retry_count' => 0,
                'next_payment_retry_at' => null,
                'payment_provider' => 'liqpay',
                'payment_provider_subscription_id' => 'sub_trial_andrii_001',
            ],
        );
    }

    /**
     * @param array<string, User> $customers
     */
    private function seedSecondarySubscriptions(array $customers, Plan $basicPlan, Plan $maxPlan, Carbon $now): void
    {
        Subscription::updateOrCreate(
            ['user_id' => $customers['olena']->id],
            [
                'plan_id' => $basicPlan->id,
                'billing_period' => BillingPeriod::Monthly->value,
                'status' => SubscriptionStatus::Active->value,
                'is_trial' => false,
                'trial_ends_at' => null,
                'current_period_start' => $now->copy()->subDays(11),
                'current_period_end' => $now->copy()->addDays(19),
                'payment_provider' => 'liqpay',
                'payment_provider_subscription_id' => 'sub_olena_basic_002',
            ],
        );

        Subscription::updateOrCreate(
            ['user_id' => $customers['dmytro']->id],
            [
                'plan_id' => $maxPlan->id,
                'billing_period' => BillingPeriod::Yearly->value,
                'status' => SubscriptionStatus::Active->value,
                'is_trial' => false,
                'trial_ends_at' => null,
                'current_period_start' => $now->copy()->subDays(78),
                'current_period_end' => $now->copy()->addDays(287),
                'payment_provider' => 'stripe',
                'payment_provider_subscription_id' => 'sub_dmytro_max_003',
            ],
        );

        Subscription::updateOrCreate(
            ['user_id' => $customers['kateryna']->id],
            [
                'plan_id' => $basicPlan->id,
                'billing_period' => BillingPeriod::Monthly->value,
                'status' => SubscriptionStatus::PastDue->value,
                'is_trial' => false,
                'trial_ends_at' => null,
                'current_period_start' => $now->copy()->subDays(33),
                'current_period_end' => $now->copy()->subDays(2),
                'payment_retry_count' => 1,
                'next_payment_retry_at' => $now->copy()->addDay(),
                'payment_provider' => 'liqpay',
                'payment_provider_subscription_id' => 'sub_kateryna_basic_004',
            ],
        );

        Subscription::updateOrCreate(
            ['user_id' => $customers['roman']->id],
            [
                'plan_id' => $basicPlan->id,
                'billing_period' => BillingPeriod::Monthly->value,
                'status' => SubscriptionStatus::Cancelled->value,
                'is_trial' => false,
                'trial_ends_at' => null,
                'current_period_start' => $now->copy()->subDays(35),
                'current_period_end' => $now->copy()->addDays(2),
                'cancelled_at' => $now->copy()->subDays(5),
                'cancel_reason' => 'Store paused for seasonal break',
                'payment_provider' => 'liqpay',
                'payment_provider_subscription_id' => 'sub_roman_basic_005',
            ],
        );
    }

    /**
     * @param \Illuminate\Support\Collection<string, Product> $products
     */
    private function seedPrimarySitesAndWidgets(User $user, $products, Carbon $now): void
    {
        $sites = [
            [
                'name' => 'Kovalenko Outdoor',
                'domain' => 'kovalenko-outdoor.com',
                'url' => 'https://kovalenko-outdoor.com',
                'platform' => 'horoshop',
                'status' => SiteStatus::Active->value,
                'script_installed' => true,
                'script_installed_at' => $now->copy()->subDays(5),
                'connected_at' => $now->copy()->subDays(5),
            ],
            [
                'name' => 'Kovalenko Outlet',
                'domain' => 'outlet.kovalenko-outdoor.com',
                'url' => 'https://outlet.kovalenko-outdoor.com',
                'platform' => 'horoshop',
                'status' => SiteStatus::Active->value,
                'script_installed' => true,
                'script_installed_at' => $now->copy()->subDays(3),
                'connected_at' => $now->copy()->subDays(3),
            ],
            [
                'name' => 'Kovalenko Test Store',
                'domain' => 'staging.kovalenko-outdoor.com',
                'url' => 'https://staging.kovalenko-outdoor.com',
                'platform' => 'shopify',
                'status' => SiteStatus::Pending->value,
                'script_installed' => false,
                'script_installed_at' => null,
                'connected_at' => null,
            ],
        ];

        /** @var array<string, Site> $createdSites */
        $createdSites = [];

        foreach ($sites as $row) {
            $site = Site::updateOrCreate(
                ['user_id' => $user->id, 'domain' => $row['domain']],
                [
                    'name' => $row['name'],
                    'url' => $row['url'],
                    'platform' => $row['platform'],
                    'status' => $row['status'],
                    'script_installed' => $row['script_installed'],
                    'script_installed_at' => $row['script_installed_at'],
                    'connected_at' => $row['connected_at'],
                    'deactivated_at' => null,
                ],
            );

            SiteScript::updateOrCreate(
                ['site_id' => $site->id],
                [
                    'token' => hash('sha256', 'widgetis-' . $site->domain),
                    'is_active' => $site->status === SiteStatus::Active,
                ],
            );

            $createdSites[$row['domain']] = $site;
        }

        $countdown = $products->get('countdown-timer');
        $marquee = $products->get('marquee');
        $deliveryDate = $products->get('delivery-date');
        $purchaseNotification = $products->get('purchase-notification');

        if ($countdown && $marquee && $deliveryDate && $purchaseNotification) {
            $mainSite = $createdSites['kovalenko-outdoor.com'];

            SiteWidget::updateOrCreate(
                ['site_id' => $mainSite->id, 'product_id' => $countdown->id],
                [
                    'is_enabled' => true,
                    'config' => [
                        'theme' => 'dark',
                        'position' => 'top',
                        'label' => [
                            'uk' => 'Весняний розпродаж закінчиться через:',
                            'en' => 'Spring sale ends in:',
                        ],
                        'timezone' => 'Europe/Warsaw',
                        'end_at' => $now->copy()->addHours(46)->toIso8601String(),
                    ],
                    'enabled_at' => $now->copy()->subDays(2),
                    'disabled_at' => null,
                ],
            );

            SiteWidget::updateOrCreate(
                ['site_id' => $mainSite->id, 'product_id' => $marquee->id],
                [
                    'is_enabled' => true,
                    'config' => [
                        'speed' => 45,
                        'messages' => [
                            'uk' => ['Безкоштовна доставка від 1500 грн', 'Повернення 30 днів'],
                            'en' => ['Free shipping from 1500 UAH', '30-day return policy'],
                        ],
                    ],
                    'enabled_at' => $now->copy()->subDays(5),
                    'disabled_at' => null,
                ],
            );

            SiteWidget::updateOrCreate(
                ['site_id' => $mainSite->id, 'product_id' => $deliveryDate->id],
                [
                    'is_enabled' => true,
                    'config' => [
                        'estimate_days_min' => 1,
                        'estimate_days_max' => 3,
                        'cutoff_hour' => 16,
                    ],
                    'enabled_at' => $now->copy()->subDays(5),
                    'disabled_at' => null,
                ],
            );

            $outletSite = $createdSites['outlet.kovalenko-outdoor.com'];

            SiteWidget::updateOrCreate(
                ['site_id' => $outletSite->id, 'product_id' => $purchaseNotification->id],
                [
                    'is_enabled' => true,
                    'config' => [
                        'interval_sec' => 20,
                        'max_visible' => 1,
                        'cities' => ['Kyiv', 'Lviv', 'Dnipro', 'Odesa'],
                    ],
                    'enabled_at' => $now->copy()->subDay(),
                    'disabled_at' => null,
                ],
            );
        }
    }

    /**
     * @param array<string, User> $customers
     * @param \Illuminate\Support\Collection<string, Plan> $plans
     */
    private function seedOrdersAndPayments(array $customers, $plans, Carbon $now): void
    {
        $primary = $customers['primary'];
        $olena = $customers['olena'];
        $dmytro = $customers['dmytro'];
        $kateryna = $customers['kateryna'];

        $primarySubscription = $primary->subscription;
        $olenaSubscription = $olena->subscription;
        $dmytroSubscription = $dmytro->subscription;
        $katerynaSubscription = $kateryna->subscription;

        $proPlan = $plans->get('pro');
        $basicPlan = $plans->get('basic');
        $maxPlan = $plans->get('max');

        if (!$primarySubscription || !$olenaSubscription || !$dmytroSubscription || !$katerynaSubscription || !$proPlan || !$basicPlan || !$maxPlan) {
            return;
        }

        $orders = [
            [
                'order_number' => 'WTY-2026-0001',
                'user_id' => $olena->id,
                'plan_id' => $basicPlan->id,
                'billing_period' => BillingPeriod::Monthly->value,
                'amount' => 799,
                'status' => OrderStatus::Completed->value,
                'payment_method' => 'card',
                'payment_provider' => 'liqpay',
                'transaction_id' => 'LP-OLENA-0001',
                'paid_at' => $now->copy()->subDays(10),
            ],
            [
                'order_number' => 'WTY-2026-0002',
                'user_id' => $dmytro->id,
                'plan_id' => $maxPlan->id,
                'billing_period' => BillingPeriod::Yearly->value,
                'amount' => 28990,
                'status' => OrderStatus::Completed->value,
                'payment_method' => 'visa',
                'payment_provider' => 'stripe',
                'transaction_id' => 'ST-DMYTRO-0002',
                'paid_at' => $now->copy()->subDays(75),
            ],
            [
                'order_number' => 'WTY-2026-0003',
                'user_id' => $kateryna->id,
                'plan_id' => $basicPlan->id,
                'billing_period' => BillingPeriod::Monthly->value,
                'amount' => 799,
                'status' => OrderStatus::Pending->value,
                'payment_method' => 'card',
                'payment_provider' => 'liqpay',
                'transaction_id' => 'LP-KATERYNA-0003',
                'paid_at' => null,
            ],
            [
                'order_number' => 'WTY-2026-0004',
                'user_id' => $primary->id,
                'plan_id' => $proPlan->id,
                'billing_period' => BillingPeriod::Monthly->value,
                'amount' => 1599,
                'status' => OrderStatus::Pending->value,
                'payment_method' => 'card',
                'payment_provider' => 'liqpay',
                'transaction_id' => 'LP-ANDRII-0004',
                'paid_at' => null,
            ],
        ];

        $orderByNumber = [];

        foreach ($orders as $row) {
            $order = Order::updateOrCreate(
                ['order_number' => $row['order_number']],
                [
                    'user_id' => $row['user_id'],
                    'plan_id' => $row['plan_id'],
                    'billing_period' => $row['billing_period'],
                    'amount' => $row['amount'],
                    'discount_amount' => 0,
                    'currency' => 'UAH',
                    'status' => $row['status'],
                    'payment_provider' => $row['payment_provider'],
                    'payment_method' => $row['payment_method'],
                    'transaction_id' => $row['transaction_id'],
                    'paid_at' => $row['paid_at'],
                    'refunded_at' => null,
                    'notes' => [
                        'source' => 'seed',
                        'comment' => 'Synthetic realistic order',
                    ],
                ],
            );

            $orderByNumber[$row['order_number']] = $order;
        }

        $payments = [
            [
                'transaction_id' => 'PAY-TRIAL-ANDRII-0001',
                'user_id' => $primary->id,
                'order_id' => $orderByNumber['WTY-2026-0004']->id,
                'subscription_id' => $primarySubscription->id,
                'type' => PaymentType::TrialActivation->value,
                'amount' => 0,
                'status' => PaymentStatus::Success->value,
                'created_at' => $now->copy()->subDays(2),
            ],
            [
                'transaction_id' => 'PAY-OLENA-0001',
                'user_id' => $olena->id,
                'order_id' => $orderByNumber['WTY-2026-0001']->id,
                'subscription_id' => $olenaSubscription->id,
                'type' => PaymentType::Charge->value,
                'amount' => 799,
                'status' => PaymentStatus::Success->value,
                'created_at' => $now->copy()->subDays(10),
            ],
            [
                'transaction_id' => 'PAY-DMYTRO-0002',
                'user_id' => $dmytro->id,
                'order_id' => $orderByNumber['WTY-2026-0002']->id,
                'subscription_id' => $dmytroSubscription->id,
                'type' => PaymentType::Charge->value,
                'amount' => 28990,
                'status' => PaymentStatus::Success->value,
                'created_at' => $now->copy()->subDays(75),
            ],
            [
                'transaction_id' => 'PAY-KATERYNA-0003',
                'user_id' => $kateryna->id,
                'order_id' => $orderByNumber['WTY-2026-0003']->id,
                'subscription_id' => $katerynaSubscription->id,
                'type' => PaymentType::Charge->value,
                'amount' => 799,
                'status' => PaymentStatus::Failed->value,
                'created_at' => $now->copy()->subDays(2),
            ],
        ];

        foreach ($payments as $row) {
            Payment::updateOrCreate(
                ['transaction_id' => $row['transaction_id']],
                [
                    'user_id' => $row['user_id'],
                    'order_id' => $row['order_id'],
                    'subscription_id' => $row['subscription_id'],
                    'type' => $row['type'],
                    'amount' => $row['amount'],
                    'currency' => 'UAH',
                    'status' => $row['status'],
                    'payment_provider' => 'liqpay',
                    'payment_method' => 'card',
                    'description' => [
                        'uk' => 'Оплата підписки Widgetis',
                        'en' => 'Widgetis subscription payment',
                    ],
                    'metadata' => [
                        'source' => 'seed',
                    ],
                    'created_at' => $row['created_at'],
                    'updated_at' => $row['created_at'],
                ],
            );
        }
    }

    /**
     * @param array<string, User> $customers
     */
    public function seedReviews(array $customers, Carbon $now): void
    {
        $reviewRows = [
            [
                'user' => 'primary',
                'rating' => 5,
                'title' => 'Конверсія виросла за тиждень',
                'body' => 'Після запуску таймера і попапів з покупками отримали +11% до оформлень за 7 днів.',
                'status' => ReviewStatus::Approved->value,
                'created_at' => $now->copy()->subDays(3),
            ],
            [
                'user' => 'olena',
                'rating' => 5,
                'title' => 'Дуже швидкий старт',
                'body' => 'Підключення скрипта зайняло 10 хвилин, усе зʼявилось на сайті відразу.',
                'status' => ReviewStatus::Approved->value,
                'created_at' => $now->copy()->subDays(12),
            ],
            [
                'user' => 'dmytro',
                'rating' => 4,
                'title' => 'Нормально для великого каталогу',
                'body' => 'На 25 тисячах SKU працює стабільно, особливо сподобався delivery date.',
                'status' => ReviewStatus::Approved->value,
                'created_at' => $now->copy()->subDays(21),
            ],
            [
                'user' => 'roman',
                'rating' => 4,
                'title' => 'Підтримка реально відповідає',
                'body' => 'Попросив допомогу з налаштуванням, менеджер відповів в телеграмі за 12 хвилин.',
                'status' => ReviewStatus::Approved->value,
                'created_at' => $now->copy()->subDays(8),
            ],
        ];

        foreach ($reviewRows as $row) {
            $user = $customers[$row['user']];

            Review::updateOrCreate(
                ['user_id' => $user->id, 'title' => $row['title']],
                [
                    'rating' => $row['rating'],
                    'body' => $row['body'],
                    'status' => $row['status'],
                    'created_at' => $row['created_at'],
                    'updated_at' => $row['created_at'],
                ],
            );
        }
    }

    public function seedCustomerCases(Carbon $now): void
    {
        $cases = [
            [
                'store' => 'ptashkinsad.com',
                'store_url' => 'https://ptashkinsad.com',
                'owner' => 'Ptashkin Sad',
                'platform' => 'horoshop',
                'description' => [
                    'uk' => 'Органічна косметика та догляд',
                    'en' => 'Organic cosmetics and skincare',
                ],
                'review_text' => 'Покупці перестали кидати кошики на півдорозі — бачать прогрес до безкоштовної доставки і докидають ще один товар.',
                'review_rating' => 5,
                'result_metric' => '+18% середній чек',
                'result_period' => 'за 2 місяці',
                'color' => '#10b981',
                'widgets' => ['Бігуча стрічка', 'Дата доставки', 'Ціль кошика'],
                'sort_order' => 1,
            ],
            [
                'store' => 'benihome.com.ua',
                'store_url' => 'https://benihome.com.ua',
                'owner' => 'Beni Home',
                'platform' => 'horoshop',
                'description' => [
                    'uk' => 'Преміум постільна білизна та текстиль',
                    'en' => 'Premium bed linen and textiles',
                ],
                'review_text' => 'Відео-прев\'ю товару на картці працює як магніт — люди дивляться довше, довіряють більше. Конверсія виросла одразу.',
                'review_rating' => 5,
                'result_metric' => '+24% конверсія',
                'result_period' => 'за 3 місяці',
                'color' => '#f59e0b',
                'widgets' => ['Бігуча стрічка', 'Відео-прев\'ю', 'Хто зараз дивиться'],
                'sort_order' => 2,
            ],
            [
                'store' => 'ballistic.com.ua',
                'store_url' => 'https://ballistic.com.ua',
                'owner' => 'Ballistic',
                'platform' => 'horoshop',
                'description' => [
                    'uk' => 'Тактичний одяг та спорядження',
                    'en' => 'Tactical clothing and gear',
                ],
                'review_text' => 'Таймер і "залишилось 2 шт" реально створюють терміновість. Імпульсні покупки виросли, показник відмов впав.',
                'review_rating' => 5,
                'result_metric' => '−31% відмов',
                'result_period' => 'за місяць',
                'color' => '#ef4444',
                'widgets' => ['Бігуча стрічка', 'Таймер', 'Дефіцит товару'],
                'sort_order' => 3,
            ],
            [
                'store' => 'kyivfit.store',
                'store_url' => 'https://kyivfit.store',
                'owner' => 'KyivFit',
                'platform' => 'horoshop',
                'description' => [
                    'uk' => 'Спортивний одяг і аксесуари',
                    'en' => 'Sportswear and accessories',
                ],
                'review_text' => 'Колесо фортуни на виході з сайту збирає email-и в 3 рази краще, ніж попап зі знижкою. І покупці повертаються.',
                'review_rating' => 4,
                'result_metric' => '+42% email-база',
                'result_period' => 'за 6 тижнів',
                'color' => '#3b82f6',
                'widgets' => ['Лічильник покупок', 'Фотовідгуки', 'Колесо фортуни'],
                'sort_order' => 4,
            ],
            [
                'store' => 'homedetail.ua',
                'store_url' => 'https://homedetail.ua',
                'owner' => 'HomeDetail',
                'platform' => 'horoshop',
                'description' => [
                    'uk' => 'Декор та меблі для дому',
                    'en' => 'Home decor and furniture',
                ],
                'review_text' => 'Прогресивна шкала знижок мотивує додати ще товар. Замовлення на 2500 грн перетворилися на 3500 — без агресивних акцій.',
                'review_rating' => 5,
                'result_metric' => '+15% середній чек',
                'result_period' => 'за 2 місяці',
                'color' => '#8b5cf6',
                'widgets' => ['Безкоштовна доставка', 'Хтось щойно купив', 'Прогресивна знижка'],
                'sort_order' => 5,
            ],
            [
                'store' => 'brewco.kyiv.ua',
                'store_url' => 'https://brewco.kyiv.ua',
                'owner' => 'Brew & Co',
                'platform' => 'horoshop',
                'description' => [
                    'uk' => 'Спеціальна кава та аксесуари',
                    'en' => 'Specialty coffee and accessories',
                ],
                'review_text' => 'Квіз допомагає новачкам обрати каву — більше не губляться у 40 сортах. Кешбек повертає їх знову.',
                'review_rating' => 5,
                'result_metric' => '+28% повторних покупок',
                'result_period' => 'за 4 місяці',
                'color' => '#ec4899',
                'widgets' => ['Дата доставки', 'Квіз-рекомендатор', 'Кешбек'],
                'sort_order' => 6,
            ],
        ];

        foreach ($cases as $row) {
            CustomerCase::updateOrCreate(
                ['store_url' => $row['store_url']],
                [
                    'store' => $row['store'],
                    'store_logo_url' => null,
                    'owner' => $row['owner'],
                    'platform' => $row['platform'],
                    'description' => $row['description'],
                    'review_text' => $row['review_text'],
                    'review_rating' => $row['review_rating'],
                    'result_metric' => $row['result_metric'],
                    'result_period' => $row['result_period'],
                    'color' => $row['color'],
                    'screenshot_urls' => [],
                    'widgets' => $row['widgets'],
                    'is_published' => true,
                    'sort_order' => $row['sort_order'],
                    'created_at' => $now->copy()->subDays($row['sort_order'] * 7),
                    'updated_at' => $now->copy()->subDays($row['sort_order'] * 2),
                ],
            );
        }
    }

    private function seedNotifications(User $user, Carbon $now): void
    {
        $rows = [
            [
                'type' => NotificationType::TrialWarning->value,
                'title' => [
                    'uk' => 'Тріал завершиться через 5 днів',
                    'en' => 'Your trial ends in 5 days',
                ],
                'body' => [
                    'uk' => 'Оберіть платний тариф, щоб не втратити активні віджети.',
                    'en' => 'Choose a paid plan to keep your active widgets running.',
                ],
                'data' => ['days_left' => 5],
                'created_at' => $now->copy()->subHours(2),
                'is_read' => false,
            ],
            [
                'type' => NotificationType::WidgetActivated->value,
                'title' => [
                    'uk' => 'Таймер акції увімкнено',
                    'en' => 'Countdown timer enabled',
                ],
                'body' => [
                    'uk' => 'На kovalenko-outdoor.com успішно активовано Countdown Timer.',
                    'en' => 'Countdown Timer has been activated on kovalenko-outdoor.com.',
                ],
                'data' => ['site' => 'kovalenko-outdoor.com', 'widget' => 'countdown-timer'],
                'created_at' => $now->copy()->subDay(),
                'is_read' => true,
            ],
            [
                'type' => NotificationType::PaymentFailed->value,
                'title' => [
                    'uk' => 'Не вдалося списати платіж',
                    'en' => 'Payment attempt failed',
                ],
                'body' => [
                    'uk' => 'Спроба списання буде повторена завтра о 10:00.',
                    'en' => 'We will retry the payment tomorrow at 10:00.',
                ],
                'data' => ['retry_at' => $now->copy()->addDay()->toIso8601String()],
                'created_at' => $now->copy()->subDays(2),
                'is_read' => false,
            ],
        ];

        foreach ($rows as $row) {
            AppNotification::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'type' => $row['type'],
                    'created_at' => $row['created_at'],
                ],
                [
                    'title' => $row['title'],
                    'body' => $row['body'],
                    'data' => $row['data'],
                    'is_read' => $row['is_read'],
                    'read_at' => $row['is_read'] ? $row['created_at']->copy()->addMinutes(5) : null,
                ],
            );
        }
    }

    private function seedActivity(User $user, Carbon $now): void
    {
        $rows = [
            [
                'action' => 'widget.enabled',
                'entity_type' => 'site_widget',
                'entity_id' => 1,
                'description' => [
                    'uk' => 'Увімкнено Countdown Timer на kovalenko-outdoor.com',
                    'en' => 'Enabled Countdown Timer on kovalenko-outdoor.com',
                ],
                'created_at' => $now->copy()->subHours(1),
            ],
            [
                'action' => 'site.connected',
                'entity_type' => 'site',
                'entity_id' => 1,
                'description' => [
                    'uk' => 'Підключено сайт outlet.kovalenko-outdoor.com',
                    'en' => 'Connected outlet.kovalenko-outdoor.com',
                ],
                'created_at' => $now->copy()->subDays(1),
            ],
            [
                'action' => 'trial.started',
                'entity_type' => 'subscription',
                'entity_id' => $user->subscription?->id,
                'description' => [
                    'uk' => 'Активовано trial плану Pro',
                    'en' => 'Started Pro trial subscription',
                ],
                'created_at' => $now->copy()->subDays(2),
            ],
        ];

        foreach ($rows as $row) {
            ActivityLog::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'action' => $row['action'],
                    'entity_type' => $row['entity_type'],
                    'entity_id' => $row['entity_id'],
                ],
                [
                    'description' => $row['description'],
                    'metadata' => ['source' => 'seed'],
                    'created_at' => $row['created_at'],
                ],
            );
        }
    }

    private function seedDemoSession(User $user, Carbon $now): void
    {
        DemoSession::updateOrCreate(
            ['domain' => 'kovalenko-outdoor.com'],
            [
                'code' => 'DEMO2026',
                'config' => [
                    'theme' => 'modern',
                    'widgets' => ['countdown-timer', 'marquee', 'delivery-date'],
                    'timer' => [
                        'enabled' => true,
                        'ends_at' => $now->copy()->addHours(46)->toIso8601String(),
                    ],
                ],
                'created_by' => $user->id,
                'view_count' => 154,
                'expires_at' => $now->copy()->addDays(14),
            ],
        );
    }
}
