#!/usr/bin/env node
// Scrape custom inline JS blocks (Horoshop admin "custom code" injections)
// from each site and save one file per domain.
// Usage: node scrape_scripts.mjs <input.txt> <out_dir> [limit] [concurrency]

import { readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , inputPath, outDir, limitArg, concArg] = process.argv;
if (!inputPath || !outDir) {
  console.error('Usage: scrape_scripts.mjs <input.txt> <out_dir> [limit] [concurrency]');
  process.exit(1);
}

const LIMIT = limitArg ? parseInt(limitArg, 10) : Infinity;
const CONCURRENCY = concArg ? parseInt(concArg, 10) : 15;
const TIMEOUT_MS = 25_000;
const MIN_SCRIPT_LEN = 500; // skip tiny boilerplate
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36';

// Markers that identify Horoshop framework / standard 3rd-party snippets — drop those scripts.
const BOILERPLATE_MARKERS = [
  'INIT.add',
  'CSRFToken',
  'ActiveForm',
  'ActiveLazyLoad',
  "gtag('event'",
  'gtag("event"',
  'fbq(',
  'dataLayer.push',
  'Modal.close()',
  '_tmr.push',
  'ym(',
];

mkdirSync(outDir, { recursive: true });
const indexPath = join(outDir, '_index.csv');
writeFileSync(indexPath, 'domain,scripts_count,total_bytes,status\n');

const domains = readFileSync(inputPath, 'utf8')
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean)
  .slice(0, LIMIT);

async function fetchHtml(url, cookie = '') {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml',
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

function isBoilerplate(code) {
  for (const m of BOILERPLATE_MARKERS) {
    if (code.includes(m)) return true;
  }
  return false;
}

function extractCustomScripts(html) {
  const bodyIdx = html.indexOf('<body');
  if (bodyIdx === -1) return [];
  const body = html.slice(bodyIdx);
  const scripts = [...body.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
  const result = [];
  for (const m of scripts) {
    const attrs = m[1];
    if (/\bsrc\s*=/i.test(attrs)) continue; // external src — skip
    if (/type\s*=\s*["']application\/(ld\+json|json)["']/i.test(attrs)) continue;
    const code = m[2].trim();
    if (code.length < MIN_SCRIPT_LEN) continue;
    if (isBoilerplate(code)) continue;
    result.push(code);
  }
  return result;
}

function safeFilename(domain) {
  return domain.replace(/[^a-z0-9.\-_]/gi, '_');
}

async function processDomain(domain) {
  const url = `https://${domain}/`;
  try {
    let html = await fetchHtml(url);
    if (html.length < 2000 && html.includes('challenge_passed')) {
      const hash = extractChallengeHash(html);
      if (!hash) return { domain, count: 0, bytes: 0, status: 'challenge_no_hash' };
      html = await fetchHtml(url, `challenge_passed=${hash}`);
    }
    const scripts = extractCustomScripts(html);
    if (!scripts.length) return { domain, count: 0, bytes: 0, status: 'no_custom_scripts' };

    const parts = scripts.map(
      (s, i) => `// === script #${i + 1} (length=${s.length}) ===\n${s}\n`,
    );
    const content = `// source: ${url}\n// extracted: ${new Date().toISOString()}\n// scripts: ${scripts.length}\n\n${parts.join('\n')}`;
    const file = join(outDir, safeFilename(domain) + '.js');
    writeFileSync(file, content);

    const bytes = scripts.reduce((a, s) => a + s.length, 0);
    return { domain, count: scripts.length, bytes, status: 'ok' };
  } catch (e) {
    return { domain, count: 0, bytes: 0, status: 'error:' + (e.code || e.name || 'unknown') };
  }
}

let done = 0;
let withScripts = 0;

async function worker(queue) {
  while (queue.length) {
    const domain = queue.shift();
    if (!domain) continue;
    const r = await processDomain(domain);
    done++;
    if (r.count) withScripts++;
    appendFileSync(indexPath, `${r.domain},${r.count},${r.bytes},${r.status}\n`);
    if (done % 5 === 0 || done === domains.length) {
      process.stdout.write(`[${done}/${domains.length}] with scripts: ${withScripts}\r`);
    }
  }
}

const queue = [...domains];
const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker(queue));
await Promise.all(workers);

console.log(`\nDone. ${withScripts}/${domains.length} sites had custom scripts.`);
console.log(`Files in: ${outDir}/`);
console.log(`Index:    ${indexPath}`);
