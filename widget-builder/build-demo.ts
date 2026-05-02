/**
 * Build the public demo bundle from demo-config.json.
 *
 * Reads widget-builder/demo-config.json, runs the regular Vite pipeline with
 * javascript-obfuscator enabled, and writes the resulting JS to stdout.
 *
 * Usage (via Taskfile):
 *   task build:demo
 *
 * Or directly:
 *   docker compose -f docker-compose.dev.yml exec -T widget-builder \
 *     jiti build-demo.ts > services/site-proxy/public/demo-bundle.js
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildModules, getAvailableModules, type ModuleConfigs } from './index.js';
import { createJiti } from 'jiti';

const _jiti = createJiti(import.meta.url);

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

/**
 * Auto-fill any module not present in demo-config.json with its schema defaults.
 * The hand-edited demo-config.json wins when a module is explicitly listed.
 */
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

async function main(): Promise<void> {
  const explicit = loadConfig().modules;
  const modules = fillDefaultsForMissingModules(explicit);

  if (Object.keys(modules).length === 0) {
    throw new Error('demo-config.json contains zero modules and no defaults could be loaded');
  }

  const buildId = String(Date.now());

  const js = await buildModules({
    modules,
    obfuscate: true,
    site: 'demo',
    comment: buildHeader(),
    demo: true,
  });

  process.stdout.write(buildResetPrelude(buildId));
  process.stdout.write(js);
  if (!js.endsWith('\n')) process.stdout.write('\n');
}

/**
 * Prelude injected before the main demo bundle.
 *
 * On every new build, the embedded buildId changes. When a visitor loads the
 * page after a fresh build, this snippet clears all widget-related localStorage
 * keys so the demo starts from a clean slate (no stuck cooldowns, seen-flags,
 * stored emails, applied coupons, etc.). Within a single build, state
 * persists normally between page loads.
 */
function buildResetPrelude(buildId: string): string {
  const bid = JSON.stringify(buildId);
  const builtAt = JSON.stringify(new Date().toISOString());
  const parts = [
    '(function(){try{',
    'var BID=' + bid + ';',
    'var BUILT=' + builtAt + ';',
    "console.log('%c[widgetality] demo bundle build='+BID+' builtAt='+BUILT,'background:#111827;color:#facc15;padding:2px 6px;border-radius:3px;font-weight:700');",
    "var KEY='wty_demo_build_id';",
    'if(localStorage.getItem(KEY)===BID)return;',
    "var P=['wty_','wdg_','wdg-','widgetis','interest:','stw_'];",
    'var del=[];',
    'for(var i=0;i<localStorage.length;i++){',
    'var k=localStorage.key(i);',
    'if(k&&P.some(function(p){return k.indexOf(p)===0;}))del.push(k);',
    '}',
    'del.forEach(function(k){localStorage.removeItem(k);});',
    'localStorage.setItem(KEY,BID);',
    "console.log('[widgetality] demo build changed, cleared '+del.length+' localStorage keys');",
    '}catch(e){}})();\n',
  ];
  return parts.join('');
}

function buildHeader(): string {
  const now = new Date();
  return [
    '/**',
    ' * Widgetis Demo Bundle',
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
