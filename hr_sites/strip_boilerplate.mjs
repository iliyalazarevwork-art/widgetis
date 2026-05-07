#!/usr/bin/env node
// Strip Horoshop platform boilerplate from scraped script files.
// Removes the always-identical cart popup, compare popup, and the
// orphan `w.INIT.execute(); })(window)</script>` fragment. Keeps the
// per-site unique inline scripts (GA, Binotel, FB pixel, etc.).
//
// Usage:
//   node strip_boilerplate.mjs <dir>           # dry-run (default)
//   node strip_boilerplate.mjs <dir> --apply   # rewrite files in place

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const [, , dirArg, ...flags] = process.argv;
if (!dirArg) {
  console.error('Usage: strip_boilerplate.mjs <dir> [--apply]');
  process.exit(1);
}
const APPLY = flags.includes('--apply');

// 1. Cart popup + its AjaxCart init script (identical on every site).
const CART_RE =
  /[ \t]*<section\s+id="cart"\s+class="popup __cart"[\s\S]*?<\/section>\s*<script>\s*\(function \(w\)[\s\S]*?AjaxCart\.getInstance\(\)[\s\S]*?<\/script>/g;

// 2. Compare popup + ComparisonTable init script (uid hash differs, body identical).
const COMPARE_RE =
  /[ \t]*<section\s+class="compare"\s+id="uid[a-f0-9]+"[\s\S]*?<\/section>\s*<script>[\s\S]*?ComparisonTable\.createInstance[\s\S]*?<\/script>/g;

// 3. Orphan tail of the framework boot IIFE (no opening <script>, just dead text).
const ORPHAN_INIT_RE = /\nw\.INIT\.execute\(\);\s*\n\s*\}\)\(window\)\s*\n\s*<\/script>\n?/;

function strip(src) {
  let out = src;
  out = out.replace(CART_RE, '');
  out = out.replace(COMPARE_RE, '');
  out = out.replace(ORPHAN_INIT_RE, '\n');
  // Collapse runs of blank lines left behind.
  out = out.replace(/\n{3,}/g, '\n\n');
  return out;
}

const files = readdirSync(dirArg)
  .filter((f) => f.endsWith('.html'))
  .map((f) => join(dirArg, f));

let totalBefore = 0;
let totalAfter = 0;
let changed = 0;
let untouched = 0;

for (const path of files) {
  const src = readFileSync(path, 'utf8');
  const before = Buffer.byteLength(src);
  const out = strip(src);
  const after = Buffer.byteLength(out);

  totalBefore += before;
  totalAfter += after;

  if (after !== before) {
    changed++;
    if (APPLY) writeFileSync(path, out);
  } else {
    untouched++;
  }
}

const fmt = (n) => (n / 1024 / 1024).toFixed(2) + ' MB';
const saved = totalBefore - totalAfter;
const pct = ((saved / totalBefore) * 100).toFixed(1);

console.log(`Files:     ${files.length}  (changed: ${changed}, untouched: ${untouched})`);
console.log(`Before:    ${fmt(totalBefore)}`);
console.log(`After:     ${fmt(totalAfter)}`);
console.log(`Saved:     ${fmt(saved)}  (${pct}%)`);
console.log(APPLY ? 'Mode:      APPLIED (files rewritten)' : 'Mode:      dry-run (use --apply to write)');
