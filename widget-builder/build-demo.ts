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
import { buildModules, type ModuleConfigs } from './index.js';

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

async function main(): Promise<void> {
  const { modules } = loadConfig();

  if (Object.keys(modules).length === 0) {
    throw new Error('demo-config.json contains zero modules');
  }

  const js = await buildModules({
    modules,
    obfuscate: true,
    site: 'demo',
    comment: buildHeader(),
  });

  process.stdout.write(js);
  if (!js.endsWith('\n')) process.stdout.write('\n');
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
