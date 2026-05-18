/**
 * Build the public demo bundle from demo-config.json — **chunked** edition.
 *
 * Emits a JSON envelope to stdout:
 *
 *   {
 *     "loader":  "<demo-bundle.js content>",
 *     "chunks":  { "home": "...", "product": "...", ... }
 *   }
 *
 * Then `scripts/split-demo-chunks.mjs` (run by the Taskfile) reads the JSON
 * and writes each file under `services/site-proxy/public/`. The site-proxy
 * inlines the loader and serves the chunks as static files; the loader
 * detects page-type at runtime and requests exactly one chunk per visit.
 *
 * Why this shape: the widget-builder container has no RW mount on the
 * site-proxy public dir (docker-compose.dev.yml:104 is :ro), so the single
 * stdout → JSON envelope path keeps the existing volume layout untouched.
 *
 * Usage (via Taskfile):
 *   task build:demo
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildModules, getAvailableModules, type ModuleConfigs } from './index.js';
import type { PageType } from '@laxarevii/core';
import { createJiti } from 'jiti';

const _jiti = createJiti(import.meta.url);

const PAGE_TYPES: PageType[] = ['home', 'category', 'product', 'cart', 'checkout'];

interface DemoConfig {
  modules: ModuleConfigs;
}

function loadConfig(): DemoConfig {
  const path = resolve(process.cwd(), 'demo-config.json');
  const raw = readFileSync(path, 'utf-8');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`demo-config.json is not valid JSON: ${msg}`);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('demo-config.json must be a JSON object');
  }

  const { modules } = parsed as { modules?: unknown };
  if (!modules || typeof modules !== 'object' || Array.isArray(modules)) {
    throw new Error('demo-config.json must have a "modules" object');
  }

  for (const [name, data] of Object.entries(modules as Record<string, unknown>)) {
    if (!data || typeof data !== 'object') {
      throw new Error(`Module "${name}" must be an object with { config, i18n }`);
    }
    const d = data as Record<string, unknown>;
    if (!d.config || typeof d.config !== 'object') {
      throw new Error(`Module "${name}" is missing a "config" object`);
    }
    if (d.i18n === undefined || d.i18n === null || typeof d.i18n !== 'object') {
      throw new Error(`Module "${name}" is missing an "i18n" object`);
    }
  }

  return { modules: modules as ModuleConfigs };
}

function fillDefaultsForMissingModules(modules: ModuleConfigs): ModuleConfigs {
  const merged: ModuleConfigs = { ...modules };
  const modulesDir = resolve(process.cwd(), 'modules');

  for (const moduleName of getAvailableModules()) {
    if (merged[moduleName]) continue;

    try {
      const schemaPath = resolve(modulesDir, moduleName, 'schema.ts');
      const schema = _jiti(schemaPath) as {
        getDefaultConfig?: () => Record<string, unknown>;
        getDefaultI18n?: () => Record<string, unknown>;
      };
      if (typeof schema.getDefaultConfig !== 'function' || typeof schema.getDefaultI18n !== 'function') {
        process.stderr.write(`[build-demo] skip "${moduleName}": no default config/i18n exported\n`);
        continue;
      }
      const config = schema.getDefaultConfig();
      const i18n = schema.getDefaultI18n();
      merged[moduleName] = {
        config: { ...config, enabled: true } as Record<string, unknown>,
        i18n: i18n as Record<string, unknown>,
      };
      process.stderr.write(`[build-demo] auto-included "${moduleName}" with defaults\n`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`[build-demo] failed to auto-include "${moduleName}": ${msg}\n`);
    }
  }

  return merged;
}

const DEV_PROXY_URL = 'http://localhost:3100';

function rewriteProxyUrls(modules: ModuleConfigs, publicUrl: string): ModuleConfigs {
  if (publicUrl === DEV_PROXY_URL) return modules;
  const trimmed = publicUrl.replace(/\/+$/, '');
  const walk = (value: unknown): unknown => {
    if (typeof value === 'string') return value.split(DEV_PROXY_URL).join(trimmed);
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, walk(v)]));
    }
    return value;
  };
  return walk(modules) as ModuleConfigs;
}

/**
 * Extract the `pages: PageType[]` export from a module's index.ts source.
 * Mirrors the parser in widget-builder/index.ts:extractPagesFromSource.
 * Returns 'all' when the module declares pages = 'all', undefined when no
 * export is present (the module is treated as page-agnostic → included in
 * every chunk).
 */
function readPagesFromIndex(moduleName: string): PageType[] | 'all' | undefined {
  const name = moduleName.startsWith('module-') ? moduleName : `module-${moduleName}`;
  const indexPath = resolve(process.cwd(), 'modules', name, 'index.ts');
  let src: string;
  try {
    src = readFileSync(indexPath, 'utf8');
  } catch {
    return undefined;
  }
  const m = src.match(/export\s+const\s+pages\s*(?::[^=]+)?=\s*([^;]+);/);
  if (!m) return undefined;
  const rhs = m[1].trim().replace(/\s+as\s+const\s*$/, '').trim();
  if (rhs === "'all'" || rhs === '"all"') return 'all';
  const arr = rhs.match(/^\[(.*)\]$/);
  if (!arr) return undefined;
  const inner = arr[1].trim();
  if (inner === '') return [];
  return inner
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter((s) => s.length > 0) as PageType[];
}

function modulesForPage(modules: ModuleConfigs, pageType: PageType): ModuleConfigs {
  const subset: ModuleConfigs = {};
  for (const [name, data] of Object.entries(modules)) {
    const pages = readPagesFromIndex(name);
    if (pages === undefined || pages === 'all') {
      subset[name] = data;
      continue;
    }
    if (pages.includes(pageType)) {
      subset[name] = data;
    }
  }
  return subset;
}

function buildLoader(buildId: string, chunkBase: string): string {
  // Same detection rules as packages/core/page-type.ts. Inlined here so the
  // loader is one self-contained file (a few KB) with no external imports.
  const detector = `function(doc){
    var og=(doc.querySelector('meta[property="og:type"]')||{}).content;
    og=og?og.trim().toLowerCase():null;
    if(doc.querySelector('body.checkout,.checkout-page,#checkout-form,[data-checkout],body.b-checkout,.checkout__form'))return 'checkout';
    if(doc.querySelector('body.cart,.cart-page,#cart-page,.j-cart-page,body.b-cart'))return 'cart';
    if(og==='product')return 'product';
    if(og==='product.group')return 'category';
    if(og==='website')return 'home';
    if(og==='article')return 'other';
    if(doc.querySelector('.j-products-list,.catalog__products,.category__products,body.b-category'))return 'category';
    if(doc.querySelector('.product-header,.product__section--header,.j-product-description,#productPage,.product__buy-button,body.b-product'))return 'product';
    if(doc.querySelector('body.home,.home-page,body[data-page="home"],body.main-page,body.b-main,.j-banner-adaptive,.banners-group,.main-banners'))return 'home';
    return 'other';
  }`;

  return [
    '(function(){',
    'try{',
    `var BID=${JSON.stringify(buildId)};`,
    `var BUILT=${JSON.stringify(new Date().toISOString())};`,
    `var BASE=${JSON.stringify(chunkBase)};`,
    `var detect=${detector};`,
    "console.log('%c[widgetis] loader build='+BID+' builtAt='+BUILT,'background:#111827;color:#facc15;padding:2px 6px;border-radius:3px;font-weight:700');",
    // Build-id reset: clear stale localStorage between builds. Mirrors the
    // single-bundle prelude — moved here so the loader owns all bootstrap.
    "var KEY='wty_demo_build_id';",
    "if(localStorage.getItem(KEY)!==BID){",
    "var P=['wty_','wdg_','wdg-','widgetis','interest:','stw_'];",
    'var del=[];',
    'for(var i=0;i<localStorage.length;i++){',
    'var k=localStorage.key(i);',
    'if(k&&P.some(function(p){return k.indexOf(p)===0;}))del.push(k);',
    '}',
    'del.forEach(function(k){localStorage.removeItem(k);});',
    'localStorage.setItem(KEY,BID);',
    "console.log('[widgetis] loader: build changed, cleared '+del.length+' localStorage keys');",
    '}',
    "var type=detect(document);",
    "(window).__WIDGETIS_PAGE_TYPE__=type;",
    "console.log('[widgetis] page type:',type);",
    "if(type==='other'){console.log('[widgetis] no chunk for this page type — exit');return;}",
    "var s=document.createElement('script');",
    "s.async=true;",
    // Absolute URL via location.origin so the site-proxy runtime URL rewriter
    // (which prepends /site/{domain} to every root-relative path) leaves us
    // alone — our chunks live at the proxy root, not inside the merchant
    // namespace. See services/site-proxy/server.mjs:rewriteUrl.
    "s.src=location.origin+BASE+'/'+type+'.js?b='+BID;",
    "s.onerror=function(){console.error('[widgetis] failed to load chunk:',s.src);};",
    "(document.head||document.documentElement).appendChild(s);",
    '}catch(e){console.error("[widgetis] loader failed:",e);}',
    '})();',
  ].join('\n');
}

async function main(): Promise<void> {
  const explicit = loadConfig().modules;
  const filled = fillDefaultsForMissingModules(explicit);
  const publicUrl = process.env.DEMO_PROXY_PUBLIC_URL?.trim() || DEV_PROXY_URL;
  const modules = rewriteProxyUrls(filled, publicUrl);
  process.stderr.write(`[build-demo] proxy URL: ${publicUrl}\n`);

  if (Object.keys(modules).length === 0) {
    throw new Error('demo-config.json contains zero modules and no defaults could be loaded');
  }

  const buildId = String(Date.now());
  const comment = buildHeader();
  const chunks: Record<string, string> = {};
  // OBFUSCATE=0 (or any falsy value) skips javascript-obfuscator. Used to
  // measure the raw bundle size — obfuscation adds ~30-50% byte weight and
  // worsens brotli compression. See docs/widget-bundle-performance.md.
  const obfuscate = !/^(0|false|no|off)$/i.test(process.env.OBFUSCATE ?? '1');
  process.stderr.write(`[build-demo] obfuscate: ${obfuscate}\n`);

  for (const pageType of PAGE_TYPES) {
    const subset = modulesForPage(modules, pageType);
    const names = Object.keys(subset);
    if (names.length === 0) {
      process.stderr.write(`[build-demo] skip chunk "${pageType}" — no matching modules\n`);
      continue;
    }
    process.stderr.write(`[build-demo] building chunk "${pageType}" (${names.length} modules)\n`);
    const js = await buildModules({
      modules: subset,
      obfuscate,
      site: `demo/${pageType}`,
      comment,
      demo: true,
    });
    chunks[pageType] = js;
  }

  const loader = buildLoader(buildId, '/wgts-chunks');

  process.stdout.write(JSON.stringify({ loader, chunks }));
  process.stdout.write('\n');
}

function buildHeader(): string {
  const now = new Date();
  return [
    '/**',
    ' * Widgetis Demo Chunk',
    ` * Built:    ${now.toUTCString()}`,
    ' * Source:   widget-builder/demo-config.json',
    ' * ',
    ' * LICENSE: Proprietary and Confidential.',
    ` * © ${now.getFullYear()} Widgetis. All rights reserved.`,
    ' */',
  ].join('\n');
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`[build-demo] FAILED: ${msg}\n`);
  process.exit(1);
});
