# Discovery: how we found 3 249 Horoshop sites for $0

End-to-end методика, как был собран список всех живых магазинов на платформе **Horoshop** — без платных подписок (BuiltWith, Wappalyzer, Similarweb), используя только публичные API и пару sh-скриптов.

Финальные артефакты лежат в `hr_sites/`:

| Файл | Что внутри |
|---|---|
| `hr_sites/horoshop.csv` | 3 249 доменов с колонками: `domain, opr_pagerank, opr_global_rank, tranco_rank, majestic_rank, is_ua` — отсортированы по убыванию популярности. |
| `hr_sites/horoshop.txt` | те же 3 249 доменов в одну колонку, по убыванию популярности. |

## Зачем это нужно

Список целевых магазинов — это сырьё для outbound-продаж и для тестирования виджетов на реальных сторонах. BuiltWith продаёт похожий список за ≥ $300 (категория Horoshop). Мы получили практически тот же объём бесплатно за ~25 минут работы.

## Шаг 1. Найти fingerprint Horoshop

Любая платформа оставляет в HTML/HTTP узнаваемые следы. Для Horoshop устойчивы три:

1. **Bot-challenge скрипт** — Horoshop отдаёт его всем без `challenge_passed` cookie. Размер ровно 518 байт, JS вида:
   ```js
   (function () {
       const defaultHash = "<64-hex per-site>";
       ...
       document.cookie = "challenge_passed=" + defaultHash + ...;
       location.reload();
   })();
   ```
2. **Стабильный путь к JS-теме**: `/assets/cache/horoshop_default_main.js` — есть на каждом магазине.
3. **Содержимое JS-файла** — либо стаб `/* /vendor/application/deferred-init.js */ ... INIT={stack:[]...}`, либо собранная тема, всегда содержащая строку `horoshop`.

Проверка третьего признака даёт **детерминированный детектор** — один HEAD/GET запрос, ~150 ms.

## Шаг 2. Детектор (один curl, два условия)

`scripts/detect.sh`:

```bash
#!/bin/bash
D="$1"
URL="https://$D/assets/cache/horoshop_default_main.js"
RESP=$(curl -s --max-time 8 -A "Mozilla/5.0 (Macintosh)" \
  -w "\n__HTTP_CODE__%{http_code}\n__CONTENT_TYPE__%{content_type}" "$URL" 2>/dev/null)
CODE=$(echo "$RESP" | grep -oE '__HTTP_CODE__[0-9]+' | tr -dc '0-9')
CT=$(echo   "$RESP" | grep -oE '__CONTENT_TYPE__[^[:space:]]+' | sed 's/__CONTENT_TYPE__//')
BODY=$(echo "$RESP" | sed -E '/__HTTP_CODE__/,$d' | head -c 2000)

[ "$CODE" = "200" ] || exit 0
echo "$CT" | grep -qiE "javascript|ecmascript" || exit 0
echo "$BODY" | head -c 50 | grep -qiE "^<(html|!doctype|script|h1|p>)" && exit 0
echo "$BODY" | grep -qE "deferred-init.js|INIT=\{stack:|horoshop" && echo "$D"
```

Проверки идут лесенкой — каждое следующее правило отсекает класс ложноположительных:

| Правило | Что отсекает |
|---|---|
| `code == 200` | redirects (`mastercard.com` → 301), 404 (`unpkg.com`, `i.ua`) |
| `content-type ⊃ javascript` | HTML error pages, JSON-API |
| `body не начинается с HTML` | сайты, отдающие HTML с MIME `application/javascript` (catch-all SaaS) |
| `body содержит Horoshop-сигнатуру` | случайные совпадения пути |

## Шаг 3. Источник кандидатов: urlscan.io

[urlscan.io](https://urlscan.io) — публичный сервис, который индексирует ресурсы каждого сабмиченного скана. У них есть бесплатный API без регистрации (rate-limited, но щедро для одиночных задач):

```
GET https://urlscan.io/api/v1/search/?q=filename:horoshop_default_main.js&size=100
```

Запрос возвращал `total: 10000` — значит в их индексе ровно столько Horoshop-сайтов. Дальше — пагинация через `search_after` (cursor из `sort` поля последнего результата):

```bash
SEARCH_AFTER=""
while true; do
  RESP=$(curl -s "https://urlscan.io/api/v1/search/?q=filename:horoshop_default_main.js&size=100&search_after=$ENC")
  echo "$RESP" | jq -c '.results[]' >> urlscan_all.jsonl
  HAS_MORE=$(echo "$RESP" | jq '.has_more')
  [ "$HAS_MORE" = "true" ] || break
  SEARCH_AFTER=$(echo "$RESP" | jq -r '[.results[-1].sort[0], .results[-1].sort[1]] | join(",")')
  sleep 1
done
```

Результат: **9 300 записей**, после дедупа по `apexDomain` → **4 579 уникальных доменов**.

## Шаг 4. Верификация

Не каждый домен из urlscan.io ещё жив или всё ещё на Horoshop. Прогоняем все 4 579 через детектор в 80 параллельных потоков:

```bash
cat urlscan_domains_all.txt | xargs -n1 -P80 ./detect.sh > strict_final.txt
```

Время: ~3 минуты. Подтверждено: **3 186 живых сайтов**.

## Шаг 5. Расширение через outlinks-crawl

Магазины часто ссылаются на партнёров/дилеров/дочерние бренды. Проходим по 3 186 уже подтверждённым сайтам, собираем все исходящие ссылки на сторонние домены, отфильтровываем шум (Google, Facebook, Cloudflare, mastercard и т. д.), затем прогоняем через детектор.

Ключевая тонкость: **bot-challenge per-site**. Чтобы получить настоящий HTML магазина, нужно сначала прочитать challenge JS, извлечь его `defaultHash` и переотправить запрос с правильным cookie:

```bash
HASH=$(curl -s "https://$D/" | grep -oE 'defaultHash = "[a-f0-9]+"' \
       | grep -oE '[a-f0-9]{64}')
curl -sL -H "Cookie: challenge_passed=$HASH" "https://$D/"
```

Прирост: **+63 настоящих Horoshop-сайта** → итого **3 249**.

## Шаг 6. Ранжирование по популярности

Глобальные топы (Tranco, Cisco Umbrella, Majestic Million — все три скачиваются как публичный CSV без регистрации) покрыли только 125 сайтов из 3 249 (~4 %). Причина: Horoshop = малый/средний украинский бизнес, в мировые топ-1М попадает только верхушка.

Нужен сигнал, доступный для длинного хвоста. Использовали [Open PageRank](https://www.domcop.com/openpagerank/) — построен на Common Crawl webgraph, **бесплатный API** (1 000 запросов/день, до 100 доменов в одном запросе):

```bash
KEY="<your-opr-api-key>"
split -l 100 horoshop_all_final.txt /tmp/opr_chunk_
for chunk in /tmp/opr_chunk_*; do
  ARGS=""
  while IFS= read -r d; do ARGS="$ARGS&domains%5B%5D=$d"; done < "$chunk"
  curl -s "https://openpagerank.com/api/v1.0/getPageRank?${ARGS:1}" \
    -H "API-OPR: $KEY" >> opr_results.jsonl
done
```

33 батча × 100 доменов = ~30 секунд. Получили `page_rank_decimal` (0..10) и глобальный `rank` для всех 3 249.

## Распределение PageRank

| PageRank | Сайтов | Что это значит |
|---:|---:|---|
| 4-5 | 1 | флагман (`profiline.ua`, ~глобальный топ-100k) |
| 3-4 | 13 | очень популярные магазины |
| 2-3 | 511 | устойчивый трафик |
| 1-2 | 574 | средние |
| 0 | 2 150 | новые/нишевые/неактивные |

## Распределение по TLD

| TLD | Сайтов |
|---:|---:|
| `.ua` (все украинские зоны) | 2 544 |
| `.com` | 365 |
| `.shop` | 83 |
| `.store` | 56 |
| `.md` (Молдова) | 27 |
| `.pl` (Польша) | 19 |
| прочие | ~155 |

## Стоимость и время

| Этап | Время | Стоимость |
|---|---:|---:|
| urlscan.io пагинация (9 300 записей) | ~10 мин | $0 |
| Детектор по 4 579 кандидатам (P=80) | ~3 мин | $0 |
| Outlinks-crawl + повторная верификация | ~10 мин | $0 |
| Open PageRank на 3 249 доменов | ~30 сек | $0 |
| **Итого** | **~25 мин** | **$0** |

## Ограничения

- **urlscan.io покрывает только то, что кто-то когда-то отсканировал.** Реальное число Horoshop-магазинов больше — BuiltWith показывает ~9 253 (на момент написания). Чтобы дотянуть до полного покрытия, нужны более тяжёлые источники:
  - **HTTP Archive on BigQuery** — `LIKE '%horoshop_default%'` по полному HTML топ-15M сайтов. Бесплатно при наличии Google Cloud free tier.
  - **Common Crawl S3** — самый исчерпывающий, но требует разбора многогигабайтных WARC.
- **PageRank 0** для 2 150 сайтов не означает, что они мёртвые — это значит, что у них нет внешних ссылок в Common Crawl webgraph. Многие — здоровые B2B-магазины без публичного маркетинга.
- **Cloudflare-защищённые сайты** иногда отдают 403 на детектор, но они уже были учтены через urlscan.io.

## Воспроизведение

```bash
# 1. Скачать urlscan.io индекс
bash scripts/horoshop/urlscan_paginate.sh

# 2. Извлечь уникальные apex-домены
jq -r '.task.apexDomain' scan/urlscan_all.jsonl | sort -u > scan/candidates.txt

# 3. Прогнать детектор
cat scan/candidates.txt | xargs -n1 -P80 scripts/horoshop/detect.sh > scan/verified.txt

# 4. (Опционально) расширить через outlinks
cat scan/verified.txt | xargs -n1 -P80 scripts/horoshop/crawl_outlinks.sh \
  | sort -u | comm -23 - <(sort scan/verified.txt) \
  | xargs -n1 -P80 scripts/horoshop/detect.sh >> scan/verified.txt

# 5. Получить PageRank
export OPR_KEY="..."
bash scripts/horoshop/opr_fetch.sh

# 6. Финальный CSV
python3 scripts/horoshop/build_csv.py > hr_sites/horoshop.csv
```

(Скрипты в репозитории не сохранены — они одноразовые. Полный текст команд приведён в этом документе.)

## Ссылки

- urlscan.io: https://urlscan.io
- Tranco: https://tranco-list.eu/
- Cisco Umbrella top-1M: https://s3-us-west-1.amazonaws.com/umbrella-static/top-1m.csv.zip
- Majestic Million: https://downloads.majestic.com/majestic_million.csv
- Open PageRank: https://www.domcop.com/openpagerank/
- HTTP Archive (для возможного расширения): https://httparchive.org/faq#how-do-i-use-bigquery-to-write-custom-queries-over-the-data
