# Widget Bundle Performance — анализ и дорожная карта

**Дата:** 2026-05-18
**Тема:** Почему `WCKdz.js` тормозит сайт мерчанта на 3+ секунды LCP и как это починить.
**Кейс:** benihome.com.ua — Performance 46 (mobile), LCP 18.9s. Без виджетов: Performance 50, LCP 15.6s.

---

## 0. Канонический сниппет установки на сайт мерчанта

Вставляется в админке Horoshop → **«Скрипти всередині тегу `<head>`»**, первым в этом окне:

```html
<link rel="dns-prefetch" href="https://cdn.widgetis.com">
<link rel="preconnect" href="https://cdn.widgetis.com" crossorigin>
<script src="https://cdn.widgetis.com/sites/{domain}/{token}.js" defer></script>
```

`{domain}` и `{token}` подставляются автоматически методом `SiteScript::getScriptTagAttribute()` (`backend/app/WidgetRuntime/Models/SiteScript.php`).

**Почему именно так:**
- `dns-prefetch` + `preconnect` обязаны быть в `<head>` — в `<body>` браузер их игнорирует или применяет с опозданием.
- `defer` не блокирует парсинг и не конкурирует с LCP-изображением за bandwidth (в отличие от `async`).
- Сниппет ставится **первым** в окне «всередині `<head>`», чтобы preconnect сработал до того, как браузер начнёт качать swiper/прочие сторонние ресурсы.

**Что НЕ делать:**
- ❌ Не использовать `async` — он крадёт bandwidth у LCP-картинки на Slow 4G.
- ❌ Не вставлять в «після `<body>`» или «перед `</body>`» — там preconnect/dns-prefetch теряют эффект.
- ❌ Не добавлять `<link rel="preload">` для bundle — отнимет приоритет у LCP-картинки.
- ❌ Не дублировать тег в нескольких слотах.

---

## 1. TL;DR

После включения widgetis-скрипта на benihome.com.ua Lighthouse-метрики мобильной версии деградируют:

| Метрика | Без виджетов | С виджетами | Δ |
|---|---|---|---|
| Performance Score | 50 | 46 | -4 |
| First Contentful Paint | 6.4 s | 8.8 s | +2.4 s |
| Largest Contentful Paint | 15.6 s | 18.9 s | +3.3 s |
| Total Blocking Time | 330 ms | 410 ms | +80 ms |
| Speed Index | 7.9 s | 9.7 s | +1.8 s |
| Cumulative Layout Shift | 0 | 0 | 0 |

**Главные причины деградации (по убыванию веса):**

1. **`async` в `<head>`** — скрипт качается параллельно с критическими ресурсами (LCP-изображением), отнимая bandwidth на Slow 4G.
2. **Размер бандла 941 KB без сжатия** — отдаётся с R2 (`pub-0e965c30...r2.dev`) без brotli/gzip. С brotli был бы ~187 KB.
3. **`Cache-Control: no-cache, no-store, must-revalidate`** — каждый визит качает весь bundle заново. В `ScriptBuilderService.php:115` стоит этот заголовок; в `widget-builder/server.ts:125` правильное `public, max-age=300` — но используется фактически путь через бэкенд.
4. **Содержимое bundle**:
   - Полный рантайм **Zod** (~50 KB) — валидация конфига, которая должна происходить только на сервере при сборке.
   - **Обфускация** `javascript-obfuscator` со `stringArray: true` (фактически `_0x2fcc8b`-стайл переменные) — раздувает код на 30-50% и **ухудшает** gzip-степень из-за устранения повторяющихся идентификаторов.
   - Все модули склеены в один bundle, без code-splitting.

## 2. Архитектура — где живёт что

```
backend/app/WidgetRuntime/Models/SiteScript.php:65         ← генерит <script> тег для копирования в Horoshop
backend/app/WidgetRuntime/Services/Site/ScriptBuilderService.php:111-126
                                                            ← заливает bundle в R2
                                                            ← путь: sites/{domain}/{token}.js
                                                            ← заголовок: Cache-Control: no-cache, no-store, must-revalidate ← ❌
widget-builder/index.ts:83 buildModules()                  ← собирает bundle через Vite
widget-builder/index.ts:171-186                            ← domain-guard injection
widget-builder/index.ts:188-202                            ← обфускация
widget-builder/server.ts:125                               ← /deploy endpoint, Cache-Control: public, max-age=300 (правильный)
```

**Текущий тег** (`SiteScript.php:65`):
```php
return sprintf('<script src="%s" async></script>', $url);
```

**URL стабильный, per-site**: `sites/{domain}/{token}.js`. Token — `Str::random(5)`, фиксируется на сайт.

## 3. Бенчмарки — три эталонных подхода

Изучили три реальных сайта, использующих Horoshop, с разной архитектурой виджетов.

### 3.1 protexttile.com.ua — Performance 90

**Подход:** все виджеты **inline в HTML** через секцию Horoshop «Scripts before `</body>`». Никакого внешнего файла. 7 отдельных `<script>` блоков:

| Блок | Виджет |
|---|---|
| 1 | Presence Pulse Dot (точка «онлайн») |
| 2 | Price Save Badge (плашка «экономишь N грн») |
| 3 | Rotating Messages (social-proof) |
| 4 | Delivery Date (cart-goal-delivery) |
| 5 | Rating Badge (звёзды под H1) |
| 6 | Online Consult Badge |
| 7 | Menu Category Badges |
| + | Cart drawer enhancements |

**Почему быстро:**
- Ноль внешних запросов виджетного кода
- Кешируется вместе с HTML
- Никаких DNS+TLS handshake'ов
- ~30-50 KB инлайн вместо 941 KB external
- Vanilla ES5/ES2015 — никакого Zod, никакого framework
- Большинство модулей стартуют на `DOMContentLoaded`, не сразу при парсинге
- `MutationObserver` с авто-disconnect через `window.load + 3s` — экономия CPU

**Минусы:**
- Каждое изменение — ручное обновление в админке Horoshop
- Нет multi-tenant платформы
- Нет A/B тестов
- Нет per-plan ограничений

**Не наш путь** — теряет всю ценность widgetis как платформы.

### 3.2 safeyourlove.com / snackup.com.ua — Performance 80

**Подход:** SaaS-платформа [loyalshop.app](https://loyalshop.app). Архитектурно **очень похожа на widgetis**, но оптимизирована правильно.

**Топология:**
```
┌──────────────────────────────────────────────────────┐
│  Общий рантайм (один на всех мерчантов loyalshop)    │
│  cdn.loyalshop.app/prod/core.14d24250.bundle.js      │
│  Content-hash + immutable cache навсегда             │
│  Brotli автоматически (custom domain)                │
│  Lazy-loaded модули (smart-search, popup, fingerprint)│
└──────────────────────┬───────────────────────────────┘
                       │ читает
                       ↓
┌──────────────────────────────────────────────────────┐
│  Per-shop конфиг (уникальный для каждого мерчанта)   │
│  cdn.loyalshop.app/prod/loader.js?shop=shop-4hxjzi   │
│  Короткий TTL, маленький размер                       │
└──────────────────────────────────────────────────────┘
```

**Восемь правильных приёмов:**

1. **Все скрипты `defer`** (не `async`). Защищает FCP/LCP без потери совместимости.
2. **`<link rel="preconnect">` + `<link rel="dns-prefetch">`** к их CDN — TLS handshake делается до начала загрузки скриптов.
3. **Code splitting** на 5+ мелких bundle'ов: `core`, `fingerprint`, `global`, `smart-search`, `popup`. HTTP/2 multiplexing качает параллельно.
4. **Content-hashed имена файлов** (`core.14d24250.bundle.js`) + **SRI** (`integrity="sha384-..."`). Cache `max-age=31536000, immutable`.
5. **Custom domain** `cdn.loyalshop.app` (своя зона Cloudflare) → brotli автоматически, edge-кеш по миру, DDoS protection бесплатно.
6. **Server-side рендер «оболочки» виджета** — `<div id="loyalshop-marquee">` уже есть в HTML со стилями. JS только апдейтит значения. CLS ≈ 0, LCP не страдает.
7. **Inline критичный CSS** — все стили виджетов в `<style>` блоке в `<head>`. Никаких отдельных CSS-файлов.
8. **Lazy-load и delayed-load** для тяжёлых/нерелевантных-в-первую-секунду виджетов:
   - Instagram-feed через `IntersectionObserver` (только при скролле)
   - Чат-попап через `setTimeout(..., 15000)` (через 15 секунд после загрузки)

**Это наш целевой архитектурный паттерн.**

### 3.3 benihome.com.ua (widgetis, текущее состояние) — Performance 46

См. раздел 1.

## 4. Сравнительная таблица

| Аспект | protexttile | benihome (widgetis) | loyalshop |
|---|---|---|---|
| Performance | 90 | 46 | 80 |
| LCP | 1.4s | 18.9s | 1.6s |
| Подход | inline через Horoshop | внешний R2 bundle | внешний CDN на своём домене |
| Loading | `<script>` в `<body>` | `async` в `<head>` | `defer` + preconnect |
| Размер | ~30 KB inline | 941 KB не сжат | 5 малых bundle'ов с brotli |
| Кеш | inline → кеш HTML | `no-store` | content-hash + immutable |
| CDN | — | shared `pub-XXX.r2.dev` | own `cdn.loyalshop.app` |
| Code split | n/a | нет | да, 5 bundle'ов |
| Shared cache между мерчантами | n/a | нет (per-site URL) | да (общий рантайм) |
| Server-side HTML виджетов | да | нет | да |
| Lazy-load тяжёлых | n/a | нет | да (IntersectionObserver) |
| Delayed-load неcritical | n/a | нет | да (setTimeout 15s) |
| Zod в рантайме | n/a | да (~50 KB) | n/a |
| Обфускация | нет | да (stringArray) | нет |

## 5. Важное архитектурное ограничение текущей схемы

URL bundle'а **стабильный**: `sites/{domain}/{token}.js`. Token фиксируется при создании сайта (`SiteScript::generateToken()` = `Str::random(5)`) и **не меняется** при пересборке конфига.

Следствия:
- Контент меняется → URL не меняется → нельзя ставить `Cache-Control: immutable, max-age=31536000`. Юзеры залипнут на старой версии.
- Нельзя расщепить bundle на runtime + config с разными политиками кеша без миграции URL-схемы.
- Брать пример с loyalshop'овского content-hash требует **либо** переустановки тега у всех мерчантов, **либо** хитрого двухуровневого подхода (один stable-tag, второй внутри — c content-hash).

`pub-0e965c30...r2.dev` — это **shared Cloudflare gateway** для R2. На него нельзя повесить Worker / Transform Rules / brotli-auto. Brotli возможен только если мерчант фетчит из домена, принадлежащего нашему DNS-зону (например `cdn.widgetis.com`).

## 6. Дорожная карта оптимизаций

Упорядочено по соотношению эффект/сложность.

### Этап 1 — мгновенные wins (без изменения архитектуры)

| # | Шаг | Где | Эффект | Сложность |
|---|---|---|---|---|
| 1.1 | `async` → `defer` в теге | `SiteScript.php:65` | LCP -2-3s для **новых** установок | 1 строка |
| 1.2 | Добавить `<link rel="preconnect">` к R2 в сниппет | `SiteScript.php:65` | -300-600мс TLS handshake | 2 строки |
| 1.3 | Defer-обёртка внутри bundle (УЖЕ СДЕЛАНО) | `widget-builder/index.ts:188` | Старые установки получают defer-эффект через пересборку | ✅ committed |
| 1.4 | Поправить `Cache-Control` | `ScriptBuilderService.php:115` | `no-store` → `public, max-age=300` | 1 строка |
| 1.5 | Убрать Zod из клиентского bundle | сборка `widget-builder` | -50 KB сырого, -12 KB после brotli | 1-2 часа |
| 1.6 | Отключить `stringArray` в обфускаторе | `widget-builder/index.ts:196` | -30% веса + лучше brotli | 1 строка |

### Этап 2 — Custom domain + Brotli

| # | Шаг | Эффект | Сложность |
|---|---|---|---|
| 2.1 | Поднять `cdn.widgetis.com` через Hetzner CPX11 + Caddy (или R2 custom-domain) | Brotli auto, нормальный кеш | 3-4 часа |
| 2.2 | Cloudflare Free перед origin (orange-cloud) | Edge-кеш по миру, DDoS protection | 30 минут |
| 2.3 | Изменить `R2_PUBLIC_URL` в `.env` | Новые мерчанты на новом домене | 1 минута |
| 2.4 | (опционально) Миграция старых мерчантов | Старые тоже получают brotli | поэтапно через email-рассылку |

**Hetzner-вариант (рекомендация):**

```
┌─────────────────────────────────────────────┐
│  user (anywhere)                            │
└──────────────────┬──────────────────────────┘
                   │ HTTPS
                   ↓
┌─────────────────────────────────────────────┐
│  Cloudflare edge (Free plan, orange-cloud)  │
│  - brotli, cache, TLS, DDoS                 │
└──────────────────┬──────────────────────────┘
                   │ HTTPS (cache miss only)
                   ↓
┌─────────────────────────────────────────────┐
│  Hetzner CPX11 €4.5/мес                     │
│  - Caddy serving /var/www/widgets/          │
│  - Backend uploads via SCP/SFTP             │
└─────────────────────────────────────────────┘
```

### Этап 3 — Two-tier architecture (loyalshop pattern)

Разделить bundle на два слоя:

**Слой A — общий рантайм (один на всех мерчантов):**
- URL: `cdn.widgetis.com/runtime.{contenthash}.js`
- Cache: `public, max-age=31536000, immutable`
- Содержит: код модулей, обвязка, общие утилиты
- Преимущество: **shared cache между всеми мерчантами widgetis**

**Слой B — per-shop конфиг:**
- URL: `cdn.widgetis.com/sites/{domain}/{token}.js`
- Cache: `public, max-age=300`
- Содержит: только `window.__WGTS_CONFIG__ = { modules: {...}, i18n: {...} }`
- Маленький (~5-20 KB)
- При изменении конфига меняется только этот файл, рантайм остаётся

**Тег в Horoshop:**
```html
<link rel="dns-prefetch" href="https://cdn.widgetis.com">
<link rel="preconnect" href="https://cdn.widgetis.com" crossorigin>
<script src="https://cdn.widgetis.com/runtime.HASH.js" defer integrity="sha384-..." crossorigin></script>
<script src="https://cdn.widgetis.com/sites/{domain}/{token}.js" defer></script>
```

Так как тег в Horoshop **двухстрочный со стабильным runtime URL** — при выкатке новой версии рантайма нужно публиковать новый `runtime.{NEW_HASH}.js` и обновлять тег. Это требует либо механики авто-обновления тега (нереалистично), либо stable-tag с алиасом:

**Алиас-схема (более реалистичная):**
```html
<script src="https://cdn.widgetis.com/runtime/v1.js" defer></script>
```
где `runtime/v1.js` — это HTTP 302 → `runtime.{currenthash}.js`. Браузер кеширует редирект коротко (5 мин), а сам hashed-файл — навсегда.

### Этап 4 — Server-side рендер «оболочки» виджета

Сниппет, который копирует мерчант, превращается из чисто-скриптового в **HTML+CSS+JS**:

```html
<!-- WIDGETIS BEGIN -->
<style>
  #wgts-cart-goal { position: fixed; bottom: 74px; ... }
  #wgts-cart-goal .wgts-text { ... }
</style>
<div id="wgts-cart-goal" data-config-url="https://cdn.widgetis.com/sites/benihome/cart-goal.json">
  <span class="wgts-text">До бесплатной доставки осталось <span class="wgts-amount">…</span> грн</span>
</div>
<link rel="preconnect" href="https://cdn.widgetis.com" crossorigin>
<script src="https://cdn.widgetis.com/runtime/v1.js" defer></script>
<!-- WIDGETIS END -->
```

Юзер видит виджет до того, как загрузился JS. CLS = 0. LCP визуально включает виджет (что нам и нужно для метрик).

Самое тяжёлое в реализации:
- Генерация HTML+CSS на этапе `buildModules`
- Каждый widget-module должен экспортировать `getInlineHTML()` и `getInlineCSS()` функции

### Этап 5 — Lazy и delayed-load

Отдельные модули, которые не нужны в первую секунду:
- `requestIdleCallback` для init не-критичных виджетов (social-proof, photo-reviews)
- `IntersectionObserver` для виджетов, появляющихся при скролле
- Уже частично есть в feedback memory: `cart-goal lift with sticky-buy`, `stock-left dot always red` — это вторичная оптимизация, делать после Этапов 1-2.

## 7. Конкретные следующие действия

**Сейчас (1 день):**
- [ ] Этап 1.1: заменить `async` на `defer` в `SiteScript.php:65`
- [ ] Этап 1.2: добавить `<link rel="preconnect">` и `<link rel="dns-prefetch">` в `getScriptTagAttribute`
- [ ] Этап 1.4: `ScriptBuilderService.php:115` — заменить `no-cache, no-store, must-revalidate` на `public, max-age=300`
- [x] Этап 1.3: defer-обёртка в `widget-builder/index.ts` — **сделано** в этом сеансе

**В течение недели:**
- [ ] Этап 1.5: убрать Zod-схемы из импортов рантаймовых модулей
- [ ] Этап 1.6: `obfuscate: { stringArray: false, identifierNamesGenerator: 'mangled' }` или отключить обфускацию совсем (domain-guard остаётся)

**Месяц-два:**
- [ ] Этап 2: Hetzner CPX11 + Caddy + Cloudflare Free → `cdn.widgetis.com`
- [ ] Этап 2.3: миграция `R2_PUBLIC_URL` для новых мерчантов

**Долгосрок:**
- [ ] Этап 3: two-tier архитектура (runtime + config split)
- [ ] Этап 4: server-side HTML snippet генерация

## 8. Ожидаемые метрики после каждого этапа

Прогноз на benihome (Slow 4G, Moto G Power эмуляция):

| После этапа | LCP | Perf Score | Bundle ~size on wire |
|---|---|---|---|
| Текущее состояние | 18.9s | 46 | 941 KB |
| 1.3 (defer wrapper, уже задеплоено после rebuild) | ~15.6s | ~50 | 941 KB (но за пределами LCP-окна) |
| 1.1+1.2+1.4 (defer + preconnect + cache) | ~15.6s | ~50 | 941 KB (повторные визиты — 0 KB) |
| 1.5+1.6 (без Zod, без stringArray) | ~15.6s | ~50 | ~300 KB → ~70 KB после brotli |
| 2 (custom domain + brotli) | ~15.6s | ~50-52 | ~70 KB |
| 3 (two-tier) | ~15.5s | ~52 | per-shop config ~10 KB |
| 4 (server-side HTML) | ~15.4s | ~52-54 | то же |

**LCP практически перестаёт зависеть от виджетов** после Этапа 1, так как defer убирает их из критического пути.

## 8.1 Фактический результат после Этапов 1.5 + 1.6 + page-scoping (2026-05-18)

Замер прод-bundle со всеми 19 модулями включёнными, до запуска через R2:

| Сборка | raw | gzip | brotli |
|---|---|---|---|
| **Без обфускации** (Этап 1.6 — рекомендованная) | **520 KB** | 150 KB | **121 KB** |
| С обфускацией (текущая прод-конфигурация) | 831 KB | 207 KB | 163 KB |

**До оптимизации:** 941 KB raw (без сжатия, обфусцированный) — это исходный размер из аудита benihome.

**Что сделано:**

- **Zod удалён из рантайма** (Этап 1.5). Парсинг конфига перенесён в `widget-builder/index.ts` через build-time `schema.parse(config, i18n)`. В bundle уходит уже отдефолченный JSON. `schema.ts` каждого модуля по-прежнему держит Zod-определения — нужно для JSON-Schema генерации в админ-UI и для `getDefaultConfig` в тестах.
- **`stringArray` уже был выключен** в обфускаторе (`widget-builder/index.ts:202`). Этап 1.6 в части `stringArray=false` оказался noop.
- **Page-scoping** (за пределами роадмапы): новый файл `widget-builder/packages/core/page-type.ts` определяет тип Horoshop-страницы (`home | category | product | cart | checkout | other`) по URL + DOM-фолбэку, результат кешируется в `window.__WIDGETIS_PAGE_TYPE__`. Каждый `module-*/index.ts` экспортирует `export const pages: PageType[]`. `vite-plugin-widgetality` оборачивает init модуля в `if (matchesPage([...]))`. Bundle качается тот же на всех страницах, но **CPU/observer-расходы платятся только за модули, релевантные текущей странице**.

**Распределение модулей по страницам:**

| Page | Модули, активирующиеся здесь |
|---|---|
| product | sticky-buy-button, delivery-date, video-preview, buyer-count, stock-left, photo-video-reviews, trust-badges, one-plus-one, progressive-discount, cart-goal, promo-line, last-chance-popup, spin-the-wheel, prize-banner |
| cart | cart-goal, cart-recommender, minorder-goal, one-plus-one, progressive-discount, promo-auto-apply, phone-mask, promo-line |
| checkout | minorder-goal, sms-otp-checkout, promo-auto-apply, phone-mask |
| home / category | promo-line, cart-goal (за драйвер), last-chance-popup, spin-the-wheel, prize-banner |

**Следующие шаги (Этап 2 и далее) пока не сделаны** — custom domain `cdn.widgetis.com` + brotli + two-tier архитектура.

## 9. Memory / связанные заметки

- См. `feedback_demo_bundle_architecture.md` — demo-bundle = hand-edited JSON → одноразовый обфусцированный билд → site-proxy инжектит inline. Этот документ — про **production**-bundle для мерчантов, не про demo.
- См. `feedback_widget_modules_location.md` — widget code живёт в `widget-builder/modules/module-{name}/`.
- См. `feedback_widget_site_resolution.md` — публичные виджет-endpoints резолвят `site_id` по Origin/Referer header.

---

**Авторы анализа:** assistant + iliya
**Связанные коммиты:** defer-wrapper в `widget-builder/index.ts` (см. git log на `main`)
