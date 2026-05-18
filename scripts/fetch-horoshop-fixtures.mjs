#!/usr/bin/env node
/**
 * Fetch real Horoshop pages and save as HTML fixtures.
 *
 *   node scripts/fetch-horoshop-fixtures.mjs            # default: 30 sites
 *   node scripts/fetch-horoshop-fixtures.mjs --limit=10
 *
 * Output: widget-builder/packages/core/__fixtures__/horoshop/{site}/{type}.html
 * Index:  widget-builder/packages/core/__fixtures__/horoshop/index.json
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SITES_FILE = resolve(ROOT, 'analytics/horoshop-sites/horoshop.txt');
const FIX_DIR = resolve(ROOT, 'widget-builder/packages/core/__fixtures__/horoshop');

const UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' +
  'Version/17.0 Mobile/15E148 Safari/604.1';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)=(.+)$/.exec(a);
    return m ? [m[1], m[2]] : [a.replace(/^--/, ''), 'true'];
  }),
);
const LIMIT = Number(args.limit ?? 30);

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

async function rawFetch(url, cookies = '') {
  const res = await fetch(url, {
    headers: {
      'user-agent': UA,
      accept: 'text/html,application/xhtml+xml',
      'accept-language': 'uk,en;q=0.7',
      ...(cookies ? { cookie: cookies } : {}),
    },
    redirect: 'follow',
  });
  const text = await res.text();
  return { status: res.status, text, url: res.url };
}

/** Detect the Horoshop bot challenge and extract its precomputed hash. */
function extractChallengeHash(html) {
  const m = /defaultHash\s*=\s*"([0-9a-f]{64})"/i.exec(html);
  return m ? m[1] : null;
}

async function fetchPage(domain, path) {
  const url = `https://${domain}${path}`;
  let r = await rawFetch(url);
  if (r.status === 200) {
    const hash = extractChallengeHash(r.text);
    if (hash) {
      r = await rawFetch(url, `challenge_passed=${hash}`);
    }
  }
  return r;
}

function pickFirstMatch(html, re) {
  const m = re.exec(html);
  return m ? m[1] : null;
}

function pickAllMatches(html, re) {
  return [...html.matchAll(re)].map((m) => m[1]);
}

function findHomeLinks(html) {
  const out = {};
  const c = pickFirstMatch(html, /href="(\/[^"#?]*contact[^"]*)"/i);
  if (c) out.contacts = c;
  const a = pickFirstMatch(html, /href="(\/[^"#?]*(about|pro-nas|o-nas)[^"]*)"/i);
  if (a) out.about = a;
  return out;
}

const NON_CATEGORY_PATHS =
  /^\/(ru|en|ua|cart|order|checkout|login|signup|content|contacts?|about|pro-nas|o-nas|blog|news|solutions|brands|comparison|delivery|payment|oplata|dostavka|obmin|povernennya|assets|favicon|robots|sitemap|_widget|ajax)(\/|$)/i;

/**
 * Pull plausible category links straight from the home page navigation:
 * internal slug-style URLs that are not on the obvious "content/utility" list.
 * Returns the first that responds with `og:type=product.group`.
 */
async function findCategoryViaHome(domain, homeHtml) {
  const seen = new Set();
  const candidates = [];
  for (const href of pickAllMatches(homeHtml, /href="(\/[a-z][a-z0-9_-]*\/?)"/gi)) {
    if (NON_CATEGORY_PATHS.test(href)) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    candidates.push(href);
    if (candidates.length >= 12) break;
  }

  for (const path of candidates) {
    const r = await fetchPage(domain, path);
    if (r.status !== 200 || r.text.length < 3000) continue;
    if (extractOgType(r.text) === 'product.group') {
      return { path, html: r.text };
    }
  }
  return null;
}

function extractOgType(html) {
  const m = /<meta\s+property="og:type"\s+content="([^"]+)"/i.exec(html);
  return m ? m[1].toLowerCase() : null;
}

/**
 * Horoshop sitemap layout: `/sitemap.xml` is an index pointing at
 * `catalog-sitemap-NN.xml` shards that mix product + product.group URLs.
 * We walk a few entries and classify by `og:type` after fetching.
 *
 * Returns first product + first category page that we fully retrieved,
 * as { product: { path, html }, category: { path, html } }.
 */
async function findProductAndCategoryViaSitemap(domain) {
  const out = {};
  try {
    const idx = await rawFetch(`https://${domain}/sitemap.xml`);
    if (idx.status !== 200) return out;

    const subMaps = pickAllMatches(idx.text, /<loc>([^<]+)<\/loc>/g).filter((u) =>
      /catalog[-_]sitemap|products?[-_]sitemap|(categor|group)[-_]?sitemap/i.test(u),
    );
    if (subMaps.length === 0) return out;

    const candidates = [];
    for (const m of subMaps.slice(0, 2)) {
      const r = await rawFetch(m);
      if (r.status !== 200) continue;
      const locs = pickAllMatches(r.text, /<loc>([^<]+)<\/loc>/g);
      candidates.push(...locs.slice(0, 6));
      if (candidates.length >= 8) break;
    }

    for (const url of candidates) {
      if (out.product && out.category) break;
      const r = await fetchPage(domain, new URL(url).pathname);
      if (r.status !== 200 || r.text.length < 3000) continue;
      const og = extractOgType(r.text);
      if (og === 'product' && !out.product) {
        out.product = { path: new URL(url).pathname, html: r.text };
      } else if (og === 'product.group' && !out.category) {
        out.category = { path: new URL(url).pathname, html: r.text };
      }
    }
  } catch {
    // ignore — fall through
  }
  return out;
}

async function main() {
  if (!existsSync(SITES_FILE)) {
    console.error(`sites file not found: ${SITES_FILE}`);
    process.exit(1);
  }
  ensureDir(FIX_DIR);

  const sites = readFileSync(SITES_FILE, 'utf-8')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, LIMIT);

  const index = [];
  for (const domain of sites) {
    process.stdout.write(`→ ${domain} ... `);
    try {
      const home = await fetchPage(domain, '/');
      if (home.status !== 200 || home.text.length < 5000) {
        console.log(`skip (home ${home.status} / ${home.text.length}b)`);
        continue;
      }
      const dir = resolve(FIX_DIR, domain);
      ensureDir(dir);
      writeFileSync(resolve(dir, 'home.html'), home.text);

      const homeLinks = findHomeLinks(home.text);
      const sitemapHits = await findProductAndCategoryViaSitemap(domain);
      if (!sitemapHits.category) {
        const cat = await findCategoryViaHome(domain, home.text);
        if (cat) sitemapHits.category = cat;
      }
      const saved = { home: true };

      for (const type of ['product', 'category']) {
        const hit = sitemapHits[type];
        if (!hit) continue;
        writeFileSync(resolve(dir, `${type}.html`), hit.html);
        saved[type] = hit.path;
      }

      for (const type of ['contacts', 'about']) {
        const path = homeLinks[type];
        if (!path) continue;
        const r = await fetchPage(domain, path);
        if (r.status === 200 && r.text.length > 3000) {
          writeFileSync(resolve(dir, `${type}.html`), r.text);
          saved[type] = path;
        }
      }

      // cart and checkout — Horoshop standard paths
      for (const [type, path] of [
        ['cart', '/cart'],
        ['checkout', '/order'],
      ]) {
        const r = await fetchPage(domain, path);
        if (r.status === 200 && r.text.length > 3000) {
          writeFileSync(resolve(dir, `${type}.html`), r.text);
          saved[type] = path;
        }
      }

      index.push({ domain, saved });
      console.log(`ok (${Object.keys(saved).length} pages)`);
    } catch (err) {
      console.log(`error: ${err.message}`);
    }
  }

  writeFileSync(resolve(FIX_DIR, 'index.json'), JSON.stringify(index, null, 2));
  console.log(`\nIndex: ${index.length} sites with ≥1 fixture`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
