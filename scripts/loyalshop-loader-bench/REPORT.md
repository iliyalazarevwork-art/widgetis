# LoyalShop — разведка публичной поверхности

Дата: 2026-05-01

## Цель

Оценить, можно ли получить список всех `shop-XXXXXX` идентификаторов LoyalShop
из публичных источников, и замерить throughput для перебора, если он понадобится.

## Известные точки входа

```
https://cdn.loyalshop.app/prod/loader.js?shop=shop-XXXXXX&api=https://api.loyalshop.app
```

`loader.js` — generic-загрузчик, **байт-в-байт идентичен** для любого `shop=...`
(md5 совпадает). Сам по себе ничего о существовании магазина не говорит.

Реальная проверка валидности идёт на API:

```
GET https://api.loyalshop.app/public/shop/{slug}/config
  200 + variable body (3–16 KB)  → tenant существует
  404 + 27 байт {"detail":"Not Found"} → не существует
```

Чистый дискриминатор по статус-коду.

## Throughput-замеры

Бенч `bench.mjs` бьёт по правильному эндпоинту со случайными 6-сим [a-z0-9] суффиксами.

| Concurrency | RPS | p50    | p95    | p99    | Errors | WAF |
|------------:|----:|-------:|-------:|-------:|-------:|----:|
|           5 |  88 |  55ms  |  67ms  | 123ms  | 0      | 0   |
|          10 | 156 |  63ms  |  84ms  | 164ms  | 0      | 0   |
|          25 | 270 |  85ms  | 182ms  | 223ms  | 0      | 0   |
|          50 | 272 | 164ms  | 319ms  | 423ms  | 0      | 0   |
|         100 | 262 | 375ms  | 503ms  | 530ms  | 0      | 0   |
|         200 | 294 | 642ms  | 807ms  | 848ms  | 0      | 0   |
|         400 | 282 |1389ms  |1592ms  |1636ms  | 0      | 0   |

**Потолок ≈ 270–290 RPS.** Дальше concurrency только растит latency —
упирается в backend (серверная сериализация), не в канал и не в WAF.
Cloudflare/rate-limit за всё время бенчмарка ни разу не сработал.

ETA полного перебора при 290 RPS:

| Алфавит    | Длина | Комбинаций  | ETA           |
|------------|------:|------------:|---------------|
| `[a-z0-9]` |  4    |       1.68M | **~95 минут** |
| `[a-z0-9]` |  5    |        60M  | **~57 часов** |
| `[a-z0-9]` |  6    |       2.17B | **~86 дней**  |

Все известные slug'и — 6 символов, поэтому слепой брутфорс нереалистичен.

## Источники, которые проверял

Сводка с резюме:

| Источник | Метод | shop-id | Полезность |
|---|---|---|---|
| **OpenAPI** | `GET api.loyalshop.app/openapi.json` (166 KB, 168 эндпоинтов) | 0 | Listing `GET /admin/tenants` существует, но 🔒 за авторизацией |
| **Certificate Transparency — crt.sh** | `?q=%25.loyalshop.app&output=json` | 10 | Wildcard `*.loyalshop.app` — большинство shops не попадает |
| **Certificate Transparency — certspotter** | `/v1/issuances?domain=loyalshop.app&include_subdomains=true` | 10 (тот же набор) | то же самое |
| **HackerTarget passive DNS** | `/hostsearch/?q=loyalshop.app` | 0 | Только `api`, `cdn` |
| **urlscan.io** | `/api/v1/search/?q=domain:cdn.loyalshop.app` | 1 | Индексирует только сабмиченное |
| **Wayback Machine CDX** | `cdn.loyalshop.app/*` | 1 (`xwdikx`) | Почти пусто |
| **Common Crawl** | 5 индексов (CC-MAIN-2025/2026) | 0 | Не индексировал loyalshop |
| **DuckDuckGo HTML** | `q="cdn.loyalshop.app/prod/loader.js"` | 0 | Заблокирован без POST/токена |
| **`/public/branding`** | публичный | 0 | Только favicon/лого |
| **`/public/shop/{slug}/config`** | tenant API | — | Внутри только `slug`, `tenant_slug`, `api_base`, `scripts` — customer-домена нет |
| **`hr_sites/analysis/data/*.json`** | локальные данные по 74 Horoshop-сайтам | 0 | Файлы зафиксировали факт `loyalshop.app`, но shop-id не извлекали |
| **www.loyalshop.app landing** | `GET https://www.loyalshop.app/` | 0 | Внешних ссылок только `clarity.ms` (аналитика) |
| **`project-money.loyalshop.app`** | подсмотрено в CT | — | Таймаут / 301 / 404 — не публичный |
| **Поиск кейс-стадий клиентов на лэндинге** | `grep -oE 'https?://...' /tmp/www.html` | 0 | На лендинге нет блока «наши клиенты» с кликабельными доменами |

### Дословные команды (для воспроизводимости)

#### 1. CDN/loader — проверка, что он generic

```bash
curl -sS "https://cdn.loyalshop.app/prod/loader.js?shop=shop-32codo&api=https://api.loyalshop.app" -o /tmp/real.js
curl -sS "https://cdn.loyalshop.app/prod/loader.js?shop=shop-aaaaaa&api=https://api.loyalshop.app" -o /tmp/fake.js
md5 -q /tmp/real.js /tmp/fake.js   # совпадают → loader.js не зависит от shop
```

#### 2. OpenAPI

```bash
curl -sS "https://api.loyalshop.app/openapi.json" -o data/openapi.json
# 166142 байт, 168 paths
# Извлечение всех эндпоинтов:
node -e 'const s=require("./data/openapi.json"); for(const [p,m] of Object.entries(s.paths)) for(const [mm,op] of Object.entries(m)) if(typeof op==="object") console.log(`${(op.security?"🔒":"🌐")} ${mm.toUpperCase()} ${p}`);'
```

Найденный listing-эндпоинт `GET /admin/tenants` — закрыт за `bearerAuth`.

#### 3. Certificate Transparency

```bash
# crt.sh
curl -sS "https://crt.sh/?q=%25.loyalshop.app&output=json" -o /tmp/crt.json

# certspotter
curl -sS "https://api.certspotter.com/v1/issuances?domain=loyalshop.app&include_subdomains=true&expand=dns_names" -o /tmp/cs.json
```

Оба независимых источника вернули один и тот же набор:
```
shop-32codo, shop-3ghewz, shop-4pwwhb, shop-73plhd, shop-8dnvt0,
shop-9b55ns, shop-c4tqvd, shop-ekspab, shop-j0757m, shop-wmu4m9
```

И прочие subdomain'ы: `api-dev`, `api-staging`, `api`, `cdn`, `dev`, `project-money`, `staging`, `www`.

#### 4. Passive DNS — HackerTarget

```bash
curl -sS "https://api.hackertarget.com/hostsearch/?q=loyalshop.app"
```

Вернул только `api.loyalshop.app, 46.224.128.236` и `cdn.loyalshop.app, 46.224.128.236`.

#### 5. urlscan.io

```bash
curl -sS "https://urlscan.io/api/v1/search/?q=domain:cdn.loyalshop.app&size=10000" -o /tmp/us.json
```

Total hits: 2 (только `safeyourlove.com`).

#### 6. Wayback Machine — CDX API

```bash
# Вход 1: что кэшировал Wayback на самом домене
curl -sS "https://web.archive.org/cdx/search/cdx?url=loyalshop.app&matchType=domain&output=json&fl=original&collapse=urlkey&limit=300"

# Вход 2: что кэшировал Wayback по cdn.loyalshop.app/*
curl -sS "https://web.archive.org/cdx/search/cdx?url=cdn.loyalshop.app/*&matchType=prefix&output=json&fl=original,timestamp&collapse=urlkey&limit=2000"
```

14 строк суммарно, единственный shop-id в URL: `xwdikx`.

#### 7. Common Crawl — CDX-index по 5 коллекциям

```bash
for idx in CC-MAIN-2026-17 CC-MAIN-2026-12 CC-MAIN-2026-08 CC-MAIN-2025-43 CC-MAIN-2025-30; do
  curl -sS "https://index.commoncrawl.org/${idx}-index?url=cdn.loyalshop.app/*&output=json&limit=500"
  curl -sS "https://index.commoncrawl.org/${idx}-index?url=loyalshop.app&matchType=domain&output=json&limit=200"
done
```

Все ответы: `{"message": "No Captures found for: cdn.loyalshop.app/"}` или 0 строк.

#### 8. DuckDuckGo HTML

```bash
curl -sS -A 'Mozilla/5.0' \
  'https://html.duckduckgo.com/html/?q=%22cdn.loyalshop.app%2Fprod%2Floader.js%22'
```

Страница пришла, но результатов в DOM нет — DDG требует POST с токеном при запросе из не-браузера.

#### 9. Публичные эндпоинты на api.loyalshop.app

Перебранные пути (все возвращали 404 кроме отмеченных):
```
/public/shops          /public/shops/        /public/shop          /public/shop/
/public/shops/list     /public/shop/list     /api/public/shops     /api/public/shop
/api/public/shops/list /shops                /shop/list            /v1/shops
/api/v1/shops          /public               /api/public           /api
/docs                  /openapi.json   ← 200 (166 KB)
/swagger               /redoc                /api/docs
/healthz               /health         ← (см. OpenAPI)
/robots.txt            /sitemap.xml          /sitemap_index.xml
/public/shops?limit=1  /public/shops?page=1  /public/shop?limit=1
/public/sites          /public/site          /public/merchants     /public/stores
/public/branding ← 200 (только лого/фавикон)
```

#### 10. Inspect живого config

```bash
curl -sS "https://api.loyalshop.app/public/shop/shop-32codo/config" | jq 'keys'
# ["scripts","config","slug","tenant_slug","api_base","api_url","default_lang"]
```

Customer-домена внутри нет — только `slug`/`tenant_slug` (одинаковые).

#### 11. Локальные данные `hr_sites/`

```bash
grep -hoE 'shop-[a-z0-9]{4,10}|loyalshop\.app[a-z0-9?=&/_.-]*' \
  /Users/iliya/.../hr_sites/analysis/data/*.json | sort -u
# → "loyalshop.app", "shop-home"  (полезных shop-id нет)
```

Только 2 из 74 файлов вообще упоминают loyalshop (`04-bioroza.com.ua_ua.json`,
`07-shop.aquamyrgorod.com.ua.json`), и без сохранённых shop-id —
анализатор фиксировал только присутствие хоста.

#### 12. Валидация всех собранных id

```bash
for s in emdukt 32codo xwdikx 3ghewz 4pwwhb 73plhd 8dnvt0 9b55ns c4tqvd ekspab j0757m wmu4m9; do
  curl -sS -o /dev/null -w "%{http_code} %{size_download}  shop-${s}\n" \
    "https://api.loyalshop.app/public/shop/shop-${s}/config"
done
```

Результат (первичная проверка 2026-05-01):
```
200 10024  shop-emdukt    ← живой
200  9410  shop-32codo    ← живой
200 15698  shop-xwdikx    ← живой
200  3440  shop-3ghewz    ← живой
404    27  shop-4pwwhb    ← удалён
404    27  shop-73plhd    ← удалён
404    27  shop-8dnvt0    ← удалён
404    27  shop-9b55ns    ← удалён
404    27  shop-c4tqvd    ← удалён
404    27  shop-ekspab    ← удалён
404    27  shop-j0757m    ← удалён
200  9248  shop-wmu4m9    ← живой
```

Повторная проверка **2026-05-07** — статусы не изменились, размеры ответов немного выросли:
```
200 10192  shop-emdukt    ← живой
200  9502  shop-32codo    ← живой
200 15986  shop-xwdikx    ← живой
200  3440  shop-3ghewz    ← живой
404    27  shop-4pwwhb    ← удалён
404    27  shop-73plhd    ← удалён
404    27  shop-8dnvt0    ← удалён
404    27  shop-9b55ns    ← удалён
404    27  shop-c4tqvd    ← удалён
404    27  shop-ekspab    ← удалён
404    27  shop-j0757m    ← удалён
200  9316  shop-wmu4m9    ← живой
```

## Подтверждённые валидные shop-id

```
shop-emdukt    config 200, 10192 B    ← bioroza.com.ua          (от пользователя)
shop-32codo    config 200,  9502 B    ← raptor-ua.com           (от пользователя)
shop-xwdikx    config 200, 15986 B    ← safeyourlove.com        (от пользователя + urlscan + wayback)
shop-3ghewz    config 200,  3440 B    ← snackup.com.ua          (subdomain → redirect)
shop-wmu4m9    config 200,  9316 B    ← bag24.com.ua            (subdomain → redirect)
```

## «Удалённые» shop-id из CT (404 на API, subdomain жив — редиректит на Horoshop-дефолт)

| shop-id | customer-домен | примечание |
|---|---|---|
| shop-4pwwhb | shop.aquamyrgorod.com.ua | API 404, subdomain жив |
| shop-73plhd | zaichyk.com.ua | API 404, subdomain жив |
| shop-8dnvt0 | shop.aquamyrgorod.com.ua | API 404, subdomain жив |
| shop-9b55ns | safeyourlove.com | API 404, subdomain жив |
| shop-c4tqvd | safeyourlove.com | API 404, subdomain жив |
| shop-ekspab | shop.aquamyrgorod.com.ua | API 404, subdomain жив |
| shop-j0757m | safeyourlove.com | API 404, subdomain жив |

`shop.aquamyrgorod.com.ua` имел минимум 3 разных shop-id — вероятно пересоздавали тенант при онбординге.

## Структура slug

- Префикс `shop-` фиксированный.
- Тело: 6 символов из `[a-z0-9]`.
- Случайное распределение, нет видимой инкрементальности или паттерна.
- Тождественно nanoid-стилю с алфавитом `0123456789abcdefghijklmnopqrstuvwxyz`.

## Вывод

**Полного публичного списка не существует.** Listing `/admin/tenants` закрыт
за auth. Wildcard-сертификат скрывает большинство tenant'ов от CT.

Из публичных источников выжали **5 живых + 7 удалённых = 12 уникальных shop-id**.
По оценке (SaaS-бонусная платформа, активные клиенты в ua/ru e-commerce) —
реальное число tenant'ов скорее всего **сотни**, но это только косвенная оценка.

## Что осталось как опции (не выполнялось)

| Подход | Ожидаемая ценность | Стоимость |
|---|---|---|
| Прогон 74 Horoshop-сайтов (`hr_sites/`) с обходом bot-challenge → `loader.js?shop=…` в HTML | 5–20 пар site→shop-id | 5 мин |
| PublicWWW / BuiltWith поиск по `cdn.loyalshop.app/prod/loader.js` | 50–500 customer-сайтов | бесплатный аккаунт |
| Брутфорс 4-символьных id | вероятно 0 (slug всегда 6 символов) | ~95 мин, ~1.7M запросов |
| Брутфорс 6 символов | 5K–50K shops | **86 дней** — нереально |
| `GET /admin/tenants` с админ-токеном | весь список разом | 1 запрос (нужен доступ) |

## Артефакты

- `bench.mjs` — concurrency-бенч с автодетектом WAF.
- `data/openapi.json` — полная спецификация API (166 KB, 168 paths).
- `package.json` — `npm run bench:sweep` для повторного замера.
