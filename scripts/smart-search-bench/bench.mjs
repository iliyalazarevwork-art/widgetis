#!/usr/bin/env node
// Smart-search latency comparison: us vs LoyalShop.
//
// Usage: node bench.mjs
//
// Prereqs:
//   - backend running on http://localhost:9001
//   - safeyourlove.com registered as a site, feed imported (uk)
//   - host header matters: we pretend Origin is the merchant's domain

import { performance } from 'node:perf_hooks';

// 11 queries chosen for diverse hit profiles (short prefix, full word, latin, mixed).
// Each query is fired once cold, then once warm — cold tests engine, warm tests cache.
const QUERIES_UK = [
  'пре', 'презерватив', 'крем', 'мастер', 'gel', 'мас', 'lub', 'вибра', 'set',
  'masaz', 'olej',
];
const COLD_ROUNDS = 1;
const WARM_ROUNDS = 4; // a query that's cold once becomes warm on the same path

const ENDPOINTS = [
  {
    name: 'LoyalShop',
    url: (q) =>
      `https://api.loyalshop.app/search/api/search/shop-xwdikx?q=${encodeURIComponent(q)}&limit=10&lang=uk`,
    headers: { Accept: 'application/json' },
  },
  {
    name: 'Widgetis',
    url: (q) =>
      `http://localhost:9001/api/v1/widgets/smart-search?q=${encodeURIComponent(q)}&limit=10&lang=uk`,
    headers: {
      Accept: 'application/json',
      // Origin is what middleware uses to resolve the site
      Origin: 'https://safeyourlove.com',
      Referer: 'https://safeyourlove.com/',
    },
  },
];

function p(values, q) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((q / 100) * sorted.length));
  return sorted[idx];
}

function fmt(n, d = 1) {
  return Number.isFinite(n) ? n.toFixed(d) : '—';
}

async function fetchOnce(ep, q) {
  const t0 = performance.now();
  const res = await fetch(ep.url(q), { headers: ep.headers });
  const body = await res.text();
  const t1 = performance.now();
  return { ms: t1 - t0, status: res.status, body };
}

function shapeOf(json) {
  if (!json || typeof json !== 'object') return null;
  return {
    keys: Object.keys(json).sort(),
    total: typeof json.total === 'number' ? json.total : null,
    groupCount: json.groups ? Object.keys(json.groups).length : 0,
    sampleItem: (() => {
      const g = json.groups && Object.values(json.groups)[0];
      const it = g && Array.isArray(g.items) && g.items[0];
      return it ? Object.keys(it).sort() : null;
    })(),
  };
}

async function main() {
  console.log(`\nSmart-search latency comparison`);
  console.log(`queries: ${QUERIES_UK.length}, cold: ${COLD_ROUNDS}/q, warm: ${WARM_ROUNDS}/q\n`);

  const results = {};
  for (const ep of ENDPOINTS) results[ep.name] = { coldLat: [], warmLat: [], errors: 0, sizes: [], shapes: {} };

  // Verify both endpoints are reachable + capture shape
  for (const ep of ENDPOINTS) {
    const probe = await fetchOnce(ep, QUERIES_UK[0]).catch((e) => ({ status: 'ERR', err: e.message }));
    if (probe.status !== 200) {
      console.error(`✗ ${ep.name} probe failed: HTTP ${probe.status}${probe.err ? ` (${probe.err})` : ''}`);
      console.error(`  body: ${(probe.body || '').slice(0, 200)}`);
      process.exit(1);
    }
    try {
      results[ep.name].shapes.first = shapeOf(JSON.parse(probe.body));
    } catch {}
    console.log(`✓ ${ep.name} reachable`);
  }
  console.log();

  // Pace requests to stay under our backend's 60/min route throttle.
  const PACE_MS = 1100;

  console.log('Phase 1: cold latency (each query first hit per endpoint)');
  for (const q of QUERIES_UK) {
    for (const ep of ENDPOINTS) {
      // Bypass any cache by appending a unique query suffix only the FIRST time
      // we hit each (q, ep) pair in this phase.
      const r0 = await fetchOnce(ep, q + ' ' + Date.now().toString(36).slice(-3)).catch(() => null);
      if (r0 && r0.status === 200) {
        results[ep.name].coldLat.push(r0.ms);
        results[ep.name].sizes.push(r0.body.length);
      } else {
        results[ep.name].errors++;
      }
      await new Promise((res) => setTimeout(res, PACE_MS));
    }
  }

  console.log('Phase 2: warm latency (repeats of same q — cache should hit)');
  for (let r = 0; r < WARM_ROUNDS; r++) {
    for (const q of QUERIES_UK.slice(0, 5)) {
      for (const ep of ENDPOINTS) {
        const r0 = await fetchOnce(ep, q).catch(() => null);
        if (r0 && r0.status === 200) {
          results[ep.name].warmLat.push(r0.ms);
        } else {
          results[ep.name].errors++;
        }
        await new Promise((res) => setTimeout(res, PACE_MS));
      }
    }
    process.stdout.write(`  warm round ${r + 1}/${WARM_ROUNDS}\r`);
  }
  console.log('\n');

  // Print summary
  function tableRow(label, lat) {
    if (lat.length === 0) return label.padEnd(20) + '(no data)';
    const min = Math.min(...lat);
    const max = Math.max(...lat);
    return (
      label.padEnd(20) +
      String(lat.length).padStart(6) +
      fmt(min).padStart(8) +
      fmt(p(lat, 50)).padStart(8) +
      fmt(p(lat, 95)).padStart(8) +
      fmt(p(lat, 99)).padStart(8) +
      fmt(max).padStart(8)
    );
  }

  console.log('\nLatency (ms)');
  console.log('─'.repeat(72));
  console.log('endpoint / phase'.padEnd(20) + 'n'.padStart(6) + 'min'.padStart(8) + 'p50'.padStart(8) + 'p95'.padStart(8) + 'p99'.padStart(8) + 'max'.padStart(8));
  console.log('─'.repeat(72));
  for (const ep of ENDPOINTS) {
    const r = results[ep.name];
    console.log(tableRow(`${ep.name} cold`, r.coldLat));
    console.log(tableRow(`${ep.name} warm`, r.warmLat));
  }
  console.log();
  console.log(`Errors: ${ENDPOINTS.map((e) => `${e.name}=${results[e.name].errors}`).join(', ')}`);
  console.log();

  // Avg response size
  console.log('Response size (bytes)');
  console.log('─'.repeat(50));
  for (const ep of ENDPOINTS) {
    const sz = results[ep.name].sizes;
    if (sz.length === 0) continue;
    const avg = sz.reduce((a, b) => a + b, 0) / sz.length;
    console.log(`  ${ep.name.padEnd(14)} avg ${Math.round(avg)} (min ${Math.min(...sz)} / max ${Math.max(...sz)})`);
  }
  console.log();

  // Shape comparison
  console.log('Response shape (top-level keys)');
  console.log('─'.repeat(50));
  for (const ep of ENDPOINTS) {
    const s = results[ep.name].shapes.first;
    if (!s) {
      console.log(`  ${ep.name}: <unparseable>`);
      continue;
    }
    console.log(`  ${ep.name}:`);
    console.log(`    keys:        ${s.keys.join(', ')}`);
    console.log(`    total:       ${s.total}`);
    console.log(`    groups:      ${s.groupCount}`);
    console.log(`    item keys:   ${s.sampleItem ? s.sampleItem.join(', ') : '<empty>'}`);
  }

  // Side-by-side raw diff for q="презерватив"
  console.log('\nResult overlap for q="презерватив" (top 5 ids per endpoint)');
  console.log('─'.repeat(70));
  const probeQ = 'презерватив';
  const samples = {};
  for (const ep of ENDPOINTS) {
    const r = await fetchOnce(ep, probeQ);
    try {
      const j = JSON.parse(r.body);
      const ids = [];
      for (const g of Object.values(j.groups || {})) {
        for (const it of g.items || []) {
          ids.push(it.id);
          if (ids.length >= 5) break;
        }
        if (ids.length >= 5) break;
      }
      samples[ep.name] = { total: j.total, ids };
    } catch {}
  }
  for (const [name, s] of Object.entries(samples)) {
    console.log(`  ${name.padEnd(14)} total=${s.total}, top5_ids=[${s.ids.join(', ')}]`);
  }
  if (samples.LoyalShop && samples.Widgetis) {
    const a = new Set(samples.LoyalShop.ids);
    const b = new Set(samples.Widgetis.ids);
    const overlap = [...a].filter((x) => b.has(x)).length;
    console.log(`  overlap (top-5): ${overlap}/5`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
