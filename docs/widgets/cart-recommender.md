# Module: cart-recommender

Умный рекомендатор товаров в корзине Horoshop-магазина. Бэкенд отдаёт рекомендации для конкретного товара/корзины, фронт просто рендерит карточки в стиле Horoshop.

## Бизнес-логика

- Связи «товар → рекомендованные» на Этапе 1 хардкодим в JSON per-site.
- Дальше: импорт связей из XLSX-выгрузки клиента.
- В будущем: AI-эмбеддинги для авто-связей (футболка → шорты/штаны, кепка → футболка в цвет, ручка → блокнот, носки → ботинки и т.д.).
- Модуль будет распространяться по подписке (учтём позже, не на этапе 1).

## Архитектура

```
Browser (cart drawer / страница товара)
  ↓ GET /api/v1/widgets/cart-recommender/suggest?product_id={current}
Backend (Laravel)
  ↓ ищет рекомендации для product_id
  ↓ источник: storage/app/recommendations/{site}.json (этап 1)
  → возвращает [{ id, url, image, title{ua,en,ru}, price_new, price_old, currency }]
Browser
  → рендерит карточки в стиле .catalog-card--small над/под/вместо .cart__related-goods
  → клик → AjaxCart.getInstance().appendProduct({type:'product', id}, undefined, true)
```

## Этапы

1. **Этап 1 (текущий)** — backend endpoint + статический JSON источник, фронт-модуль, рендер на мобилке. Один сайт (benihome.com.ua), один тестовый товар (ID 516).
2. **Этап 2** — XLSX-импортёр, таблица `widget_cart_recommendations` в БД, админка для управления связями.
3. **Этап 3** — AI-эмбеддинги (vector search) для авто-генерации связей вместо ручного маппинга.
4. **Этап 4** — трекинг кликов/конверсий, A/B-тесты, аналитика по плану подписки.

## Этап 1 — детали

### Backend

- **Endpoint:** `GET /api/v1/widgets/cart-recommender/suggest?product_id={id}`
- **Site resolution:** из `Origin`/`Referer` header → lookup `sites.domain` (см. правило `feedback_widget_site_resolution` — никогда из body/JWT).
- **Контроллер:** `WidgetCartRecommenderController@suggest`
- **Сервис:** `CartRecommenderService::suggestForProduct(Site $site, int $productId): array`
- **Источник данных (этап 1):** `storage/app/recommendations/{site_domain}.json`
  ```json
  {
    "516": [
      {
        "id": 516,
        "url": "/postilna-bilizna-satin-z-ryushamy-ta-kantom-beni-polutornyi-1/",
        "image": "/content/images/17/480x720l85nn0/postilna-bilizna-satin-z-ryushamy-ta-kantom-beni-polutornyi-1-44942974776283.webp",
        "title": { "ua": "...", "en": "...", "ru": "..." },
        "price_new": 4340,
        "price_old": 6200,
        "currency": "UAH"
      }
    ]
  }
  ```
- **Cache:** `Cache::remember("rec:{$siteId}:{$productId}", 600, ...)`
- **Response:** `{ "data": [...] }`. Если рекомендаций нет — `{ "data": [] }`.
- **Тест:** `tests/Feature/WidgetCartRecommenderTest.php` (Pest, feature-test).

### Frontend

- **Расположение:** `widget-builder/modules/module-cart-recommender/`
- **Структура:**
  ```
  module-cart-recommender/
  ├── package.json     # @laxarevii/module-cart-recommender, dep @laxarevii/core
  ├── schema.ts        # Zod: enabled, apiUrl, site, position
  ├── index.ts         # default function: mount + fetch + render
  ├── dom.ts           # генерация catalog-card--small
  ├── i18n.ts schema   # { heading: 'Рекомендуємо' }
  └── e2e.test.ts      # smoke
  ```
- **Поведение:**
  1. Только мобилка (`matchMedia('(max-width: 768px)')`).
  2. Определение `product_id`: на странице товара — из DOM/URL; в drawer-корзине — из последнего `onProductAdd` AjaxCart event.
  3. `fetch` → API endpoint.
  4. Рендер карточек точно как у Horoshop (`.catalog-card.catalog-card--small`), чтобы визуально слиться.
  5. Клик «До кошика» → `window.AjaxCart.getInstance().appendProduct({type:'product', id}, undefined, true)`.
  6. `MutationObserver` на корзину для перерендера при изменении.
- **Заголовок:** через `getLanguage()` из `@laxarevii/core`.
- **Per-site config:** `widget-builder/sites/benihome.com.ua/modules/module-cart-recommender/{config,i18n}.ts`.

## Тестовые данные (этап 1)

- Сайт: **benihome.com.ua**
- Тестовый товар (за ним показываем рекомендации): любой товар на `/postilna-bilizna-satin-santal-polutornyi-1/`
- Рекомендуемый товар: ID **516**, «Постільна білизна сатин з рюшами та кантом Beni»

## Открытые вопросы

1. **Хранение данных этап 1**: JSON-файл vs таблица БД → склоняемся к JSON для скорости, мигрируем в БД на Этапе 2 вместе с XLSX-импортом.
2. **Положение блока**: над / вместо / под Horoshop `.cart__related-goods` → нужно решить (по умолчанию — отдельный блок над).
3. **Десктоп** на этапе 1 не делаем (<5% покупок).
4. **XLSX-выгрузка** клиента: ссылка `.xxx/f82af9ca985b1ec4a48f9fb7a663f9d0.xlsx` — не используется на этапе 1, нужна для этапа 2.

## Cartum API (внешняя интеграция, для будущих этапов)

Документация Horoshop Cartum API нужна для интеграции рекомендатора с реальным каталогом магазина (получение цены, фото, наличия в реальном времени вместо хардкода в JSON).

- **Gateway:** `http://<DOMAIN>/api/`
- **Auth:** логин/пароль из Horoshop Settings → Users tab. Тестовые creds для benihome: `owner / welcome32503` (хранить в `.env`, не в коде).
- **Метод:** JSON POST, `Content-Type: application/json`, UTF-8 без BOM.
- **Response:** `{ status, response }`, где `status` ∈ `OK | UNAUTHORIZED | AUTHORIZATION_ERROR | EXCEPTION | ERROR | EMPTY | UNDEFINED_FUNCTION | HTTP_ERROR`.
- **Логи запросов:** `http://<DOMAIN>/api/logs/` (auth теми же creds).
- **Полная Notion-дока:** https://horoshop.notion.site/Cartum-API-1b6cc289707981c1b675c112094c6e82
- **Скриншот:** [`frontend/screenshots/cartum-api-1.png`](../../frontend/screenshots/cartum-api-1.png)

**Подстраницы Notion (нужны для интеграции, ещё не разобраны):**
- Catalog ⭐ — получение товаров
- Product sets ⭐ — возможно готовый механизм рекомендаций в Horoshop
- Authorisation — token flow
- Web-hooks, Orders, Currencies, Delivery options, Payments, Pages, Users
- Cartum API update log, Possible API errors

## Шаги выполнения

1. Backend: миграция (если нужна), контроллер, сервис, роут, feature-тест. Коммит `feat: add cart-recommender public API endpoint`.
2. Frontend skeleton: `package.json`, `schema.ts`, `index.ts` (mount detection + log). Коммит `feat: scaffold module-cart-recommender`.
3. Frontend rendering: `dom.ts`, fetch + рендер карточек, клик. Коммит `feat: render cart recommender carousel on mobile`.
4. Per-site config для benihome.com.ua. Коммит `feat: configure cart-recommender for benihome.com.ua`.
5. Backend data: `storage/app/recommendations/benihome.com.ua.json` с товаром 516. Коммит `chore: seed cart-recommender data for benihome`.
6. E2E smoke + ручная проверка через site-proxy на `https://benihome.com.ua/postilna-bilizna-satin-santal-polutornyi-1/`.

## Связанная документация

- [`widget-builder/modules/README.md`](../../widget-builder/modules/README.md) — общие правила добавления модулей.
- [`docs/v2-backend-plan.md`](../v2-backend-plan.md) — общий план бэкенда.
- [`frontend/DESIGN-STANDARDS.md`](../../frontend/DESIGN-STANDARDS.md) — дизайн-стандарты (для админки настройки модуля).
