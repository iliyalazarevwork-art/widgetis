#!/usr/bin/env node
/**
 * Splits the JSON envelope produced by build-demo.ts into the files
 * site-proxy serves: demo-bundle.js (loader) + wgts-chunks/{type}.js.
 *
 * Usage:
 *   node scripts/split-demo-chunks.mjs <envelope.json> <publicDir>
 *
 * Layout written:
 *   {publicDir}/demo-bundle.js
 *   {publicDir}/wgts-chunks/home.js
 *   {publicDir}/wgts-chunks/product.js
 *   {publicDir}/wgts-chunks/category.js
 *   {publicDir}/wgts-chunks/cart.js
 *   {publicDir}/wgts-chunks/checkout.js
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const [envelopePath, publicDirArg] = process.argv.slice(2);
if (!envelopePath || !publicDirArg) {
  console.error('Usage: split-demo-chunks.mjs <envelope.json> <publicDir>');
  process.exit(2);
}
const publicDir = resolve(publicDirArg);
const chunksDir = join(publicDir, 'wgts-chunks');

const raw = readFileSync(envelopePath, 'utf-8').trim();
if (!raw) {
  console.error('Envelope is empty');
  process.exit(1);
}

let envelope;
try {
  envelope = JSON.parse(raw);
} catch (err) {
  console.error('Envelope is not valid JSON:', err.message);
  process.exit(1);
}

const { loader, chunks } = envelope || {};
if (typeof loader !== 'string' || !loader.trim()) {
  console.error('Envelope.loader is missing or empty');
  process.exit(1);
}
if (!chunks || typeof chunks !== 'object') {
  console.error('Envelope.chunks is missing');
  process.exit(1);
}

mkdirSync(chunksDir, { recursive: true });

// Drop stale chunk files so a renamed/removed page-type doesn't keep serving
// old code from the last build. We only delete *.js inside the chunks dir.
if (existsSync(chunksDir)) {
  for (const f of readdirSync(chunksDir)) {
    if (f.endsWith('.js')) unlinkSync(join(chunksDir, f));
  }
}

const loaderPath = join(publicDir, 'demo-bundle.js');
writeFileSync(loaderPath, loader);
let totalChunkBytes = 0;
const written = [];
for (const [pageType, code] of Object.entries(chunks)) {
  if (typeof code !== 'string' || !code) continue;
  const p = join(chunksDir, `${pageType}.js`);
  writeFileSync(p, code);
  totalChunkBytes += code.length;
  written.push({ pageType, bytes: code.length });
}

console.log(`✅ loader → ${loaderPath} (${loader.length} bytes)`);
for (const { pageType, bytes } of written) {
  console.log(`✅ chunk  → wgts-chunks/${pageType}.js (${bytes} bytes)`);
}
console.log(
  `   total chunks: ${written.length}  ·  total chunk bytes: ${totalChunkBytes}`,
);
