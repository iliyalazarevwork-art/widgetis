#!/usr/bin/env python3
"""
fetch_platform_ids.py

Reads an XLSX catalog export (Horoshop format), fetches each product page,
extracts the Horoshop platform product ID from the HTML, and saves it to
wgt_catalog_products.platform_id in PostgreSQL.

Usage:
    python fetch_platform_ids.py --domain benihome.com.ua --xlsx /path/to/catalog.xlsx

Options:
    --domain    Site domain (must exist in wgt_sites.domain)
    --xlsx      Path to Horoshop XLSX catalog export
    --db        PostgreSQL DSN (default: from env PG_DSN or built from PG_* vars)
    --delay     Seconds between requests (default: 0.5)
    --limit     Process only first N products (for testing)
    --dry-run   Fetch and print IDs without writing to DB
"""

import argparse
import os
import re
import sys
import time
import gzip
import zlib
from http.client import HTTPSConnection, HTTPConnection
from urllib.parse import urlparse

import openpyxl
import psycopg2

# ── Constants ────────────────────────────────────────────────────────────────

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

# Column indices in Horoshop XLSX export (0-based)
COL_SKU   = 0   # Артикул
COL_ALIAS = 7   # Алиас

# Regex to extract Horoshop product ID from page HTML
RE_PRODUCT_ID = re.compile(r'id="j-buy-button-(?:counter|widget)-(\d+)"')

# Regex to detect the bot challenge page
RE_CHALLENGE  = re.compile(r'defaultHash\s*=\s*"([0-9a-f]+)"')


# ── HTTP helpers ─────────────────────────────────────────────────────────────

def _decompress(data: bytes, encoding: str | None) -> bytes:
    if encoding == "gzip":
        return gzip.decompress(data)
    if encoding == "deflate":
        return zlib.decompress(data)
    return data


def fetch_html(url: str, cookies: dict[str, str], max_redirects: int = 6) -> tuple[str, dict[str, str]]:
    """
    Fetch URL and return (html_text, updated_cookies).
    Follows redirects. Decompresses gzip/deflate.
    """
    for _ in range(max_redirects):
        parsed = urlparse(url)
        is_https = parsed.scheme == "https"
        host = parsed.hostname or ""
        port = parsed.port or (443 if is_https else 80)
        path = (parsed.path or "/") + (("?" + parsed.query) if parsed.query else "")

        cookie_str = "; ".join(f"{k}={v}" for k, v in cookies.items())

        headers = {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,*/*;q=0.9",
            "Accept-Encoding": "gzip, deflate",
            "Accept-Language": "uk,ru;q=0.9,en;q=0.8",
        }
        if cookie_str:
            headers["Cookie"] = cookie_str

        Conn = HTTPSConnection if is_https else HTTPConnection
        conn = Conn(host, port, timeout=15)
        try:
            conn.request("GET", path, headers=headers)
            resp = conn.getresponse()
            raw = resp.read()
        finally:
            conn.close()

        # Collect Set-Cookie headers
        for name, value in resp.getheaders():
            if name.lower() == "set-cookie":
                m = re.match(r"^([^=]+)=([^;]*)", value)
                if m:
                    cookies[m.group(1)] = m.group(2)

        # Follow redirects
        if resp.status in (301, 302, 303, 307, 308):
            location = resp.getheader("Location", "")
            if location.startswith("/"):
                location = f"{parsed.scheme}://{host}{location}"
            url = location
            continue

        encoding = resp.getheader("Content-Encoding")
        try:
            data = _decompress(raw, encoding)
        except Exception:
            data = raw

        return data.decode("utf-8", errors="replace"), cookies

    raise RuntimeError(f"Too many redirects for {url}")


def fetch_product_page(domain: str, alias: str, cookies: dict[str, str]) -> tuple[str, dict[str, str]]:
    """
    Fetch product page, handle Horoshop bot challenge, return (html, cookies).
    """
    url = f"https://{domain}/{alias.strip('/')}/"
    html, cookies = fetch_html(url, cookies)

    # Detect challenge page and retry
    m = RE_CHALLENGE.search(html)
    if m and "location.reload" in html:
        cookies["challenge_passed"] = m.group(1)
        print(f"  [challenge] solved for {domain}, retrying…")
        html, cookies = fetch_html(url, cookies)

    return html, cookies


def extract_product_id(html: str) -> int | None:
    m = RE_PRODUCT_ID.search(html)
    return int(m.group(1)) if m else None


# ── XLSX reader ──────────────────────────────────────────────────────────────

def read_xlsx(path: str) -> list[tuple[str, str]]:
    """
    Returns list of (sku, alias) pairs from the XLSX, skipping header and blank aliases.
    """
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(min_row=2, values_only=True))
    wb.close()

    result = []
    for row in rows:
        sku   = str(row[COL_SKU]).strip()   if row[COL_SKU]   is not None else ""
        alias = str(row[COL_ALIAS]).strip() if row[COL_ALIAS] is not None else ""
        if sku and alias:
            result.append((sku, alias))

    return result


# ── Database ─────────────────────────────────────────────────────────────────

def build_dsn(args_db: str | None) -> str:
    if args_db:
        return args_db
    dsn = os.environ.get("PG_DSN")
    if dsn:
        return dsn
    host     = os.environ.get("PG_HOST",     "localhost")
    port     = os.environ.get("PG_PORT",     "5435")
    dbname   = os.environ.get("PG_DATABASE", "widgetis")
    user     = os.environ.get("PG_USER",     "widgetis")
    password = os.environ.get("PG_PASSWORD", "widgetis_secret")
    return f"host={host} port={port} dbname={dbname} user={user} password={password}"


def get_site_id(cur, domain: str) -> str:
    cur.execute("SELECT id FROM wgt_sites WHERE domain = %s", (domain,))
    row = cur.fetchone()
    if not row:
        raise ValueError(f"Site not found in wgt_sites: {domain}")
    return row[0]


def save_platform_id(cur, site_id: str, sku: str, platform_id: int) -> bool:
    cur.execute(
        "UPDATE wgt_catalog_products SET platform_id = %s WHERE site_id = %s AND sku = %s",
        (platform_id, site_id, sku),
    )
    return cur.rowcount > 0


# ── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch Horoshop platform_id for catalog products.")
    parser.add_argument("--domain", required=True, help="Site domain, e.g. benihome.com.ua")
    parser.add_argument("--xlsx",   required=True, help="Path to Horoshop XLSX export")
    parser.add_argument("--db",     default=None,  help="PostgreSQL DSN string")
    parser.add_argument("--delay",  type=float, default=0.5, help="Delay between requests (sec)")
    parser.add_argument("--limit",  type=int,   default=None, help="Max products to process")
    parser.add_argument("--dry-run", action="store_true", help="Print IDs without saving to DB")
    args = parser.parse_args()

    print(f"Reading XLSX: {args.xlsx}")
    products = read_xlsx(args.xlsx)
    print(f"Found {len(products)} products with aliases")

    if args.limit:
        products = products[:args.limit]
        print(f"Limited to {len(products)} products")

    conn = cur = site_id = None
    if not args.dry_run:
        dsn = build_dsn(args.db)
        conn = psycopg2.connect(dsn)
        cur  = conn.cursor()
        site_id = get_site_id(cur, args.domain)
        print(f"Site ID: {site_id}")

    cookies: dict[str, str] = {}
    ok = skip = fail = 0

    for i, (sku, alias) in enumerate(products, 1):
        print(f"[{i}/{len(products)}] {sku} → /{alias}/", end="  ", flush=True)

        try:
            html, cookies = fetch_product_page(args.domain, alias, cookies)
            pid = extract_product_id(html)
        except Exception as e:
            print(f"ERROR: {e}")
            fail += 1
            time.sleep(args.delay)
            continue

        if pid is None:
            print("ID not found in HTML")
            skip += 1
        else:
            print(f"platform_id = {pid}")
            if not args.dry_run:
                saved = save_platform_id(cur, site_id, sku, pid)
                if not saved:
                    print(f"  WARNING: no row updated for sku={sku!r}")
            ok += 1

        if args.delay > 0:
            time.sleep(args.delay)

    if conn:
        conn.commit()
        cur.close()
        conn.close()

    print(f"\nDone. saved={ok}  not_found={skip}  errors={fail}")


if __name__ == "__main__":
    main()
