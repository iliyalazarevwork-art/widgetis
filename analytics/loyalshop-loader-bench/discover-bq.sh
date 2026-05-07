#!/usr/bin/env bash
# LoyalShop tenant discovery via HTTPArchive BigQuery.
#
# Prerequisites:
#   1. brew install --cask google-cloud-sdk
#      (or: curl https://sdk.cloud.google.com | bash; exec -l $SHELL)
#   2. gcloud auth login
#   3. gcloud auth application-default login
#   4. gcloud config set project YOUR_GCP_PROJECT
#
# Free tier: 1 TB queries/month. This script burns ~50-200 GB.

set -euo pipefail
cd "$(dirname "$0")"
mkdir -p data

OUT=data/httparchive-loyalshop.csv

echo "[1/3] Querying httparchive.crawl.requests for *loyalshop.app* ..."
bq query --use_legacy_sql=false --format=csv --max_rows=100000 \
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
)" > "$OUT"

echo "[1/3] Saved $(wc -l < "$OUT") lines to $OUT"

echo "[2/3] Extracting unique shop-ids ..."
awk -F, 'NR>1 && $2 ~ /^shop-/ {print $2}' "$OUT" | sort -u > data/shop-ids.txt
echo "       → $(wc -l < data/shop-ids.txt) unique shop-ids"

echo "[3/3] Validating + extracting feed_url customer domains ..."
> data/FOUND.csv
echo "shop_id,api_status,size_bytes,customer_domain_from_feed" >> data/FOUND.csv
while read s; do
  resp=$(curl -sS -w '\n%{http_code} %{size_download}' --max-time 10 \
    "https://api.loyalshop.app/public/shop/${s}/config" 2>/dev/null || true)
  body=$(printf '%s' "$resp" | sed '$d')
  meta=$(printf '%s' "$resp" | tail -1)
  code=${meta%% *}
  size=${meta##* }
  if [ "$code" = "200" ]; then
    domain=$(printf '%s' "$body" \
      | python3 -c "import sys,json; d=json.load(sys.stdin); fu=(((d.get('config') or {}).get('smart_search') or {}).get('feed_url') or ''); from urllib.parse import urlparse; print(urlparse(fu).hostname or '')" \
      2>/dev/null || echo "")
  else
    domain=""
  fi
  echo "${s},${code},${size},${domain}" >> data/FOUND.csv
done < data/shop-ids.txt

echo
echo "Done. Live tenants:"
awk -F, '$2=="200"' data/FOUND.csv | wc -l
echo "Total checked:"
tail -n +2 data/FOUND.csv | wc -l
echo
echo "→ See data/FOUND.csv"
