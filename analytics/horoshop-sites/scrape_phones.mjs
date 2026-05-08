#!/usr/bin/env node
// Scrape phone numbers from a list of Horoshop (and similar) sites.
// Usage: node scrape_phones.mjs <input.txt> <output.csv> [limit] [concurrency]
//
// Strategy:
//   1. Fetch home page (with Horoshop bot-challenge bypass).
//   2. Extract phones from a wide set of patterns: tel: hrefs, data-fake-href,
//      JSON-LD "telephone", data-phone, itemprop="telephone", og:phone_number,
//      and plain-text +38 / 0XX number forms.
//   3. If the home page yielded nothing, retry with a `www.` prefix
//      (some sites only serve the real page on the www subdomain).
//   4. Discover contact-page links from the HTML (any anchor whose href or
//      visible text matches contact / kontak / контакт / contacts), plus a
//      fallback list of common paths, and try them in order until phones found.
//   5. Filter Horoshop's "0999999999" demo placeholder.

import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';

const [, , inputPath, outputPath, limitArg, concArg] = process.argv;
if (!inputPath || !outputPath) {
  console.error('Usage: scrape_phones.mjs <input.txt> <output.csv> [limit] [concurrency]');
  process.exit(1);
}

const LIMIT = limitArg ? parseInt(limitArg, 10) : Infinity;
const CONCURRENCY = concArg ? parseInt(concArg, 10) : 15;
const TIMEOUT_MS = 25_000;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36';

const FALLBACK_PATHS = [
  '/contacts/', '/contacts',
  '/kontakty/', '/kontakty',
  '/kontakti/', '/kontakti',
  '/kontakt/', '/kontakt',
  '/contact/', '/contact',
  '/contact-us/', '/contact-us',
  '/kontaktna-informatsiya/',
  '/kontakte/', '/kontakte',
  '/about/contacts/', '/about-us/contacts/',
];

const domains = readFileSync(inputPath, 'utf8')
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean)
  .slice(0, LIMIT);

writeFileSync(outputPath, 'domain,phones,status\n');

async function fetchHtml(url, cookie = '') {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'uk,en;q=0.9,ru;q=0.8',
        ...(cookie ? { Cookie: cookie } : {}),
      },
      redirect: 'follow',
      signal: ctrl.signal,
    });
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function extractChallengeHash(html) {
  const m = html.match(/defaultHash\s*=\s*"([a-f0-9]{32,128})"/);
  return m ? m[1] : null;
}

async function fetchPageWithChallenge(url) {
  let html = await fetchHtml(url);
  if (html.length < 2000 && html.includes('challenge_passed')) {
    const hash = extractChallengeHash(html);
    if (hash) html = await fetchHtml(url, `challenge_passed=${hash}`);
  }
  return html;
}

function normalize(raw) {
  let decoded = raw;
  try { decoded = decodeURIComponent(raw); } catch { /* keep raw */ }
  const d = decoded.replace(/[^\d]/g, '');
  if (!d) return null;
  // Ukrainian normalization
  if (d.length === 12 && d.startsWith('380')) return '+' + d;
  if (d.length === 11 && d.startsWith('80') && d[2] === '0') return '+3' + d;
  if (d.length === 10 && d.startsWith('0')) return '+38' + d;
  if (d.length === 9) return '+380' + d;
  // Other countries (Moldova +373, Poland +48, etc.) — keep as-is with leading +
  if (d.length >= 10 && d.length <= 15) return '+' + d;
  return null;
}

function extractPhones(html) {
  const raw = new Set();
  // tel: hrefs (Horoshop primary + generic fallback)
  for (const m of html.matchAll(/data-fake-href="tel:([^"]+)"/g)) raw.add(m[1]);
  for (const m of html.matchAll(/href="tel:([^"]+)"/g)) raw.add(m[1]);
  // schema.org / JSON-LD telephone
  for (const m of html.matchAll(/"telephone"\s*:\s*"([^"]+)"/g)) raw.add(m[1]);
  // data-phone, itemprop="telephone"
  for (const m of html.matchAll(/data-phone="([^"]+)"/g)) raw.add(m[1]);
  for (const m of html.matchAll(/itemprop="telephone"[^>]*>\s*([^<]+)</g)) raw.add(m[1]);
  // og:phone_number
  for (const m of html.matchAll(/property="og:phone_number"\s+content="([^"]+)"/g)) raw.add(m[1]);
  // Plain-text patterns
  for (const m of html.matchAll(/\+\s*38[\s(]*0?\d{2}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/g)) raw.add(m[0]);
  for (const m of html.matchAll(/\b0\d{2}[\s.-]\d{3}[\s.-]\d{2}[\s.-]\d{2}\b/g)) raw.add(m[0]);

  const phones = new Set();
  for (const r of raw) {
    const n = normalize(r);
    if (n) phones.add(n);
  }
  // Filter Horoshop demo placeholder and obvious shorts.
  return [...phones].filter((p) => !p.endsWith('0999999999') && p.length >= 11);
}

function discoverContactPaths(html, domain) {
  const found = new Set();
  // Anchors whose href OR inner text references contacts in en/uk/ru.
  const re = /<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]{0,120}?)<\/a>/gi;
  for (const m of html.matchAll(re)) {
    const href = m[1];
    const text = m[2];
    const haystack = (href + ' ' + text).toLowerCase();
    if (!/(contact|kontak|kontakt|контакт|зв.?я.?з)/i.test(haystack)) continue;
    let url;
    try {
      url = new URL(href, `https://${domain}/`);
    } catch { continue; }
    if (url.hostname !== domain && url.hostname !== `www.${domain}`) continue;
    if (!/^https?:$/.test(url.protocol)) continue;
    found.add(url.pathname + (url.search || ''));
  }
  return [...found];
}

async function tryPaths(domain, paths, seen) {
  for (const path of paths) {
    if (seen.has(path)) continue;
    seen.add(path);
    try {
      const html = await fetchPageWithChallenge(`https://${domain}${path}`);
      if (!html || html.length < 1500) continue;
      const phones = extractPhones(html);
      if (phones.length) return { phones, html, path };
    } catch { /* try next */ }
  }
  return null;
}

async function processDomain(domain) {
  try {
    let html = await fetchPageWithChallenge(`https://${domain}/`);
    let phones = extractPhones(html);
    let where = 'home';

    // Some sites only respond on www.
    if (phones.length === 0 && !domain.startsWith('www.')) {
      try {
        const wwwHtml = await fetchPageWithChallenge(`https://www.${domain}/`);
        if (wwwHtml && wwwHtml.length > html.length) {
          html = wwwHtml;
          phones = extractPhones(html);
          if (phones.length) where = 'home:www';
        }
      } catch { /* ignore */ }
    }

    if (phones.length === 0) {
      const seen = new Set(['/']);
      // Discovered links first, then fallbacks.
      const discovered = discoverContactPaths(html, domain);
      const result =
        (await tryPaths(domain, discovered, seen)) ||
        (await tryPaths(domain, FALLBACK_PATHS, seen));
      if (result) {
        phones = result.phones;
        where = `contacts:${result.path}`;
      }
    }

    return { domain, phones, status: phones.length ? `ok:${where}` : 'no_phones' };
  } catch (e) {
    return { domain, phones: [], status: 'error:' + (e.code || e.name || 'unknown') };
  }
}

let done = 0;
let withPhones = 0;

async function worker(queue) {
  while (queue.length) {
    const domain = queue.shift();
    if (!domain) continue;
    const r = await processDomain(domain);
    done++;
    if (r.phones.length) withPhones++;
    appendFileSync(outputPath, `${r.domain},${r.phones.join(';')},${r.status}\n`);
    if (done % 10 === 0 || done === domains.length) {
      process.stdout.write(`[${done}/${domains.length}] with phones: ${withPhones}\r`);
    }
  }
}

const queue = [...domains];
const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker(queue));
await Promise.all(workers);

console.log(`\nDone. ${withPhones}/${domains.length} sites returned at least one phone.`);
console.log(`Output: ${outputPath}`);
