#!/usr/bin/env node
// Scrape phone numbers from a list of Horoshop sites.
// Usage: node scrape_phones.mjs <input.txt> <output.csv> [limit] [concurrency]

import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';

const [, , inputPath, outputPath, limitArg, concArg] = process.argv;
if (!inputPath || !outputPath) {
  console.error('Usage: scrape_phones.mjs <input.txt> <output.csv> [limit] [concurrency]');
  process.exit(1);
}

const LIMIT = limitArg ? parseInt(limitArg, 10) : Infinity;
const CONCURRENCY = concArg ? parseInt(concArg, 10) : 15;
const TIMEOUT_MS = 20_000;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36';

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

function normalize(raw) {
  let decoded = raw;
  try { decoded = decodeURIComponent(raw); } catch { /* keep raw */ }
  // Strip everything except digits.
  const d = decoded.replace(/[^\d]/g, '');
  if (!d) return null;
  // Ukrainian normalization
  if (d.length === 12 && d.startsWith('380')) return '+' + d;
  if (d.length === 11 && d.startsWith('80') && d[2] === '0') return '+3' + d; // rare: 80XX...
  if (d.length === 10 && d.startsWith('0')) return '+38' + d;
  if (d.length === 9) return '+380' + d;
  // Other countries (Moldova +373, etc.) — keep as-is with leading +
  if (d.length >= 10 && d.length <= 15) return '+' + d;
  return null;
}

function extractPhones(html) {
  const raw = new Set();
  // data-fake-href="tel:..." — primary Horoshop pattern
  for (const m of html.matchAll(/data-fake-href="tel:([^"]+)"/g)) raw.add(m[1]);
  // href="tel:..." — fallback
  for (const m of html.matchAll(/href="tel:([^"]+)"/g)) raw.add(m[1]);

  const phones = new Set();
  for (const r of raw) {
    const n = normalize(r);
    if (n) phones.add(n);
  }
  // Filter Horoshop demo placeholder (0999999999) and obvious bogus shorts.
  return [...phones].filter((p) => !p.endsWith('0999999999') && p.length >= 11);
}

async function processDomain(domain) {
  const url = `https://${domain}/`;
  try {
    let html = await fetchHtml(url);
    if (html.length < 2000 && html.includes('challenge_passed')) {
      const hash = extractChallengeHash(html);
      if (!hash) return { domain, phones: [], status: 'challenge_no_hash' };
      html = await fetchHtml(url, `challenge_passed=${hash}`);
    }
    const phones = extractPhones(html);
    return { domain, phones, status: phones.length ? 'ok' : 'no_phones' };
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
    const line = `${r.domain},${r.phones.join(';')},${r.status}\n`;
    appendFileSync(outputPath, line);
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
