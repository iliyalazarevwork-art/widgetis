#!/usr/bin/env node
// Concurrency / throughput benchmark for cdn.loyalshop.app loader endpoint.
//
// Usage:
//   node bench.mjs                     # default sweep
//   node bench.mjs 50 15               # one stage: 50 concurrency, 15s
//   node bench.mjs sweep 5             # sweep with 5s per stage
//
// What it does:
//   - Fires GET https://cdn.loyalshop.app/prod/loader.js?shop=shop-XXXXXX&api=...
//     with random 6-char [a-z0-9] suffixes (so we measure the real "miss" path).
//   - Measures RPS, latency p50/p95/p99, and counts by HTTP status / error class.
//   - Detects rate-limit / WAF signals (429, 403, 503, Cloudflare body markers).
//
// No deps — Node 18+ built-in fetch + Agent.

import { Agent, setGlobalDispatcher, request } from 'undici';

// ---------- config ----------
// Real existence check is on the API, not the CDN — CDN's loader.js is byte-identical for any shop.
// 200 + variable body = real shop;  404 + {"detail":"Not Found"} = miss.
const URL_TEMPLATE = (shop) =>
  `https://api.loyalshop.app/public/shop/shop-${shop}/config`;

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const ID_LEN = 6;

// Sweep stages: [concurrency, durationSec]
const DEFAULT_SWEEP = [
  [5, 8],
  [10, 8],
  [25, 8],
  [50, 10],
  [100, 10],
  [200, 10],
  [400, 10],
];

// ---------- helpers ----------
function randomShopId() {
  let s = '';
  for (let i = 0; i < ID_LEN; i++) {
    s += ALPHABET[(Math.random() * ALPHABET.length) | 0];
  }
  return s;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function fmt(n, digits = 2) {
  return Number.isFinite(n) ? n.toFixed(digits) : '—';
}

function classifyBody(status, body) {
  if (status === 429) return 'rate_limited';
  if (status === 503 && /cloudflare/i.test(body)) return 'cf_challenge';
  if (status === 403 && /cloudflare|attention required/i.test(body)) return 'cf_block';
  if (status === 403) return 'forbidden';
  return null;
}

// ---------- worker ----------
async function runStage(concurrency, durationMs, dispatcher) {
  const stats = {
    sent: 0,
    ok: 0,        // 200
    notFound: 0,  // 404
    other2xx: 0,
    other3xx: 0,
    other4xx: 0,
    other5xx: 0,
    rateLimited: 0,
    cfBlocked: 0,
    cfChallenge: 0,
    netErrors: 0,
    bytes: 0,
    latencies: [],
    statusCounts: new Map(),
    errorKinds: new Map(),
    foundShops: [],
  };

  const stop = Date.now() + durationMs;
  let stopped = false;

  async function worker() {
    while (!stopped && Date.now() < stop) {
      const shop = randomShopId();
      const url = URL_TEMPLATE(shop);
      const t0 = performance.now();
      try {
        const res = await request(url, {
          method: 'GET',
          dispatcher,
          headers: {
            'user-agent': 'loyalshop-bench/1.0 (+local research)',
            'accept': '*/*',
          },
          // Keep timeout aggressive so a stalled CDN doesn't tank concurrency.
          headersTimeout: 10_000,
          bodyTimeout: 10_000,
        });
        // Drain body — needed to release connection. Cap at 256KB just in case.
        let bodyText = '';
        let total = 0;
        for await (const chunk of res.body) {
          total += chunk.length;
          if (bodyText.length < 4096) {
            bodyText += chunk.toString('utf8', 0, Math.min(chunk.length, 4096 - bodyText.length));
          }
          if (total > 256 * 1024) break;
        }
        const dt = performance.now() - t0;
        stats.sent++;
        stats.bytes += total;
        stats.latencies.push(dt);
        stats.statusCounts.set(res.statusCode, (stats.statusCounts.get(res.statusCode) || 0) + 1);

        const cls = classifyBody(res.statusCode, bodyText);
        if (cls === 'rate_limited') stats.rateLimited++;
        else if (cls === 'cf_block') stats.cfBlocked++;
        else if (cls === 'cf_challenge') stats.cfChallenge++;

        if (res.statusCode === 200) {
          stats.ok++;
          if (stats.foundShops.length < 50) stats.foundShops.push(shop);
        } else if (res.statusCode === 404) {
          stats.notFound++;
        } else if (res.statusCode >= 200 && res.statusCode < 300) {
          stats.other2xx++;
        } else if (res.statusCode >= 300 && res.statusCode < 400) {
          stats.other3xx++;
        } else if (res.statusCode >= 400 && res.statusCode < 500) {
          stats.other4xx++;
        } else if (res.statusCode >= 500) {
          stats.other5xx++;
        }
      } catch (err) {
        stats.sent++;
        stats.netErrors++;
        const kind = err.code || err.name || 'UnknownError';
        stats.errorKinds.set(kind, (stats.errorKinds.get(kind) || 0) + 1);
        stats.latencies.push(performance.now() - t0);
      }
    }
  }

  const t0 = Date.now();
  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  stopped = true;
  const elapsedMs = Date.now() - t0;

  stats.latencies.sort((a, b) => a - b);
  const rps = stats.sent / (elapsedMs / 1000);
  const p50 = percentile(stats.latencies, 50);
  const p95 = percentile(stats.latencies, 95);
  const p99 = percentile(stats.latencies, 99);
  const avg = stats.latencies.reduce((a, b) => a + b, 0) / (stats.latencies.length || 1);

  return { ...stats, elapsedMs, rps, p50, p95, p99, avg };
}

function printStage(concurrency, durationSec, r) {
  console.log('');
  console.log('─'.repeat(80));
  console.log(`STAGE  concurrency=${concurrency}  duration=${durationSec}s  elapsed=${(r.elapsedMs/1000).toFixed(1)}s`);
  console.log('─'.repeat(80));
  console.log(`  Sent:           ${r.sent}`);
  console.log(`  Throughput:     ${fmt(r.rps, 1)} req/s     (${(r.bytes / 1024 / 1024).toFixed(2)} MB total)`);
  console.log(`  Latency:        avg=${fmt(r.avg)}ms  p50=${fmt(r.p50)}ms  p95=${fmt(r.p95)}ms  p99=${fmt(r.p99)}ms`);
  console.log(`  Status:         200=${r.ok}  404=${r.notFound}  2xx*=${r.other2xx}  3xx=${r.other3xx}  4xx*=${r.other4xx}  5xx=${r.other5xx}`);
  console.log(`  WAF / limits:   429=${r.rateLimited}  cf_block=${r.cfBlocked}  cf_challenge=${r.cfChallenge}`);
  console.log(`  Network errors: ${r.netErrors}`);
  if (r.errorKinds.size > 0) {
    const parts = [...r.errorKinds.entries()].map(([k, v]) => `${k}=${v}`).join('  ');
    console.log(`     by kind:     ${parts}`);
  }
  if (r.statusCounts.size > 0) {
    const parts = [...r.statusCounts.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([k, v]) => `${k}=${v}`)
      .join('  ');
    console.log(`     by code:     ${parts}`);
  }
  if (r.foundShops.length) {
    console.log(`  ⚡ FOUND 200s:  ${r.foundShops.join(', ')}${r.ok > r.foundShops.length ? ` (+${r.ok - r.foundShops.length} more)` : ''}`);
  }
}

// ---------- main ----------
async function main() {
  const args = process.argv.slice(2);

  // One ramped-up dispatcher — many sockets, keep-alive.
  const dispatcher = new Agent({
    connections: 1000,        // pool large enough for highest stage
    pipelining: 1,
    keepAliveTimeout: 30_000,
    keepAliveMaxTimeout: 60_000,
    connect: { timeout: 10_000 },
  });
  setGlobalDispatcher(dispatcher);

  let stages;
  if (args[0] && args[0] !== 'sweep' && /^\d+$/.test(args[0])) {
    const c = parseInt(args[0], 10);
    const d = parseInt(args[1] || '15', 10);
    stages = [[c, d]];
  } else {
    const perStage = args[0] === 'sweep' && args[1] ? parseInt(args[1], 10) : null;
    stages = DEFAULT_SWEEP.map(([c, d]) => [c, perStage ?? d]);
  }

  console.log('Loyalshop loader benchmark');
  console.log(`Target: ${URL_TEMPLATE('XXXXXX')}`);
  console.log(`Stages: ${stages.map(([c, d]) => `${c}@${d}s`).join('  ')}`);

  const summary = [];
  for (const [c, d] of stages) {
    const r = await runStage(c, d * 1000, dispatcher);
    printStage(c, d, r);
    summary.push({ concurrency: c, ...r });
    // Tiny cooldown between stages so CDN counters relax.
    await new Promise(r => setTimeout(r, 1000));

    // Bail early if WAF lit up — no point hammering harder.
    const blocked = r.cfBlocked + r.cfChallenge + r.rateLimited;
    if (blocked > r.sent * 0.2) {
      console.log(`\n⚠  >20% blocked at concurrency=${c}, stopping sweep.`);
      break;
    }
  }

  // ---- summary table ----
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('SUMMARY');
  console.log('═'.repeat(80));
  console.log('conc   sent   rps      p50ms   p95ms   p99ms   200s   404s   429   cf   errs');
  for (const s of summary) {
    console.log(
      [
        String(s.concurrency).padStart(4),
        String(s.sent).padStart(6),
        fmt(s.rps, 1).padStart(7),
        fmt(s.p50, 0).padStart(7),
        fmt(s.p95, 0).padStart(7),
        fmt(s.p99, 0).padStart(7),
        String(s.ok).padStart(6),
        String(s.notFound).padStart(6),
        String(s.rateLimited).padStart(5),
        String(s.cfBlocked + s.cfChallenge).padStart(4),
        String(s.netErrors).padStart(5),
      ].join(' '),
    );
  }

  // ---- recommendation ----
  const clean = summary.filter(s =>
    s.netErrors / s.sent < 0.02 &&
    (s.rateLimited + s.cfBlocked + s.cfChallenge) === 0
  );
  const best = clean.sort((a, b) => b.rps - a.rps)[0];
  console.log('');
  if (best) {
    const total = 36 ** 6;
    const etaSec = total / best.rps;
    const etaDays = etaSec / 86400;
    console.log(`Best clean stage: concurrency=${best.concurrency}  →  ${fmt(best.rps, 1)} req/s`);
    console.log(`Full 36^6 (${total.toLocaleString()}) brute force ETA: ${etaDays.toFixed(1)} days at this rate.`);
    console.log(`36^5 (${(36 ** 5).toLocaleString()}) ETA: ${(36 ** 5 / best.rps / 3600).toFixed(1)} hours.`);
    console.log(`36^4 (${(36 ** 4).toLocaleString()}) ETA: ${(36 ** 4 / best.rps / 60).toFixed(1)} minutes.`);
  } else {
    console.log('No clean stages — every concurrency level produced WAF blocks or errors. Brute force not viable from this network.');
  }

  await dispatcher.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
