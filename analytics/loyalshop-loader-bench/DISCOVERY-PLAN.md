# LoyalShop — план поиска всех клиентских сайтов

Дата: 2026-05-07

## Контекст

Уже отработаны: CT, Wayback, CommonCrawl CDX, urlscan, HackerTarget, OpenAPI, DDG.
Ясно: **обычные поисковики (Google/Bing/Yandex/DDG) не индексируют URL внутри
`<script src>` — поэтому они бесполезны для нашей задачи.** Нужны сервисы,
которые индексируют именно сырой HTML/JS-исходник.

## Алгоритм (от мощного к запасному)

### A. HTTPArchive в BigQuery — основной канал

HTTPArchive ежемесячно крауzит топ ~15 миллионов сайтов мира и складывает
все request URLs в публичный BigQuery dataset `httparchive`.

**Почему это сработает:** loader.js подгружается на каждый customer-сайт,
запрос виден в `httparchive.requests.*`. Этот источник физически содержит
ровно то, что мы ищем.

**Стоимость:** GCP даёт бесплатно 1 ТБ запросов/месяц. Один такой запрос
~50-200 ГБ = бесплатно.

**SQL (запускать поочерёдно — это разные снапшоты):**

```sql
-- 1. Самый последний полный краул (mobile + desktop) — ИСКЛЮЧЕНИЕ через BigQuery Console
-- проект "httparchive", partition "all" — wildcards стоят дёшево, т.к. partitioned

SELECT DISTINCT
  NET.HOST(page) AS customer_domain,
  REGEXP_EXTRACT(url, r'shop=(shop-[a-z0-9]{6})') AS shop_id,
  client,             -- mobile | desktop
  date
FROM `httparchive.crawl.requests`
WHERE date >= DATE '2025-01-01'
  AND url LIKE '%loyalshop.app%'
ORDER BY date DESC, customer_domain;
```

**Запуск (вариант 1 — bq CLI):**
```bash
gcloud auth application-default login   # один раз
gcloud config set project YOUR_GCP_PROJECT
bq query --use_legacy_sql=false --format=csv \
  "$(cat <<'SQL'
SELECT DISTINCT
  NET.HOST(page) AS customer_domain,
  REGEXP_EXTRACT(url, r'shop=(shop-[a-z0-9]{6})') AS shop_id,
  client,
  date
FROM `httparchive.crawl.requests`
WHERE date >= DATE '2025-01-01'
  AND url LIKE '%loyalshop.app%'
ORDER BY date DESC, customer_domain
SQL
)" > data/httparchive-loyalshop.csv
```

**Запуск (вариант 2 — Console):**
1. Открыть https://console.cloud.google.com/bigquery
2. Project picker → создать или выбрать любой проект
3. Editor → вставить SQL → Run
4. Save results → CSV

**Бэкап-таблицы (если `crawl.requests` не подойдёт):**
```sql
-- старая схема, если новая не работает:
FROM `httparchive.requests.2026_05_01_mobile`
-- или
FROM `httparchive.summary_requests.2026_05_01_mobile`
```

Список доступных таблиц:
```bash
bq ls httparchive:crawl   # покажет requests, pages, response_bodies
bq ls httparchive:requests  # старый layout: 2026_04_01_mobile, и т.п.
```

**Ожидаемый объём:** десятки-сотни уникальных customer_domain. У каждого
shop-id уже извлечён прямо в SQL.

---

### B. PublicWWW — поиск по сырому HTML тысяч сайтов

URL: https://publicwww.com/

**Запросы (вставлять в search-поле как есть):**
```
"cdn.loyalshop.app/prod/loader.js"
"cdn.loyalshop.app"
"api.loyalshop.app"
"loyalshop.app/prod/loader.js"
```

**Бесплатно:** видны первые 3 хита. После регистрации — больше. Платный
доступ ($49/мес) даёт полный экспорт CSV.

**Кейс из жизни:** для маленького SaaS типа LoyalShop в публичной выдаче
обычно 50-500 хитов.

---

### C. NerdyData — альтернатива

URL: https://www.nerdydata.com/search

```
cdn.loyalshop.app
loyalshop.app/prod/loader
```

Free trial 14 дней / 100 results. Часто покрывает то, чего нет в PublicWWW.

---

### D. BuiltWith — технологический профайл

URL: https://trends.builtwith.com/

Поиск: `loyalshop.app` или ввести URL `https://loyalshop.app` →
страница "Sites using LoyalShop" (если технология распознана).

Бесплатно: 50 результатов. Pro $295/мес → полный список.

---

### E. Wappalyzer Lookup

URL: https://www.wappalyzer.com/lookup/

Если LoyalShop добавлен в их catalog (часто — после набора массы
клиентов), там будет страница "Sites using LoyalShop" с экспортом.

---

### F. Wayback Machine — wildcard индекс

Уже пробовали `cdn.loyalshop.app/*`. Дополнительно:
```bash
# Поиск по path вида *loader.js?shop=*
curl -sS "https://web.archive.org/cdx/search/cdx?url=*.loyalshop.app/*&matchType=domain&output=json&fl=original,timestamp&collapse=urlkey&limit=10000"
```

Также — индекс по хостам, которые упоминают loyalshop:
```bash
curl -sS "https://web.archive.org/cdx/search/cdx?url=*.com.ua&filter=original:.*loyalshop\.app.*&matchType=domain&limit=1000"
```
(это будет долго и тяжёлое — Wayback регексп фильтрует пост-фактум.)

---

### G. PhishTank / SecurityTrails / DNSDumpster

Reverse-IP по IP `46.224.128.236` (api+cdn loyalshop):

```bash
curl -sS "https://api.hackertarget.com/reverseiplookup/?q=46.224.128.236"
```

Если LoyalShop арендует один IP — там может оказаться weight их шопов
(но обычно customer-сайты на других IP).

---

### H. Финальный pipeline (для сборки всех найденных кандидатов)

После того как из A-G собраны кандидаты `customer_domains.txt`:

```bash
mkdir -p data/discovery && cd data/discovery

# 1. Объединить всё
cat sources/*.txt | sort -u > customer_domains.txt

# 2. Прокачать через site-proxy (обходит bot-challenge), грепнуть shop-id
# (сервер уже умеет инжектить и кешировать — используем как proxy)
while read domain; do
  html=$(curl -sS --max-time 30 -A 'Mozilla/5.0' "https://$domain/" 2>/dev/null)
  shop_id=$(printf '%s' "$html" | grep -oE 'loader\.js\?shop=shop-[a-z0-9]{6}' | head -1 | grep -oE 'shop-[a-z0-9]{6}')
  echo "$domain,$shop_id"
done < customer_domains.txt > pairs.csv

# 3. Валидация shop-id против API
awk -F, '$2!=""' pairs.csv | while IFS=, read d s; do
  code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 \
    "https://api.loyalshop.app/public/shop/$s/config")
  echo "$d,$s,$code"
done > pairs-validated.csv

# 4. Финал
awk -F, '$3==200' pairs-validated.csv | sort -u > FOUND.csv
wc -l FOUND.csv
```

---

### Что НЕ работает (чтобы не тратить время)

| Источник | Почему бесполезен |
|---|---|
| Google/Bing/Yandex/DDG | Не индексируют `<script src>` |
| GitHub code search | 0 результатов (никто не коммитит loader URL) |
| Common Crawl CDX | Не индексировал cdn.loyalshop.app (мелкий хост) |
| HackerTarget passive DNS | Видит только api/cdn, не subdomains-tenants |
| Брутфорс 6-сим slug | 86 дней при 290 RPS — нереально |

---

## Резюме

**Главное действие:** запустить BigQuery SQL (раздел A). Это даст
максимальный список **за один запрос**, бесплатно, из источника,
который физически содержит то, что мы ищем.

**Параллельно:** PublicWWW (B) и NerdyData (C) — каждый ~5 минут вручную
в браузере, дадут пересекающиеся, но разные подмножества.

**После сбора:** прогнать H-pipeline для извлечения shop-id из HTML
и валидации против API.

Реалистичная оценка финального улова: **100-1000 уникальных пар
(customer_domain, shop_id)**, что закроет вопрос "сколько у LoyalShop
клиентов" с приемлемой точностью.
