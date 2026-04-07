# Widgetis — Backend v2 Plan

> Комплексний план бекенду на базі Laravel 12 + Filament 5 + JWT.
> Бізнес-модель: підписки (без разових оплат).
> Джерело правди: 53 екрани Pencil-дизайну + існуюча кодова база (main).
> Дата: 2026-04-08

---

## 0. Ключові рішення

### Стек (перевірено composer dry-run — 0 конфліктів)

| Компонент | Пакет | Версія | Призначення |
|-----------|-------|--------|-------------|
| Framework | `laravel/framework` | **12.56.0** | Ядро |
| Admin | `filament/filament` | **5.4.5** | Адмін-панель |
| JWT | `tymon/jwt-auth` | **2.3.0** | JWT аутентифікація |
| Roles/ACL | `spatie/laravel-permission` | **7.3.0** | Ролі admin/customer |
| Settings | `spatie/laravel-settings` | **3.7.2** | Глобальні налаштування |
| Translations | `spatie/laravel-translatable` | **6.13.0** | Мультимовні jsonb-поля |
| DTOs | `spatie/laravel-data` | **4.21.0** | Типізовані DTO |
| OAuth | `laravel/socialite` | **5.26.1** | Google OAuth |
| Email | `resend/resend-laravel` | **1.3.2** | Транзакційний email |
| SMS | `laravel/vonage-notification-channel` | **3.3.4** | SMS OTP |
| Redis | `predis/predis` | **3.4.2** | Cache/Queue |
| S3/R2 | `league/flysystem-aws-s3-v3` | **3.32.0** | Cloudflare R2 CDN |
| OpenAPI | `ensi/laravel-openapi-server-generator` | **4.0.4** | Spec-first кодогенерація |
| DB | PostgreSQL | **15** | База даних |
| Cache/Queue | Redis | **7** | Кеш + черги |
| CDN | Cloudflare R2 | — | JS-бандли віджетів |
| Proxy | Nginx | — | SSL + роутинг |

**Lunar видалений** — для підписочної моделі e-commerce engine не потрібен. Замість ~50 таблиць Lunar маємо прості Eloquent-моделі: plans, subscriptions, payments.

### Бізнес-модель: тільки підписки

| План | Ціна/міс | Ціна/рік | Ліміт сайтів | Ліміт віджетів |
|------|----------|----------|--------------|----------------|
| Free | 0 | 0 | 1 | 2 |
| Basic | 799 | ~7,990 | 1 | 4 |
| Pro | 1,599 | ~15,990 | 3 | 8–12 |
| Max | 2,899 | ~28,990 | 5 | 17 (всі) |

- Trial: 7 днів на будь-якому плані
- Річний: знижка 2 місяці безкоштовно
- Пророзрахунок при зміні плану
- Recurring billing через LiqPay
- **Без разових оплат, без кошика, без замовлень товарів**

### Словник (оновлений)

| Використовуємо | НЕ використовуємо | Пояснення |
|----------------|-------------------|-----------|
| customer | client, user (бізнес) | Покупець/підписник |
| product | widget (в API/БД) | Товар каталогу (віджет) |
| plan | tariff, package | Тарифний план |
| subscription | license | Підписка на план |
| site | domain, website | Підключений магазин |
| site_script | site_token, embed_code | Скрипт для вставки |
| notification | alert, message | Сповіщення в кабінеті |

---

## 1. Аналіз дизайну по екранах

### 1.1 Лендинг (публічні сторінки)

#### Homepage (KmK8B)
- Hero з заголовком, 2 CTA
- Секція віджетів: картки з іконкою, назвою, описом, тегом
- "Як це працює" — 3 кроки
- Статистика: 120+ магазинів, 530+ віджетів
- Тизер тарифів: 3 плани з цінами
- CTA + FAQ + Footer

**Потреби бекенду:**
- `GET /products` — список віджетів (name, description, icon, tag)
- `GET /settings` — контактна інфо, статистика, соц. мережі
- `GET /plans` — тарифні плани з цінами

#### Widgets Catalog (VvfFc)
- Фільтри: за тегом/категорією
- Картки віджетів: іконка, назва, опис, тег, badge (популярний/новий)
- Статистика внизу
- Floating Telegram кнопка
- CTA bar

**Потреби бекенду:**
- `GET /products?tag=&search=&page=&per_page=` — фільтрований каталог
- `GET /tags` — теги/категорії віджетів

#### Widget Detail (tlQJF)
- Breadcrumb
- Hero з назвою, описом, тегами
- Секції: "Що це", "Можливості", "Платформи", "Магазини де працює", "Пов'язані"
- CTA покупки

**Потреби бекенду:**
- `GET /products/{slug}` — повна інфо: name, description, long_description, features[], platforms[], live_stores[], related_products[]

#### Pricing (FIieX)
- Toggle: місячна/річна оплата
- 3 плани з: назва, ціна, features[], ліміти, badge "Оптимально"
- Таблиця порівняння
- FAQ + CTA

**Потреби бекенду:**
- `GET /plans` — всі плани з features, порівняльна матриця
- `GET /faq?category=pricing` — FAQ по тарифах

#### Cases (XTTPq)
- Картки кейсів: назва магазину, URL, лого, платформа, опис результатів
- CTA

**Потреби бекенду:**
- `GET /cases` — список кейсів

#### Contacts (kOn6J)
- Телефон, email, месенджери, години роботи
- Footer

**Потреби бекенду:**
- `GET /settings` — контактні дані (вже є)

#### Menu Drawer (fM5pf)
- Навігація, CTA, месенджери, телефон

**Потреби бекенду:** статичні дані + `GET /settings`

---

### 1.2 Авторизація та оплата

#### Login (TXRkg)
- Email поле
- CTA "Отримати код"
- Google OAuth
- Посилання на реєстрацію

**Потреби бекенду:**
- `POST /auth/otp` — відправити OTP на email
- `POST /auth/google` — OAuth через Google

#### Login OTP (OKa7u)
- 6-значний OTP
- Автосабміт
- Повторне надсилання з таймером

**Потреби бекенду:**
- `POST /auth/otp/verify` — перевірити OTP → JWT
- `POST /auth/otp/resend` — повторно надіслати

#### Signup (8TFZG)
- Обраний план зверху (badge + ціна + trial badge)
- Крок 1/3: email
- Google OAuth
- "Вже є акаунт? Увійти"

**Потреби бекенду:**
- `POST /auth/register` — відправити OTP (з plan_id)

#### Signup OTP (uHu0B)
- Крок 2/3: підтвердити email
- 6-значний OTP
- Таймер повторного відправлення

**Потреби бекенду:**
- `POST /auth/register/verify` — підтвердити OTP

#### Signup Store (HvAp4)
- Крок 3/3: URL магазину + платформа + спосіб оплати
- CTA "Почати 7 днів безкоштовно"

**Потреби бекенду:**
- `POST /auth/register/complete` — створити акаунт, сайт, підписку trial

#### Checkout (IQKMN)
- Резюме замовлення: план, тривалість, стара/нова ціна, знижка
- Поля: email, phone, URL магазину, платформа
- Вибір платформи: Horoshop, Shopify, WooCommerce, OpenCart
- Checkbox згоди
- CTA "Оплатити"

**Потреби бекенду:**
- `POST /checkout` — створити замовлення + ініціювати оплату
- `POST /payments/callback/liqpay` — webhook
- `POST /payments/callback/monopay` — webhook

#### After Payment — Choice (bygFg)
- Успішна оплата
- 2 варіанти: "Встановлю сам" / "З менеджером"

**Потреби бекенду:**
- `GET /orders/{number}` — статус замовлення

#### After Payment — Self-Install (r5F0C)
- Скрипт для копіювання
- Покрокова інструкція (platform-specific)
- Відео-туторіал
- "Написати менеджеру"

**Потреби бекенду:**
- `GET /me/sites/{id}/script` — отримати скрипт
- `GET /me/sites/{id}/install-instructions` — інструкції по платформі

#### After Payment — Manager (shDqG)
- Вибір месенджера: Telegram/Viber/WhatsApp
- CTA "Надіслати заявку"

**Потреби бекенду:**
- `POST /me/support-requests` — запит на встановлення

#### Payment Error (YRji1)
- Повідомлення про помилку
- Grace period: 3 дні, 3 спроби
- Оновити картку / підтримка

**Потреби бекенду:**
- `GET /me/billing/status` — статус оплати, grace period
- `POST /me/billing/retry` — оновити платіжні дані

#### Onboarding 1-2-3 (9uEfS, pnkov, N9lhY)
- 3 кроки: "Додайте сайт" → "Оберіть віджети" → "Вставте скрипт"
- Carousel з dot indicators

**Потреби бекенду:**
- `POST /me/onboarding/complete` — відмітити проходження

---

### 1.3 Кабінет користувача

#### Dashboard (qx9tV)
- Привітання, поточний план, статистика
- Швидкі дії: додати сайт, налаштувати віджет, підтримка
- Остання активність

**Потреби бекенду:**
- `GET /me/dashboard` — user_name, plan, stats, recent_activity[]

#### Sites (gNRiN)
- CTA "Додати сайт"
- Ліміт: "3 з 3 використано"
- Список сайтів: домен, дата, кількість віджетів, статус

**Потреби бекенду:**
- `GET /me/sites` — список з лімітами
- `POST /me/sites` — додати сайт

#### Add Site — Form (6kmNL)
- URL поле, інструкція з 3 кроків, код скрипта

**Потреби бекенду:**
- `POST /me/sites` → повертає site_id + script

#### Add Site — Flow Step 1 (SAAbk)
- Назва сайту, URL, вибір платформи

#### Add Site — Flow Step 2 (uI1Uu)
- Скрипт для копіювання
- Platform-specific інструкція
- "Перевірити встановлення"

**Потреби бекенду:**
- `POST /me/sites/{id}/verify` — перевірити чи скрипт встановлений

#### Configure Widget (epq6v)
- Dropdown вибору сайту
- Список віджетів з toggle on/off
- Конфігурація: колір, позиція

**Потреби бекенду:**
- `GET /me/sites/{id}/widgets` — віджети сайту з конфігом
- `PUT /me/sites/{id}/widgets/{wid}` — оновити конфіг

#### My Widgets (WYBh1)
- Ліміт: "8 з 17 віджетів"
- Доступні в плані: toggle
- Заблоковані (потребують вищий план): greyed out

**Потреби бекенду:**
- `GET /me/widgets` — всі віджети: available + locked

#### My Plan (k0EAM)
- Поточний план з деталями: ціна, наступне списання, ліміти
- 3 плани для порівняння
- Пророзрахунок при зміні
- Скасувати підписку

**Потреби бекенду:**
- `GET /me/subscription` — поточний план, ліміти, billing
- `GET /me/subscription/prorate?target_plan_id=` — розрахунок різниці
- `POST /me/subscription/change` — змінити план
- `POST /me/subscription/cancel` — скасувати

#### Payment History (nvXea)
- Поточний план + наступне списання
- Список транзакцій: опис, дата, метод, сума, статус

**Потреби бекенду:**
- `GET /me/payments` — пагінований список

#### Notifications (L7JOY)
- Групування по датах: "Сьогодні", "Вчора"
- Типи: trial warning, widget activated, update, payment
- Прочитати все

**Потреби бекенду:**
- `GET /me/notifications?page=`
- `POST /me/notifications/mark-all-read`
- `POST /me/notifications/{id}/read`

#### Demo Session (0xPRq)
- Живий перегляд магазину з віджетами
- iframe з demo URL
- "Поділитись" + "Написати менеджеру"

**Потреби бекенду:**
- `GET /me/sites/{id}/demo` — demo URL, активні віджети
- `POST /me/sites/{id}/demo/share` — створити посилання

#### Profile (2oQoS)
- Ім'я, email, телефон, telegram, компанія
- 2FA: Email OTP
- Вийти / Видалити акаунт

**Потреби бекенду:**
- `GET /me/profile`
- `PUT /me/profile`
- `PUT /me/security/2fa`
- `POST /me/profile/avatar` — завантажити аватар
- `DELETE /me/profile` — видалити акаунт

#### Settings (kcrwM)
- Профіль, сповіщення toggle, мова
- Підписка: план, платежі
- Безпека: змінити пароль
- Вийти / Видалити

**Потреби бекенду:**
- `GET /me/settings`
- `PUT /me/settings`
- `POST /auth/change-password`

#### Support (trBRl)
- Telegram + email контакти
- FAQ accordion

**Потреби бекенду:**
- `GET /faq?category=support`
- `POST /me/support-requests`

---

### 1.4 Адмін-панель

#### Dashboard (Ba2Ox)
- KPI: замовлення, активні сайти, встановлення, виручка
- Останні замовлення з статусами
- Швидкі дії

**Потреби бекенду:**
- `GET /admin/dashboard` — KPI + recent orders

#### Orders (blcyh)
- Фільтри: Всі/Оплачено/Очікує
- Список: ID, email, план, сума, статус
- Пагінація

**Потреби бекенду:**
- `GET /admin/orders?status=&page=&per_page=`

#### Order Detail (bvFsx)
- Сума, метод оплати, Transaction ID
- Клієнт, тариф, сайти, дата, тип оплати
- Дії: написати клієнту, повернення коштів

**Потреби бекенду:**
- `GET /admin/orders/{id}`
- `POST /admin/orders/{id}/refund`

#### Sites (iyBjH)
- KPI: всього, активних, очікують
- Пошук
- Список: домен, email, план, статус

**Потреби бекенду:**
- `GET /admin/sites?search=&status=&page=`

#### Site Detail (Eh6cY)
- Домен, статус, план, дата підключення, скрипт
- Встановлені віджети з toggle
- Дії: змінити тариф, переглянути скрипт, деактивувати

**Потреби бекенду:**
- `GET /admin/sites/{id}`
- `PUT /admin/sites/{id}/widgets/{wid}/toggle`
- `POST /admin/sites/{id}/deactivate`

#### Users (LOe4k)
- KPI: всього, цього місяця, Pro users
- Пошук + фільтр
- Список: аватар, ім'я, план, домен, кількість сайтів

**Потреби бекенду:**
- `GET /admin/users?search=&plan=&page=`

#### User Detail (X4vIO)
- Профіль: аватар, ім'я, email, план, термін
- Статистика: сайти, віджети, місяці як клієнт
- Дії: тариф, Telegram, блок
- Сайти клієнта, останні платежі

**Потреби бекенду:**
- `GET /admin/users/{id}`
- `POST /admin/users/{id}/block`
- `PUT /admin/users/{id}/plan`

#### Finance (g7uWX)
- MRR з графіком + % зміни
- Виручка за місяць, активних підписників
- Останні транзакції: ім'я, план, дата, сума

**Потреби бекенду:**
- `GET /admin/finance/dashboard`
- `GET /admin/finance/transactions?page=`
- `POST /admin/finance/export`

#### Subscriptions (Ov3jH)
- KPI: активних, trial, скасованих
- Фільтри: all/active/trial/cancelled
- Список: ім'я, план, домен, ціна, статус + дата

**Потреби бекенду:**
- `GET /admin/subscriptions?status=&page=`

#### Configurator (1qkrx)
- Модулі віджетів (chips з toggle)
- Конфігурація: фон, швидкість, кнопка закриття, тексти, розмір
- Зберегти, прев'ю, копіювати скрипт

**Потреби бекенду:**
- `GET /admin/configurator/widgets`
- `GET /admin/configurator/widgets/{id}/config`
- `PUT /admin/configurator/widgets/{id}/config`
- `POST /admin/configurator/widgets/{id}/preview`
- `POST /admin/configurator/widgets/{id}/build`

#### Configurator Preview (6Xdq2)
- Bottom sheet з device toggle
- Phone mockup з live preview
- Скрипт для вставки

**Потреби бекенду:** Використовує ті ж ендпоінти конфігуратора.

#### Settings (sL8gV)
- Профіль адміна
- Сповіщення toggle, мова
- API ключі, Webhooks
- Видалити акаунт

**Потреби бекенду:**
- `GET /admin/settings`
- `PUT /admin/settings`
- `GET /admin/api-keys`
- `GET /admin/webhooks`

---

## 2. База даних — повна схема

### 2.1 Spatie Permission (4 таблиці)

```
roles, permissions, model_has_roles, model_has_permissions
Ролі: admin, customer
```

### 2.2 Spatie Settings (1 таблиця)

```
settings — телефон, email, соц. мережі, месенджери, статистика
```

### 2.3 Кастомні таблиці

#### users

```sql
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255) NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    phone           VARCHAR(20) NULL UNIQUE,
    password        VARCHAR(255) NULL,          -- nullable: OTP login
    avatar_url      VARCHAR(500) NULL,
    telegram        VARCHAR(100) NULL,
    company         VARCHAR(255) NULL,
    locale          VARCHAR(2) DEFAULT 'uk',    -- uk, en
    timezone        VARCHAR(50) DEFAULT 'Europe/Kyiv',
    onboarding_completed_at TIMESTAMP NULL,
    email_verified_at TIMESTAMP NULL,
    phone_verified_at TIMESTAMP NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_method VARCHAR(20) DEFAULT 'email', -- email, sms
    notification_enabled BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL,
    deleted_at      TIMESTAMP NULL               -- soft delete
);
```

#### social_accounts

```sql
CREATE TABLE social_accounts (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id) ON DELETE CASCADE,
    provider        VARCHAR(50) NOT NULL,       -- google
    provider_id     VARCHAR(255) NOT NULL,
    provider_token  TEXT NULL,
    provider_refresh_token TEXT NULL,
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL,
    UNIQUE(provider, provider_id)
);
```

#### plans

```sql
CREATE TABLE plans (
    id              BIGSERIAL PRIMARY KEY,
    slug            VARCHAR(50) UNIQUE NOT NULL, -- free, basic, pro, max
    name            JSONB NOT NULL,              -- {"en": "Basic", "uk": "Базовий"}
    description     JSONB NULL,                  -- {"en": "...", "uk": "..."}
    price_monthly   DECIMAL(10,2) NOT NULL,      -- 799.00
    price_yearly    DECIMAL(10,2) NOT NULL,      -- 7990.00
    max_sites       INTEGER NOT NULL DEFAULT 1,
    max_widgets     INTEGER NOT NULL DEFAULT 2,
    features        JSONB NOT NULL DEFAULT '[]', -- [{"key":"support","en":"Email support","uk":"Підтримка email"}]
    is_recommended  BOOLEAN DEFAULT FALSE,
    sort_order      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL
);

-- Seed data:
-- free:  price_monthly=0, price_yearly=0, max_sites=1, max_widgets=2
-- basic: price_monthly=799, price_yearly=7990, max_sites=1, max_widgets=4
-- pro:   price_monthly=1599, price_yearly=15990, max_sites=3, max_widgets=12, is_recommended=true
-- max:   price_monthly=2899, price_yearly=28990, max_sites=5, max_widgets=17
```

#### plan_features (порівняльна матриця)

```sql
CREATE TABLE plan_features (
    id              BIGSERIAL PRIMARY KEY,
    feature_key     VARCHAR(100) NOT NULL,       -- max_sites, max_widgets, priority_support, etc.
    name            JSONB NOT NULL,              -- {"en": "Max sites", "uk": "Макс. сайтів"}
    category        VARCHAR(50) NOT NULL,        -- limits, support, features
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL
);
```

#### plan_feature_values

```sql
CREATE TABLE plan_feature_values (
    id              BIGSERIAL PRIMARY KEY,
    plan_id         BIGINT REFERENCES plans(id) ON DELETE CASCADE,
    plan_feature_id BIGINT REFERENCES plan_features(id) ON DELETE CASCADE,
    value           JSONB NOT NULL,              -- "3", true, "Email", {"en":"24/7","uk":"24/7"}
    UNIQUE(plan_id, plan_feature_id)
);
```

#### subscriptions

```sql
CREATE TABLE subscriptions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id) ON DELETE CASCADE,
    plan_id         BIGINT REFERENCES plans(id),
    billing_period  VARCHAR(10) NOT NULL DEFAULT 'monthly', -- monthly, yearly
    status          VARCHAR(20) NOT NULL DEFAULT 'active',  -- active, trial, past_due, cancelled, expired
    is_trial        BOOLEAN DEFAULT FALSE,
    trial_ends_at   TIMESTAMP NULL,
    current_period_start TIMESTAMP NOT NULL,
    current_period_end   TIMESTAMP NOT NULL,
    cancelled_at    TIMESTAMP NULL,
    cancel_reason   TEXT NULL,
    -- Grace period for failed payments
    grace_period_ends_at TIMESTAMP NULL,
    payment_retry_count  INTEGER DEFAULT 0,
    next_payment_retry_at TIMESTAMP NULL,
    -- LiqPay/MonoPay recurring
    payment_provider     VARCHAR(20) NULL,      -- liqpay, monopay
    payment_provider_subscription_id VARCHAR(255) NULL,
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL,
    UNIQUE(user_id)                             -- один user = одна підписка
);
```

#### orders

```sql
CREATE TABLE orders (
    id              BIGSERIAL PRIMARY KEY,
    order_number    VARCHAR(20) UNIQUE NOT NULL, -- W-MF3K9A
    user_id         BIGINT REFERENCES users(id),
    plan_id         BIGINT REFERENCES plans(id),
    billing_period  VARCHAR(10) NOT NULL,        -- monthly, yearly
    amount          DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    currency        VARCHAR(3) DEFAULT 'UAH',
    status          VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, completed, cancelled, refunded
    payment_provider VARCHAR(20) NULL,           -- liqpay, monopay
    payment_method   VARCHAR(50) NULL,           -- Visa *7006
    transaction_id   VARCHAR(255) NULL,
    paid_at         TIMESTAMP NULL,
    refunded_at     TIMESTAMP NULL,
    notes           JSONB NULL,
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL
);
```

#### payments (transaction log)

```sql
CREATE TABLE payments (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id),
    order_id        BIGINT REFERENCES orders(id) NULL,
    subscription_id BIGINT REFERENCES subscriptions(id) NULL,
    type            VARCHAR(20) NOT NULL,        -- charge, refund, trial_activation
    amount          DECIMAL(10,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'UAH',
    status          VARCHAR(20) NOT NULL,        -- success, failed, pending, refunded
    payment_provider VARCHAR(20) NULL,
    payment_method   VARCHAR(50) NULL,
    transaction_id   VARCHAR(255) NULL,
    description     JSONB NULL,                  -- {"en": "Pro subscription — March", "uk": "Pro підписка — березень"}
    metadata        JSONB NULL,                  -- raw provider response
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL
);
```

#### sites

```sql
CREATE TABLE sites (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NULL,
    domain          VARCHAR(255) NOT NULL,
    url             VARCHAR(500) NOT NULL,
    platform        VARCHAR(30) NOT NULL DEFAULT 'horoshop', -- horoshop, shopify, woocommerce, opencart, wordpress, other
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, active, deactivated
    script_installed BOOLEAN DEFAULT FALSE,
    script_installed_at TIMESTAMP NULL,
    connected_at    TIMESTAMP NULL,
    deactivated_at  TIMESTAMP NULL,
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL,
    UNIQUE(domain, user_id)
);
```

#### site_scripts

```sql
CREATE TABLE site_scripts (
    id              BIGSERIAL PRIMARY KEY,
    site_id         BIGINT REFERENCES sites(id) ON DELETE CASCADE,
    token           VARCHAR(64) UNIQUE NOT NULL,
    is_active       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL,
    UNIQUE(site_id)
);
```

#### site_script_builds

```sql
CREATE TABLE site_script_builds (
    id              BIGSERIAL PRIMARY KEY,
    site_script_id  BIGINT REFERENCES site_scripts(id) ON DELETE CASCADE,
    version         INTEGER NOT NULL,
    config          JSONB NOT NULL,
    file_url        VARCHAR(500) NOT NULL,
    file_hash       VARCHAR(64) NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'active', -- active, inactive
    built_at        TIMESTAMP NOT NULL,
    created_at      TIMESTAMP NOT NULL
);
```

#### products (каталог віджетів — проста Eloquent модель, без Lunar)

```sql
CREATE TABLE products (
    id              BIGSERIAL PRIMARY KEY,
    slug            VARCHAR(100) UNIQUE NOT NULL, -- URL, англійською: "marquee", "delivery-date"
    name            JSONB NOT NULL,              -- {"en": "Marquee", "uk": "Біжучий рядок"}
    description     JSONB NOT NULL,              -- {"en": "...", "uk": "..."}
    long_description JSONB NULL,                 -- розгорнутий опис
    features        JSONB NULL,                  -- [{"en":"...","uk":"..."}]
    icon            VARCHAR(50) NOT NULL,        -- lucide-react ім'я іконки
    tag_slug        VARCHAR(50) REFERENCES widget_tags(slug) NULL,
    platform        VARCHAR(30) NOT NULL DEFAULT 'horoshop',
    status          VARCHAR(20) NOT NULL DEFAULT 'active', -- active, inactive, draft
    is_popular      BOOLEAN DEFAULT FALSE,
    is_new          BOOLEAN DEFAULT FALSE,
    preview_before  VARCHAR(500) NULL,           -- URL скріншоту "до"
    preview_after   VARCHAR(500) NULL,           -- URL скріншоту "після"
    builder_module  VARCHAR(100) NULL,           -- ім'я модуля в widget-builder
    config_schema   JSONB NULL,                  -- JSON Schema конфігурації віджету
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL
);
```

#### product_plan_access (які віджети доступні в яких планах)

```sql
CREATE TABLE product_plan_access (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT REFERENCES products(id) ON DELETE CASCADE,
    plan_id         BIGINT REFERENCES plans(id) ON DELETE CASCADE,
    UNIQUE(product_id, plan_id)
);

-- Приклад: Basic має доступ до 4 віджетів, Pro — 12, Max — всі 17
```

#### site_widgets (pivot: які віджети активні на якому сайті)

```sql
CREATE TABLE site_widgets (
    id              BIGSERIAL PRIMARY KEY,
    site_id         BIGINT REFERENCES sites(id) ON DELETE CASCADE,
    product_id      BIGINT NOT NULL,             -- FK → products
    is_enabled      BOOLEAN DEFAULT TRUE,
    config          JSONB NULL,                  -- {"color": "#3B82F6", "position": "top", "texts": [...]}
    enabled_at      TIMESTAMP NULL,
    disabled_at     TIMESTAMP NULL,
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL,
    UNIQUE(site_id, product_id)
);
```

#### widget_tags

```sql
CREATE TABLE widget_tags (
    slug            VARCHAR(50) PRIMARY KEY,
    name            JSONB NOT NULL,              -- {"en": "Social Proof", "uk": "Соціальний доказ"}
    color           VARCHAR(7) NOT NULL,         -- #3B82F6
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL
);
```

#### customer_cases

```sql
CREATE TABLE customer_cases (
    id              BIGSERIAL PRIMARY KEY,
    store           VARCHAR(255) NOT NULL,
    store_url       VARCHAR(500) NOT NULL,
    store_logo_url  VARCHAR(500) NULL,
    owner           VARCHAR(255) NULL,
    platform        VARCHAR(30) NULL,
    description     JSONB NULL,                  -- {"en": "...", "uk": "..."}
    review_text     TEXT NULL,
    review_rating   SMALLINT NULL CHECK (review_rating BETWEEN 1 AND 5),
    screenshot_urls JSONB NULL,
    widgets         JSONB NULL,                  -- ["marquee", "social-proof"]
    is_published    BOOLEAN DEFAULT FALSE,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL,
    deleted_at      TIMESTAMP NULL
);
```

#### consultations

```sql
CREATE TABLE consultations (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    phone           VARCHAR(20) NULL,
    email           VARCHAR(255) NULL,
    preferred_at    TIMESTAMP NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'new', -- new, in_progress, completed, cancelled
    notes           TEXT NULL,
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL
);
```

#### manager_requests

```sql
CREATE TABLE manager_requests (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id) NULL,
    site_id         BIGINT REFERENCES sites(id) NULL,
    type            VARCHAR(30) NOT NULL DEFAULT 'install_help', -- install_help, general, demo_request
    messenger       VARCHAR(30) NULL,            -- telegram, viber, whatsapp
    email           VARCHAR(255) NULL,
    phone           VARCHAR(20) NULL,
    widgets         JSONB NULL,
    message         TEXT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'new',
    notes           TEXT NULL,
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL,
    deleted_at      TIMESTAMP NULL
);
```

#### reviews

```sql
CREATE TABLE reviews (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id),
    rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title           VARCHAR(255) NULL,
    body            TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, cancelled
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL
);
```

#### demo_sessions

```sql
CREATE TABLE demo_sessions (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(8) UNIQUE NOT NULL,
    domain          VARCHAR(255) NOT NULL,
    config          JSONB NOT NULL,              -- віджети + налаштування
    created_by      BIGINT REFERENCES users(id) NULL,
    view_count      INTEGER DEFAULT 0,
    expires_at      TIMESTAMP NOT NULL,          -- +7 днів
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL
);
```

#### notifications

```sql
CREATE TABLE notifications (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,        -- trial_warning, widget_activated, update_available, payment_success, payment_failed, plan_changed
    title           JSONB NOT NULL,              -- {"en": "...", "uk": "..."}
    body            JSONB NOT NULL,
    data            JSONB NULL,                  -- entity_type, entity_id, action_url
    is_read         BOOLEAN DEFAULT FALSE,
    read_at         TIMESTAMP NULL,
    created_at      TIMESTAMP NOT NULL
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
```

#### activity_log

```sql
CREATE TABLE activity_log (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id) NULL,
    action          VARCHAR(100) NOT NULL,       -- script_installed, widget_enabled, plan_renewed, etc.
    entity_type     VARCHAR(50) NULL,            -- site, widget, subscription
    entity_id       BIGINT NULL,
    description     JSONB NULL,                  -- {"en": "...", "uk": "..."}
    metadata        JSONB NULL,
    created_at      TIMESTAMP NOT NULL
);

CREATE INDEX idx_activity_user_created ON activity_log(user_id, created_at DESC);
```

#### faq_items

```sql
CREATE TABLE faq_items (
    id              BIGSERIAL PRIMARY KEY,
    category        VARCHAR(50) NOT NULL,        -- pricing, support, general
    question        JSONB NOT NULL,              -- {"en": "...", "uk": "..."}
    answer          JSONB NOT NULL,              -- {"en": "...", "uk": "..."}
    sort_order      INTEGER DEFAULT 0,
    is_published    BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL
);
```

---

## 3. API Endpoints — повний перелік

### Конвенції

- Префікс: `/api/v1/`
- Auth: JWT Bearer token в `Authorization: Bearer <token>`
- Response format: JSON завжди
- Pagination: `?page=1&per_page=20` → `{ data: [], meta: { current_page, last_page, per_page, total } }`
- Translations: response мовою з `Accept-Language: uk` header (fallback: en)
- Errors: `{ error: { code: "VALIDATION_ERROR", message: "...", details: {} } }`
- Rate limiting headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

### 3.1 Public (без авторизації)

```
GET    /api/v1/products                      — каталог віджетів
       Query: ?platform=horoshop&tag=social_proof&search=біжучий&page=1&per_page=12&sort=popular
       Response: { data: [Product], meta: Pagination }

GET    /api/v1/products/{slug}               — деталі віджету
       Response: Product (full) + related_products[]

GET    /api/v1/tags                           — теги/категорії
       Response: { data: [Tag] }

GET    /api/v1/plans                          — тарифні плани
       Response: { data: [Plan] }

GET    /api/v1/plans/{slug}/features          — порівняльна матриця
       Response: { data: [PlanFeatureComparison] }

GET    /api/v1/cases                          — кейси клієнтів
       Query: ?page=1&per_page=10
       Response: { data: [Case], meta: Pagination }

GET    /api/v1/reviews                        — відгуки (approved)
       Query: ?page=1&per_page=10
       Response: { data: [Review], meta: Pagination }

GET    /api/v1/settings                       — публічні налаштування сайту
       Response: { phone, email, socials, messengers, business_hours, stats }

GET    /api/v1/faq                            — FAQ
       Query: ?category=pricing
       Response: { data: [FaqItem] }

GET    /api/v1/demo-sessions/{code}           — отримати демо-сесію
       Response: { code, domain, config, widgets, expires_at }

POST   /api/v1/demo-sessions/{code}/view      — зафіксувати перегляд
       Response: 204

POST   /api/v1/consultations                  — записатися на консультацію (rate limit: 3/год)
       Body: { name, phone?, email?, preferred_at? }
       Response: 201 { id, status }

POST   /api/v1/manager-requests               — запит менеджера (rate limit: 3/год)
       Body: { site?, messenger, email?, phone?, widgets[]?, message? }
       Response: 201 { id, status }
```

### 3.2 Auth

```
POST   /api/v1/auth/otp                      — відправити OTP (login)
       Body: { email }
       Response: { message: "OTP sent", expires_in: 600 }

POST   /api/v1/auth/otp/verify               — перевірити OTP → JWT
       Body: { email, code }
       Response: { token, token_type: "bearer", expires_in: 604800, user: User }

POST   /api/v1/auth/otp/resend               — повторно відправити OTP (rate limit: 1/30сек)
       Body: { email }
       Response: { message: "OTP resent", expires_in: 600 }

POST   /api/v1/auth/register                 — розпочати реєстрацію (відправити OTP)
       Body: { email, plan_slug }
       Response: { message: "OTP sent", expires_in: 600 }

POST   /api/v1/auth/register/verify          — підтвердити email
       Body: { email, code }
       Response: { registration_token: "..." }  — тимчасовий токен для кроку 3

POST   /api/v1/auth/register/complete        — завершити реєстрацію
       Body: { registration_token, store_url, platform, billing_period? }
       Response: { token, user: User, subscription: Subscription, site: Site }

POST   /api/v1/auth/google                   — OAuth Google
       Body: { id_token }
       Response: { token, user: User, is_new_user: boolean }

POST   /api/v1/auth/refresh                  — оновити JWT
       Response: { token, expires_in: 604800 }

POST   /api/v1/auth/logout                   — вийти
       Response: 204

GET    /api/v1/auth/link/{token}/confirm     — підтвердити magic link
       → Redirect to frontend with JWT

GET    /api/v1/auth/link/{token}/status      — поллінг статусу magic link
       Response: { status: "pending" | "confirmed", token?: "jwt..." }
```

### 3.3 Customer (JWT required, role: customer)

```
# === Profile ===

GET    /api/v1/me/profile                    — профіль
       Response: { name, email, phone, telegram, company, avatar_url, 2fa_enabled, 2fa_method, locale }

PUT    /api/v1/me/profile                    — оновити профіль
       Body: { name?, phone?, telegram?, company?, locale? }
       Response: { ...updated profile }

POST   /api/v1/me/profile/avatar             — завантажити аватар
       Body: multipart/form-data { avatar: file }
       Response: { avatar_url }

DELETE /api/v1/me/profile                    — видалити акаунт (потребує OTP)
       Body: { otp_code }
       Response: 204

PUT    /api/v1/me/security/2fa               — toggle 2FA
       Body: { enabled: boolean, method?: "email" | "sms" }
       Response: { 2fa_enabled, 2fa_method }

# === Dashboard ===

GET    /api/v1/me/dashboard                  — дашборд
       Response: {
         user: { name, plan_name, plan_slug },
         stats: { sites_count, widgets_count, plan_expires_at },
         quick_actions: [...],
         recent_activity: [ActivityItem]
       }

# === Subscription ===

GET    /api/v1/me/subscription               — поточна підписка
       Response: {
         plan: Plan,
         billing_period,
         status,
         is_trial, trial_ends_at,
         current_period_end,
         widgets_used, widgets_max,
         sites_used, sites_max,
         next_billing_amount, next_billing_date
       }

GET    /api/v1/me/subscription/prorate       — розрахунок пророзрахунку
       Query: ?target_plan_slug=max
       Response: {
         current_plan, target_plan,
         price_difference_monthly,
         days_remaining, days_total,
         prorate_percentage,
         amount_due_now,
         next_billing_amount, next_billing_date
       }

POST   /api/v1/me/subscription/change        — змінити план
       Body: { plan_slug, billing_period? }
       Response: { subscription: Subscription, payment_required: boolean, payment_url?: string }

POST   /api/v1/me/subscription/cancel        — скасувати підписку
       Body: { reason? }
       Response: { subscription: { status: "cancelled", cancelled_at, access_until } }

# === Sites ===

GET    /api/v1/me/sites                      — список сайтів
       Response: { data: [Site], limits: { used: 3, max: 3, plan: "Pro" } }

POST   /api/v1/me/sites                      — додати сайт
       Body: { name?, url, platform }
       Response: 201 { site: Site, script: SiteScript }

GET    /api/v1/me/sites/{id}                 — деталі сайту
       Response: { site: Site, script: SiteScript, widgets: [SiteWidget] }

DELETE /api/v1/me/sites/{id}                 — видалити сайт
       Response: 204

POST   /api/v1/me/sites/{id}/verify          — перевірити встановлення скрипту
       Response: { verified: boolean, message: "..." }

GET    /api/v1/me/sites/{id}/script          — отримати скрипт
       Response: { script_tag, script_url, token, install_instructions: PlatformInstructions }

# === Site Widgets ===

GET    /api/v1/me/sites/{id}/widgets         — віджети на сайті
       Response: { data: [SiteWidget] }

PUT    /api/v1/me/sites/{siteId}/widgets/{productId}  — оновити віджет на сайті
       Body: { is_enabled?, config?: { color?, position?, texts[]? } }
       Response: { site_widget: SiteWidget }

# === Widgets (all, with plan access info) ===

GET    /api/v1/me/widgets                    — всі віджети з інфо доступу
       Response: {
         available: [{ product: Product, site_domain?: string, is_enabled: boolean }],
         locked: [{ product: Product, required_plan: string }],
         limits: { used: 8, max: 17, plan: "Pro" }
       }

# === Payments ===

GET    /api/v1/me/payments                   — історія платежів
       Query: ?page=1&per_page=20
       Response: { data: [Payment], meta: Pagination, billing: { plan, next_billing_date, next_amount } }

GET    /api/v1/me/billing/status             — статус біллінгу (для payment error screen)
       Response: { status, grace_period_ends_at, payment_retry_count, max_retries, next_retry_at }

# === Notifications ===

GET    /api/v1/me/notifications              — сповіщення
       Query: ?page=1&per_page=20
       Response: { data: [Notification], meta: Pagination, unread_count: number }

POST   /api/v1/me/notifications/mark-all-read
       Response: 204

POST   /api/v1/me/notifications/{id}/read
       Response: 204

# === Settings ===

GET    /api/v1/me/settings                   — налаштування
       Response: { notification_enabled, locale, ... }

PUT    /api/v1/me/settings
       Body: { notification_enabled?, locale? }
       Response: { ...updated settings }

POST   /api/v1/me/change-password
       Body: { current_password?, new_password, new_password_confirmation }
       Response: 204

# === Support ===

POST   /api/v1/me/support-requests           — запит підтримки
       Body: { type: "install_help" | "general", site_id?, messenger?, message? }
       Response: 201 { id, status }

# === Demo ===

GET    /api/v1/me/sites/{id}/demo            — отримати демо для сайту
       Response: { demo_url, active_widgets_count, demo_code }

POST   /api/v1/me/sites/{id}/demo/share      — створити посилання для шерінгу
       Response: { share_url, expires_at }

# === Onboarding ===

POST   /api/v1/me/onboarding/complete
       Response: 204

# === Checkout ===

POST   /api/v1/checkout                      — створити замовлення + ініціювати оплату
       Body: { plan_slug, billing_period, store_url?, platform? }
       Response: { order: Order, payment_url: string }
       -- або для trial/free: { order: Order, subscription: Subscription }

GET    /api/v1/orders/{number}               — статус замовлення
       Response: { order: Order }
```

### 3.4 Payments (webhooks)

```
POST   /api/v1/payments/callback/liqpay      — LiqPay webhook
       Body: { data, signature }
       Response: 200

POST   /api/v1/payments/callback/monopay     — MonoPay webhook
       Body: MonoPay payload
       Response: 200
```

### 3.5 Admin (JWT required, role: admin)

```
# === Dashboard ===

GET    /api/v1/admin/dashboard
       Response: {
         kpi: { orders_count, orders_change_pct, active_sites, installations, revenue, revenue_change_pct },
         recent_orders: [OrderSummary],
         quick_actions: [...]
       }

# === Orders ===

GET    /api/v1/admin/orders                  — список замовлень
       Query: ?status=paid&search=&page=1&per_page=20
       Response: { data: [Order], meta: Pagination }

GET    /api/v1/admin/orders/{id}             — деталі замовлення
       Response: { order: OrderFull }

POST   /api/v1/admin/orders/{id}/refund      — повернення коштів
       Body: { reason? }
       Response: { order: Order, refund_status }

POST   /api/v1/admin/orders/{id}/verify-payment  — ручна перевірка оплати
       Response: { order: Order, payment_verified: boolean }

POST   /api/v1/admin/orders/{id}/complete    — завершити замовлення
       Response: { order: Order }

# === Users ===

GET    /api/v1/admin/users
       Query: ?search=&plan=pro&status=&page=1&per_page=20
       Response: { data: [UserSummary], meta: Pagination, stats: { total, this_month, pro_count } }

GET    /api/v1/admin/users/{id}
       Response: {
         user: UserFull,
         stats: { sites_count, widgets_count, months_as_client },
         sites: [Site],
         recent_payments: [Payment]
       }

POST   /api/v1/admin/users/{id}/block
       Response: { user: User }

POST   /api/v1/admin/users/{id}/unblock
       Response: { user: User }

PUT    /api/v1/admin/users/{id}/plan
       Body: { plan_slug, billing_period? }
       Response: { subscription: Subscription }

# === Sites ===

GET    /api/v1/admin/sites
       Query: ?search=&status=&page=1&per_page=20
       Response: { data: [SiteSummary], meta: Pagination, stats: { total, active, pending } }

GET    /api/v1/admin/sites/{id}
       Response: { site: SiteFull, widgets: [SiteWidget], script: SiteScript }

PUT    /api/v1/admin/sites/{id}/widgets/{wid}/toggle
       Response: { site_widget: SiteWidget }

POST   /api/v1/admin/sites/{id}/deactivate
       Response: { site: Site }

POST   /api/v1/admin/sites/{id}/activate
       Response: { site: Site }

# === Subscriptions ===

GET    /api/v1/admin/subscriptions
       Query: ?status=active&page=1&per_page=20
       Response: { data: [SubscriptionSummary], meta: Pagination, stats: { active, trial, cancelled } }

# === Finance ===

GET    /api/v1/admin/finance/dashboard
       Response: {
         mrr: number, mrr_change_pct: number,
         revenue_this_month: number,
         active_subscribers: number,
         recent_transactions: [Transaction]
       }

GET    /api/v1/admin/finance/transactions
       Query: ?page=1&per_page=20
       Response: { data: [Transaction], meta: Pagination }

POST   /api/v1/admin/finance/export
       Query: ?from=&to=&format=csv
       Response: file download (CSV/XLSX)

# === Configurator ===

GET    /api/v1/admin/configurator/widgets
       Response: { data: [ConfiguratorWidget] }

GET    /api/v1/admin/configurator/widgets/{id}/config
       Response: { widget: Product, config: WidgetConfig, config_schema: JSONSchema }

PUT    /api/v1/admin/configurator/widgets/{id}/config
       Body: { config: WidgetConfig }
       Response: { config: WidgetConfig }

POST   /api/v1/admin/configurator/widgets/{id}/preview
       Body: { config: WidgetConfig, domain: string }
       Response: { preview_url: string }

POST   /api/v1/admin/configurator/widgets/{id}/build
       Body: { site_id: number }
       Response: { build: SiteScriptBuild, script_tag: string }

# === Cases (CRUD) ===

GET    /api/v1/admin/cases
       Query: ?page=1&per_page=20
       Response: { data: [Case], meta: Pagination }

POST   /api/v1/admin/cases
       Body: { store, store_url, store_logo_url?, platform?, description, review_text?, review_rating?, screenshot_urls[]?, widgets[]? }
       Response: 201 { case: Case }

PUT    /api/v1/admin/cases/{id}
       Body: { ...fields }
       Response: { case: Case }

DELETE /api/v1/admin/cases/{id}
       Response: 204

# === Demo Sessions ===

GET    /api/v1/admin/demo-sessions
       Query: ?page=1&per_page=20
       Response: { data: [DemoSession], meta: Pagination }

POST   /api/v1/admin/demo-sessions
       Body: { domain, config, expires_in_days?: 7 }
       Response: 201 { demo_session: DemoSession, share_url: string }

DELETE /api/v1/admin/demo-sessions/{id}
       Response: 204

# === Leads ===

GET    /api/v1/admin/consultations
       Query: ?status=&page=1&per_page=20
       Response: { data: [Consultation], meta: Pagination }

GET    /api/v1/admin/consultations/{id}
       Response: { consultation: Consultation }

PATCH  /api/v1/admin/consultations/{id}
       Body: { status?, notes? }
       Response: { consultation: Consultation }

GET    /api/v1/admin/manager-requests
       Query: ?status=&type=&page=1&per_page=20
       Response: { data: [ManagerRequest], meta: Pagination }

PATCH  /api/v1/admin/manager-requests/{id}
       Body: { status?, notes? }
       Response: { manager_request: ManagerRequest }

# === Settings ===

GET    /api/v1/admin/settings
       Response: { profile, notifications, language, api_keys_count, webhooks_count }

PUT    /api/v1/admin/settings
       Body: { ... }
       Response: { ...updated }

GET    /api/v1/admin/api-keys
       Response: { data: [ApiKey] }

GET    /api/v1/admin/webhooks
       Response: { data: [Webhook] }
```

### 3.6 Internal (X-Gateway-Secret)

```
POST   /api/v1/internal/site-scripts/deploy        — деплой JS на R2
POST   /api/v1/internal/site-scripts/activate       — deploy + activate
POST   /api/v1/internal/site-scripts/deactivate     — видалити з R2 + deactivate
PATCH  /api/v1/internal/site-scripts/config         — оновити конфіг
```

---

## 4. Сервіси (Services)

```
app/Services/
├── Auth/
│   ├── OtpService.php              — генерація, надсилання (email/SMS), верифікація OTP
│   │                                 Redis TTL 10 хв, 5 спроб, 30 сек rate limit
│   ├── LinkService.php             — magic link: створення, підтвердження, поллінг
│   └── RegistrationService.php     — 3-кроковий флоу реєстрації (OTP → verify → complete)
│
├── Payment/
│   ├── PaymentManager.php          — фасад: вибір провайдера (liqpay/monopay)
│   ├── LiqPayService.php           — підпис, encode, verify callback, recurring
│   └── MonoPayService.php          — створення invoice, verify webhook
│
├── Billing/
│   ├── SubscriptionService.php     — створення, зміна, скасування підписки
│   ├── ProrationService.php        — розрахунок пророзрахунку при зміні плану
│   ├── GracePeriodService.php      — обробка failed payments, retry logic
│   └── InvoiceService.php          — генерація рахунків
│
├── Order/
│   ├── OrderService.php            — створення замовлення
│   ├── OrderNumberGenerator.php    — формат: W-XXXXXX
│   └── RefundService.php           — повернення коштів через провайдер
│
├── Script/
│   ├── ScriptBuildService.php      — HTTP-клієнт до Widget Builder (POST /build)
│   └── ScriptDeployService.php     — деплой JS на R2, версіонування, rollback
│
├── Site/
│   ├── SiteService.php             — CRUD сайтів, перевірка лімітів
│   └── SiteVerificationService.php — перевірка встановлення скрипту (HTTP check)
│
├── Notification/
│   └── NotificationService.php     — створення, read/unread, cleanup
│
├── Activity/
│   └── ActivityLogService.php      — логування дій користувача
│
├── Dashboard/
│   ├── UserDashboardService.php    — агрегація для user dashboard
│   └── AdminDashboardService.php   — агрегація для admin dashboard + KPI
│
├── Finance/
│   ├── FinanceService.php          — MRR, revenue, транзакції
│   └── ExportService.php           — CSV/XLSX export
│
├── Demo/
│   └── DemoSessionService.php      — створення, валідація, cleanup
│
└── Currency/
    └── CurrencyService.php         — оновлення курсів з НБУ
```

---

## 5. Middleware

```
app/Http/Middleware/
├── JwtAuthenticate.php             — перевірка JWT токена
├── RequireRole.php                 — перевірка ролі (admin, customer)
├── ForceJsonResponse.php           — API завжди JSON
├── GatewaySecretMiddleware.php     — X-Gateway-Secret для internal
├── SecurityHeaders.php             — HSTS, X-Frame-Options, CSP
├── SetLocale.php                   — мова з Accept-Language header
├── ThrottleByType.php              — rate limiting по типах:
│                                     public: 60/хв
│                                     auth: 10/хв
│                                     leads: 3/год
│                                     admin: 120/хв
```

---

## 6. Models + Relations

```php
// User
User → hasOne(Subscription)
User → hasMany(Site)
User → hasMany(Order)
User → hasMany(Payment)
User → hasMany(Notification)
User → hasMany(ActivityLog)
User → hasMany(SocialAccount)
User → hasMany(Review)
User → hasMany(ManagerRequest)

// Subscription
Subscription → belongsTo(User)
Subscription → belongsTo(Plan)

// Plan
Plan → hasMany(Subscription)
Plan → belongsToMany(Product, 'product_plan_access')
Plan → hasMany(PlanFeatureValue)

// Site
Site → belongsTo(User)
Site → hasOne(SiteScript)
Site → hasMany(SiteWidget)
Site → hasMany(ManagerRequest)

// SiteScript
SiteScript → belongsTo(Site)
SiteScript → hasMany(SiteScriptBuild)

// Product
Product → belongsToMany(Plan, 'product_plan_access')
Product → belongsTo(WidgetTag, 'tag_slug')
Product → hasMany(SiteWidget)

// SiteWidget
SiteWidget → belongsTo(Site)
SiteWidget → belongsTo(Product)

// Order
Order → belongsTo(User)
Order → belongsTo(Plan)
Order → hasMany(Payment)

// Payment
Payment → belongsTo(User)
Payment → belongsTo(Order)
Payment → belongsTo(Subscription)
```

---

## 7. Email Templates

```
app/Mail/
├── Auth/
│   ├── OtpMail.php                     — 6-значний OTP код
│   └── MagicLinkMail.php               — magic link для входу
│
├── Billing/
│   ├── SubscriptionCreatedMail.php     — підписка створена (welcome)
│   ├── TrialEndingMail.php             — trial закінчується через N днів
│   ├── PaymentSuccessMail.php          — оплата пройшла
│   ├── PaymentFailedMail.php           — оплата не пройшла + grace period info
│   ├── SubscriptionCancelledMail.php   — підписка скасована
│   └── PlanChangedMail.php             — план змінено
│
├── Order/
│   ├── OrderConfirmationMail.php       — підтвердження замовлення
│   └── RefundConfirmationMail.php      — повернення коштів
│
├── Admin/
│   ├── NewOrderNotification.php        — новий замовлення → адмін
│   ├── ConsultationNotification.php    — нова консультація → адмін
│   └── ManagerRequestNotification.php  — запит менеджера → адмін
```

Усі через чергу: `Mail::queue()`. Мова з `users.locale`.

---

## 8. Scheduled Tasks (Cron)

```php
// Кожні 5 хвилин: перевірити зависші оплати
Schedule::command('orders:check-pending')->everyFiveMinutes();

// Кожний день о 04:00: деактивація протермінованих trial
Schedule::command('subscriptions:expire-trials')->dailyAt('04:00');

// Кожний день о 04:30: обробка grace period (retry failed payments)
Schedule::command('subscriptions:process-grace-period')->dailyAt('04:30');

// Кожний день о 03:00: очищення протермінованих демо-сесій
Schedule::command('demo:cleanup')->dailyAt('03:00');

// Кожний день о 10:00: оновлення курсів валют
Schedule::command('currencies:update')->dailyAt('10:00');

// Кожний день о 05:00: trial ending reminders (3 дні до кінця, 1 день)
Schedule::command('notifications:trial-ending')->dailyAt('05:00');

// Кожний день о 06:00: очищення старих сповіщень (>90 днів)
Schedule::command('notifications:cleanup')->dailyAt('06:00');
```

---

## 9. Порядок реалізації (покроково)

### Фаза 1 — Фундамент (Тижні 1-2)

| # | Задача | Деталі |
|---|--------|--------|
| 1.1 | Ініціалізація Laravel 11 | Чистий проект, Docker setup |
| 1.2 | Підключити пакети | Lunar, JWT, Spatie (permission, settings, translatable), Filament |
| 1.3 | Міграції кастомних таблиць | users, plans, subscriptions, sites, site_scripts, site_script_builds, orders, payments, notifications, activity_log, faq_items та інші |
| 1.4 | Seeders | Plans (free/basic/pro/max), Products (6 віджетів), Tags, FAQ, Demo cases, тестовий admin |
| 1.5 | Моделі + зв'язки | Усі Eloquent models з relations, scopes, accessors |
| 1.6 | Middleware | JWT, roles, JSON, security headers, locale, throttle |
| 1.7 | OpenAPI scaffold | Базовий `docs/openapi.yaml` зі структурою |

### Фаза 2 — Auth (Тиждень 3)

| # | Задача | Деталі |
|---|--------|--------|
| 2.1 | JWT auth | Login (OTP), refresh, logout |
| 2.2 | OTP service | Email (6-значний код), Redis TTL 10 хв, rate limit |
| 2.3 | Magic link | Створення, підтвердження, поллінг |
| 2.4 | Registration flow | 3-кроковий: email → OTP verify → complete (site + trial) |
| 2.5 | Google OAuth | Socialite integration |
| 2.6 | SMS OTP (Vonage) | Резервний канал для OTP |

### Фаза 3 — Каталог + Плани (Тиждень 4)

| # | Задача | Деталі |
|---|--------|--------|
| 3.1 | Products API | GET /products (filter, search, paginate), GET /products/{slug} |
| 3.2 | Tags API | GET /tags |
| 3.3 | Plans API | GET /plans, GET /plans/{slug}/features |
| 3.4 | FAQ API | GET /faq |
| 3.5 | Cases API | GET /cases |
| 3.6 | Reviews API | GET /reviews (approved) |
| 3.7 | Settings API | GET /settings |
| 3.8 | Consultations/Requests | POST /consultations, POST /manager-requests |

### Фаза 4 — Платежі та підписки (Тижні 5-6)

| # | Задача | Деталі |
|---|--------|--------|
| 4.1 | Checkout flow | POST /checkout → create order → payment URL |
| 4.2 | LiqPay integration | Створення платежу, callback verification, recurring setup |
| 4.3 | MonoPay integration | Invoice, webhook, recurring |
| 4.4 | PaymentManager | Фасад для вибору провайдера |
| 4.5 | Subscription creation | Після оплати: створити/оновити підписку |
| 4.6 | Trial logic | 7-денний trial, auto-expiration |
| 4.7 | Plan change + proration | Upgrade/downgrade з пророзрахунком |
| 4.8 | Cancel subscription | Скасування з доступом до кінця періоду |
| 4.9 | Grace period | Failed payment → 3 retry, grace 3 дні |
| 4.10 | Cron: check-pending | Polling LiqPay/MonoPay для pending orders |
| 4.11 | Cron: expire-trials | Деактивація протермінованих trial |
| 4.12 | Cron: process-grace | Retry failed payments |

### Фаза 5 — Кабінет користувача (Тижні 7-8)

| # | Задача | Деталі |
|---|--------|--------|
| 5.1 | Dashboard API | GET /me/dashboard — агрегація даних |
| 5.2 | Profile CRUD | GET/PUT/DELETE /me/profile, avatar upload |
| 5.3 | Sites CRUD | GET/POST/DELETE /me/sites, limits check |
| 5.4 | Site verification | POST /me/sites/{id}/verify — HTTP check |
| 5.5 | Site widgets | GET /me/sites/{id}/widgets, PUT toggle + config |
| 5.6 | My widgets | GET /me/widgets — available + locked |
| 5.7 | Subscription mgmt | GET/change/cancel /me/subscription |
| 5.8 | Payment history | GET /me/payments |
| 5.9 | Notifications | GET + mark read + mark all read |
| 5.10 | Settings | GET/PUT /me/settings |
| 5.11 | Support requests | POST /me/support-requests |
| 5.12 | Onboarding | POST /me/onboarding/complete |
| 5.13 | Demo | GET/POST /me/sites/{id}/demo |
| 5.14 | Change password | POST /me/change-password |
| 5.15 | 2FA | PUT /me/security/2fa |
| 5.16 | Activity log | Logging всіх дій через ActivityLogService |

### Фаза 6 — Admin API (Тижні 9-10)

| # | Задача | Деталі |
|---|--------|--------|
| 6.1 | Admin Dashboard | GET /admin/dashboard — KPI aggregation |
| 6.2 | Orders mgmt | CRUD + refund + verify-payment + complete |
| 6.3 | Users mgmt | List + detail + block/unblock + change plan |
| 6.4 | Sites mgmt | List + detail + toggle widgets + activate/deactivate |
| 6.5 | Subscriptions list | List with filters + stats |
| 6.6 | Finance dashboard | MRR, revenue, transactions + export |
| 6.7 | Configurator API | Widget config CRUD + preview + build |
| 6.8 | Cases CRUD | Admin CRUD for customer cases |
| 6.9 | Demo sessions | CRUD |
| 6.10 | Leads mgmt | Consultations + manager requests |
| 6.11 | Settings | Admin settings, API keys, webhooks |

### Фаза 7 — Скрипти та CDN (Тиждень 11)

| # | Задача | Деталі |
|---|--------|--------|
| 7.1 | SiteScript generation | Token generation, script URL |
| 7.2 | ScriptBuildService | HTTP to Widget Builder |
| 7.3 | ScriptDeployService | R2 upload, versioning |
| 7.4 | Rollback mechanism | Switch between build versions |
| 7.5 | Internal API | Deploy, activate, deactivate, config update |

### Фаза 8 — Filament Admin Panel (Тиждень 12)

| # | Задача | Деталі |
|---|--------|--------|
| 8.1 | Resources | OrderResource, CustomerResource, ProductResource, SubscriptionResource, SiteResource, SiteScriptResource, CaseResource, DemoSessionResource, ConsultationResource, ManagerRequestResource, FaqResource, ReviewResource |
| 8.2 | Dashboard widgets | KPI cards, charts, recent orders |
| 8.3 | Settings pages | GeneralSettings via Spatie |
| 8.4 | Admin OTP login | 2FA для адмін-панелі |

### Фаза 9 — Безпека та фіналізація (Тиждень 13)

| # | Задача | Деталі |
|---|--------|--------|
| 9.1 | Rate limiting | Per-endpoint throttle config |
| 9.2 | CORS | Frontend domains whitelist |
| 9.3 | Input validation | Form Requests for all endpoints |
| 9.4 | Security headers | HSTS, X-Frame-Options, CSP |
| 9.5 | Logging | Structured logs: auth, payments, errors |
| 9.6 | Queue jobs | Email, builds, cleanup |
| 9.7 | Tests | Unit (services) + Feature (API endpoints) |
| 9.8 | OpenAPI finalization | Complete spec, validation |

---

## 10. composer.json (перевірено — 0 конфліктів)

```json
{
  "require": {
    "php": "^8.2",
    "laravel/framework": "^12.0",
    "filament/filament": "^5.0",
    "tymon/jwt-auth": "^2.3",
    "spatie/laravel-permission": "^7.0",
    "spatie/laravel-settings": "^3.7",
    "spatie/laravel-translatable": "^6.0",
    "spatie/laravel-data": "^4.0",
    "laravel/socialite": "^5.26",
    "resend/resend-laravel": "^1.3",
    "laravel/vonage-notification-channel": "^3.0",
    "predis/predis": "^3.4",
    "league/flysystem-aws-s3-v3": "^3.0"
  },
  "require-dev": {
    "ensi/laravel-openapi-server-generator": "^4.0",
    "fakerphp/faker": "^1.23",
    "laravel/pint": "^1.13",
    "mockery/mockery": "^1.6",
    "phpunit/phpunit": "^11.0"
  }
}
```

---

## 11. Структура директорій бекенду

```
backend/
├── app/
│   ├── Console/Commands/          — Artisan commands (cron jobs)
│   ├── Enums/                     — PHP enums (Status, Platform, BillingPeriod, etc.)
│   ├── Events/                    — Domain events
│   ├── Filament/
│   │   ├── Resources/             — 12 Filament resources
│   │   ├── Pages/                 — Dashboard, Settings
│   │   └── Widgets/               — KPI widgets
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/
│   │   │   │   ├── V1/
│   │   │   │   │   ├── Auth/      — AuthController, RegisterController
│   │   │   │   │   ├── Public/    — ProductController, PlanController, CaseController, etc.
│   │   │   │   │   ├── Customer/  — DashboardController, SiteController, SubscriptionController, etc.
│   │   │   │   │   ├── Admin/     — all admin controllers
│   │   │   │   │   └── Internal/  — SiteScriptController
│   │   │   │   └── Webhooks/      — PaymentWebhookController
│   │   ├── Middleware/            — 7 middleware
│   │   ├── Requests/              — Form Requests (validation)
│   │   └── Resources/             — API Resources (transformers)
│   ├── Listeners/                 — Event listeners
│   ├── Mail/                      — 12+ mailable classes
│   ├── Models/                    — 20+ Eloquent models
│   ├── Notifications/             — Laravel notification classes
│   ├── Observers/                 — Model observers
│   ├── Policies/                  — Authorization policies
│   ├── Providers/
│   └── Services/                  — ~15 service classes
│
├── config/
│   ├── auth.php                   — JWT guard config
│   ├── jwt.php                    — JWT settings
│   ├── permission.php             — Spatie permissions
│   ├── services.php               — LiqPay, MonoPay, R2, Vonage, etc.
│   └── ...
│
├── database/
│   ├── migrations/                — ~30 migration files
│   ├── seeders/                   — Plans, Products, Tags, FAQ, Demo data
│   └── factories/                 — Model factories for tests
│
├── docs/
│   └── openapi.yaml               — OpenAPI 3.1 spec
│
├── routes/
│   ├── api.php                    — V1 API routes
│   ├── web.php                    — Filament admin
│   └── console.php                — Scheduled tasks
│
├── tests/
│   ├── Unit/                      — Service unit tests
│   └── Feature/                   — API integration tests
│
└── ...
```

---

## 12. Enums

```php
// app/Enums/Platform.php
enum Platform: string {
    case Horoshop = 'horoshop';
    case Shopify = 'shopify';
    case WooCommerce = 'woocommerce';
    case OpenCart = 'opencart';
    case WordPress = 'wordpress';
    case Other = 'other';
}

// app/Enums/BillingPeriod.php
enum BillingPeriod: string {
    case Monthly = 'monthly';
    case Yearly = 'yearly';
}

// app/Enums/SubscriptionStatus.php
enum SubscriptionStatus: string {
    case Active = 'active';
    case Trial = 'trial';
    case PastDue = 'past_due';
    case Cancelled = 'cancelled';
    case Expired = 'expired';
}

// app/Enums/OrderStatus.php
enum OrderStatus: string {
    case Pending = 'pending';
    case Paid = 'paid';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case Refunded = 'refunded';
}

// app/Enums/PaymentStatus.php
enum PaymentStatus: string {
    case Pending = 'pending';
    case Success = 'success';
    case Failed = 'failed';
    case Refunded = 'refunded';
}

// app/Enums/SiteStatus.php
enum SiteStatus: string {
    case Pending = 'pending';
    case Active = 'active';
    case Deactivated = 'deactivated';
}

// app/Enums/LeadStatus.php
enum LeadStatus: string {
    case New = 'new';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}

// app/Enums/NotificationType.php
enum NotificationType: string {
    case TrialWarning = 'trial_warning';
    case WidgetActivated = 'widget_activated';
    case UpdateAvailable = 'update_available';
    case PaymentSuccess = 'payment_success';
    case PaymentFailed = 'payment_failed';
    case PlanChanged = 'plan_changed';
    case SubscriptionCancelled = 'subscription_cancelled';
}
```

---

## 13. Мультимовність

### Підхід

- Дані в БД: англійською (slug, enum values, keys)
- Перекладні поля: jsonb `{"en": "...", "uk": "..."}`
- Пакет: `spatie/laravel-translatable`
- API: `Accept-Language: uk` header → відповідь українською
- Fallback: en → uk
- UI labels: на фронтенді (i18n)
- Email: мова з `users.locale`

### Перекладні поля по таблицях

| Таблиця | Перекладні поля |
|---------|----------------|
| plans | name, description |
| plan_features | name |
| products (Lunar) | name, description, long_description, features |
| widget_tags | name |
| customer_cases | description |
| faq_items | question, answer |
| notifications | title, body |
| activity_log | description |
| payments | description |

### Непеpекладні (завжди англійською)

- slug, enum values, config keys, platform names
- email addresses, URLs, phone numbers
- JSON config structures

---

## 14. Відкриті питання для обговорення

1. ~~**Бізнес-модель:**~~ ✅ Підписки підтверджено, разові оплати прибрані.
2. ~~**Lunar:**~~ ✅ Видалено — не потрібен для підписок, конфлікт з Filament 5.
3. **Фіскалізація:** Checkbox.ua інтеграція — включати в MVP чи пізніше?
4. **Recurring billing:** LiqPay підтримує recurring? Чи серверний cron + manual charge?
5. **MonoPay:** включати в MVP чи тільки LiqPay?
6. **Horoshop API:** потрібна інтеграція для автоперевірки скрипту?
7. **Widget builder:** API контракт — який endpoint, які параметри?
8. **R2 upload:** через AWS SDK (`league/flysystem-aws-s3-v3` — вже в стеку) чи Cloudflare API?
9. **Admin panel:** Filament 5 (server-rendered) використовується для внутрішнього CRUD. API для зовнішнього React-адмін UI (дизайн).
10. **Тести:** мінімальний набір для MVP — лише Feature tests на API чи також Unit?
