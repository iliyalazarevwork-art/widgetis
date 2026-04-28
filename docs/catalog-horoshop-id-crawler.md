# Horoshop ID crawler

`services/catalog-crawler/fetch_platform_ids.py` витягує числовий `horoshop_id` товару зі сторінок Horoshop і записує його в `wgt_catalog_products.horoshop_id`.

Це перенесення старого workflow `scrape:product-ids` з `service-catalog-refactor`, але в `widgetis` він запускається як окремий Python/Playwright tool-контейнер, а не як PHP artisan-команда.

## Що робить скрипт

1. Читає XLSX-експорт Horoshop.
2. Знаходить колонки товару за заголовками:
   - SKU: `артикул`, `article`, `sku`
   - URL/alias: `алиас`, `alias`, `slug`, `url`
3. Відкриває сторінку `https://{domain}/{alias}/` у headless Chromium.
4. Шукає DOM id:

```html
id="j-buy-button-counter-12345"
id="j-buy-button-widget-12345"
```

5. Записує знайдений ID в:

```sql
wgt_catalog_products.horoshop_id
```

Оновлення виконується за парою `site_id + sku`, тому перед crawler треба імпортувати каталог у `wgt_catalog_products`.

## Передумови

1. Dev-контейнери підняті:

```bash
task up
```

2. Каталог сайту вже імпортований:

```bash
task artisan -- catalog:import-xlsx benihome.com.ua /absolute/path/to/catalog.xlsx
```

3. XLSX доступний crawler-контейнеру. У dev compose директорія `.xxx` змонтована як `/data`, тому файл можна покласти в `.xxx/full.xlsx` і передавати як `/data/full.xlsx`.

## Dry-run

Перевірити перші 5 товарів без запису в БД:

```bash
task catalog:fetch-ids:dry
```

Або явно:

```bash
task catalog:fetch-ids -- --domain benihome.com.ua --xlsx /data/full.xlsx --limit 5 --dry-run
```

## Повний запуск

```bash
task catalog:fetch-ids -- --domain benihome.com.ua --xlsx /data/full.xlsx --limit 0 --delay 0.5
```

Корисні опції:

- `--start 100` — почати з 0-based offset.
- `--limit 50` — обробити тільки 50 товарів.
- `--limit 0` — обробити всі товари після `--start`.
- `--delay 1.0` — пауза між сторінками в секундах.
- `--dry-run` — не писати в БД.
- `--db "host=... port=... dbname=... user=... password=..."` — ручний DSN, якщо не підходять `PG_*` env.

## БД і env

За замовчуванням Docker Compose передає crawler такі env:

```env
PG_HOST=postgres
PG_PORT=5432
PG_DATABASE=widgetis
PG_USER=widgetis
PG_PASSWORD=widgetis_secret
```

Можна замінити їх одним `PG_DSN`.

## Результат

В кінці скрипт друкує:

```text
Done. saved=120  not_found=3  not_updated=1  errors=0
```

- `saved` — ID знайдений і записаний, або знайдений у dry-run.
- `not_found` — сторінка відкрилась, але DOM id не знайдений.
- `not_updated` — ID знайдений, але в `wgt_catalog_products` немає рядка з таким `site_id + sku`.
- `errors` — помилки відкриття сторінок або Playwright.

Якщо `not_updated > 0`, зазвичай каталог не імпортований, імпортований не для того site, або SKU у XLSX не збігається з `wgt_catalog_products.sku`.
