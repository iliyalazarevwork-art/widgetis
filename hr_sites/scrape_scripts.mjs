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
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36';

// Marker that delimits the end of Horoshop framework boot — everything that follows
// (and before </body>) is custom owner-added content.
const START_MARKER = 'w.INIT.execute();';

mkdirSync(outDir, { recursive: true });
const indexPath = join(outDir, '_index.csv');
writeFileSync(indexPath, 'domain,bytes,status\n');

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

function extractTail(html) {
  const start = html.indexOf(START_MARKER);
  if (start === -1) return null;
  const end = html.lastIndexOf('</body>');
  if (end === -1 || end <= start) return html.slice(start);
  return html.slice(start, end);
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
      if (!hash) return { domain, bytes: 0, status: 'challenge_no_hash' };
      html = await fetchHtml(url, `challenge_passed=${hash}`);
    }
    const tail = extractTail(html);
    if (tail === null) return { domain, bytes: 0, status: 'no_marker' };

    const header = `<!-- source: ${url} -->\n<!-- extracted: ${new Date().toISOString()} -->\n<!-- start: w.INIT.execute(); end: </body> -->\n<!-- length: ${tail.length} -->\n\n`;
    const file = join(outDir, safeFilename(domain) + '.html');
    writeFileSync(file, header + tail);
    return { domain, bytes: tail.length, status: 'ok' };
  } catch (e) {
    return { domain, bytes: 0, status: 'error:' + (e.code || e.name || 'unknown') };
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
    if (r.status === 'ok') withScripts++;
    appendFileSync(indexPath, `${r.domain},${r.bytes},${r.status}\n`);
    if (done % 25 === 0 || done === domains.length) {
      process.stdout.write(`[${done}/${domains.length}] saved: ${withScripts}\r`);
    }
  }
}

const queue = [...domains];
const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker(queue));
await Promise.all(workers);

console.log(`\nDone. ${withScripts}/${domains.length} sites saved.`);
console.log(`Files in: ${outDir}/`);
console.log(`Index:    ${indexPath}`);
