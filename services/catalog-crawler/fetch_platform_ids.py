#!/usr/bin/env python3
"""
Fetch Horoshop product IDs from product pages and save them to Widgetis.

This is a Python/Playwright port of the old `scrape:product-ids` workflow
from service-catalog-refactor:
  1. read a Horoshop XLSX export,
  2. open every product page by alias,
  3. extract the numeric ID from j-buy-button-counter/widget DOM IDs,
  4. write it to wgt_catalog_products.horoshop_id by site + SKU.

Usage:
    python fetch_platform_ids.py --domain benihome.com.ua --xlsx /data/full.xlsx
    python fetch_platform_ids.py --domain benihome.com.ua --xlsx /data/full.xlsx --start 100 --limit 50 --dry-run
"""

import argparse
import os
import re
import time
from collections.abc import Sequence

import openpyxl
import psycopg2
from playwright.sync_api import Page, TimeoutError as PlaywrightTimeoutError, sync_playwright

HEADER_SKU_CANDIDATES = ("артикул", "article", "sku")
HEADER_ALIAS_CANDIDATES = ("алиас", "alias", "slug", "url")

RE_PRODUCT_ID = re.compile(r'id=["\']j-buy-button-(?:counter|widget)-(\d+)["\']')


def cell_text(value: object) -> str:
    if value is None:
        return ""

    return str(value).strip()


def normalize_header(value: object) -> str:
    return cell_text(value).lower()


def find_column(headers: Sequence[object], candidates: Sequence[str]) -> int | None:
    normalized_headers = [normalize_header(header) for header in headers]

    for candidate in candidates:
        try:
            return normalized_headers.index(candidate)
        except ValueError:
            continue

    return None


def read_xlsx(path: str) -> list[tuple[str, str]]:
    workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
    sheet = workbook.active

    try:
        rows = list(sheet.iter_rows(values_only=True))
    finally:
        workbook.close()

    if not rows:
        return []

    sku_col = find_column(rows[0], HEADER_SKU_CANDIDATES)
    alias_col = find_column(rows[0], HEADER_ALIAS_CANDIDATES)

    if sku_col is None or alias_col is None:
        raise ValueError(
            "XLSX must contain SKU/article and alias/url columns. "
            f"SKU headers: {', '.join(HEADER_SKU_CANDIDATES)}; "
            f"alias headers: {', '.join(HEADER_ALIAS_CANDIDATES)}"
        )

    products: list[tuple[str, str]] = []
    for row in rows[1:]:
        sku = cell_text(row[sku_col] if sku_col < len(row) else None)
        alias = cell_text(row[alias_col] if alias_col < len(row) else None)

        if sku and alias:
            products.append((sku, alias))

    return products


def build_dsn(args_db: str | None) -> str:
    if args_db:
        return args_db

    dsn = os.environ.get("PG_DSN")
    if dsn:
        return dsn

    return (
        f"host={os.environ.get('PG_HOST', 'localhost')} "
        f"port={os.environ.get('PG_PORT', '5435')} "
        f"dbname={os.environ.get('PG_DATABASE', 'widgetis')} "
        f"user={os.environ.get('PG_USER', 'widgetis')} "
        f"password={os.environ.get('PG_PASSWORD', 'widgetis_secret')}"
    )


def get_site_id(cursor, domain: str) -> str:
    cursor.execute("SELECT id FROM wgt_sites WHERE domain = %s", (domain,))
    row = cursor.fetchone()

    if not row:
        raise ValueError(f"Site not found: {domain}")

    return row[0]


def save_horoshop_id(cursor, site_id: str, sku: str, horoshop_id: int) -> bool:
    cursor.execute(
        "UPDATE wgt_catalog_products SET horoshop_id = %s WHERE site_id = %s AND sku = %s",
        (horoshop_id, site_id, sku),
    )

    return cursor.rowcount > 0


def extract_horoshop_id(html: str) -> int | None:
    match = RE_PRODUCT_ID.search(html)

    return int(match.group(1)) if match else None


def fetch_product_html(page: Page, domain: str, alias: str) -> str:
    url = f"https://{domain}/{alias.strip('/')}/"
    page.goto(url, wait_until="domcontentloaded", timeout=20_000)

    try:
        page.wait_for_function(
            """() => Boolean(
                document.querySelector('[id^="j-buy-button-counter-"]')
                || document.querySelector('[id^="j-buy-button-widget-"]')
            )""",
            timeout=10_000,
        )
    except PlaywrightTimeoutError:
        # Keep the old scraper behaviour: if the marker is not immediately
        # visible, still inspect the loaded HTML before declaring a miss.
        pass

    return page.content()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Fetch Horoshop product IDs and save them to wgt_catalog_products.horoshop_id."
    )
    parser.add_argument("--domain", required=True, help="Site domain from wgt_sites.domain")
    parser.add_argument("--xlsx", required=True, help="Path to a Horoshop XLSX export")
    parser.add_argument("--db", default=None, help="PostgreSQL DSN. Defaults to PG_DSN or PG_* env vars.")
    parser.add_argument("--start", type=int, default=0, help="0-based product offset to start from")
    parser.add_argument("--limit", type=int, default=10, help="How many products to process. 0 means all.")
    parser.add_argument("--delay", type=float, default=0.5, help="Delay between page requests, in seconds")
    parser.add_argument("--dry-run", action="store_true", help="Fetch and print IDs without writing to DB")
    args = parser.parse_args()

    if args.start < 0:
        parser.error("--start must be >= 0")

    if args.limit < 0:
        parser.error("--limit must be >= 0")

    print(f"Reading XLSX: {args.xlsx}")
    products = read_xlsx(args.xlsx)
    print(f"Found {len(products)} products with aliases")

    products = products[args.start:]
    if args.limit > 0:
        products = products[:args.limit]

    print(f"Processing {len(products)} products from offset {args.start}")

    conn = cursor = site_id = None
    if not args.dry_run:
        conn = psycopg2.connect(build_dsn(args.db))
        cursor = conn.cursor()
        site_id = get_site_id(cursor, args.domain)
        print(f"Site ID: {site_id}")

    saved = not_found = failed = not_updated = 0

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
            viewport={"width": 390, "height": 844},
        )
        page = context.new_page()

        for index, (sku, alias) in enumerate(products, 1):
            url = f"https://{args.domain}/{alias.strip('/')}/"
            print(f"[{index}/{len(products)}] {sku} -> {url}", end="  ", flush=True)

            try:
                html = fetch_product_html(page, args.domain, alias)
            except Exception as exc:
                print(f"ERROR: {exc}")
                failed += 1
                if args.delay > 0:
                    time.sleep(args.delay)
                continue

            product_id = extract_horoshop_id(html)

            if product_id is None:
                print("ID not found")
                not_found += 1
                if args.delay > 0:
                    time.sleep(args.delay)
                continue

            print(f"horoshop_id = {product_id}")

            if args.dry_run:
                saved += 1
            elif save_horoshop_id(cursor, site_id, sku, product_id):
                saved += 1
            else:
                print(f"  WARNING: no catalog row updated for sku={sku!r}")
                not_updated += 1

            if args.delay > 0:
                time.sleep(args.delay)

        browser.close()

    if conn is not None:
        conn.commit()
        cursor.close()
        conn.close()

    print(
        "\nDone. "
        f"saved={saved}  not_found={not_found}  not_updated={not_updated}  errors={failed}"
    )

    return 1 if failed > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
