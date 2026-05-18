import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { build, type InlineConfig, type Rollup } from 'vite';
import widgetalityPlugin, { type ModuleConfigs } from '@laxarevii/vite-plugin-widgetality';
import { createJiti } from 'jiti';

const _jiti = createJiti(import.meta.url);

export type { ModuleConfigs };

export type BuildRequest = {
  modules: ModuleConfigs;
  allowedDomain?: string;
  site?: string;
  comment?: string;
  /**
   * When true, the build resolves each module's entry to `demo.ts` if present
   * (otherwise falls back to `index.ts`). Demo entries scrape product data
   * from the live page DOM instead of calling the production API — used for
   * the public demo bundle injected by site-proxy on a merchant's own shop.
   */
  demo?: boolean;
};

const MODULES_ORDER = [
  'module-promo-line',
  'module-sticky-buy-button',
  'module-minorder-goal',
  'module-cart-goal',
  'module-progressive-discount',
  'module-delivery-date',
  'module-video-preview',
  'module-buyer-count',
  'module-stock-left',
  'module-one-plus-one',
  'module-photo-video-reviews',
  'module-sms-otp-checkout',
  'module-cart-recommender',
  'module-promo-auto-apply',
];

export function getAvailableModules(): string[] {
  const modulesDir = resolve(process.cwd(), 'modules');
  if (!existsSync(modulesDir)) return [];

  const all = readdirSync(modulesDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith('module-'))
    .map((e) => e.name);

  return [
    ...MODULES_ORDER.filter((m) => all.includes(m)),
    ...all.filter((m) => !MODULES_ORDER.includes(m)).sort(),
  ];
}

export async function getModuleSchemas(): Promise<
  Record<string, { config: unknown; i18n: unknown; defaultConfig?: unknown; defaultI18n?: unknown }>
> {
  const modules = getAvailableModules();
  const result: Record<string, { config: unknown; i18n: unknown; defaultConfig?: unknown; defaultI18n?: unknown }> = {};

  for (const moduleName of modules) {
    try {
      const schemaPath = resolve(process.cwd(), 'modules', moduleName, 'schema.ts');
      const schema = _jiti(schemaPath);
      if (typeof schema.getJsonSchema === 'function') {
        result[moduleName] = {
          ...schema.getJsonSchema(),
          defaultConfig: typeof schema.getDefaultConfig === 'function' ? schema.getDefaultConfig() : undefined,
          defaultI18n: typeof schema.getDefaultI18n === 'function' ? schema.getDefaultI18n() : undefined,
        };
      }
    } catch {
      // module schema not importable, skip
    }
  }

  return result;
}

export async function buildModules(request: BuildRequest): Promise<string> {
  // Fix PHP empty array serialization: PHP encodes {} as [] when the array is empty.
  // Top-level config and i18n are always objects — coerce before fixPhpNulls descends.
  // Inner array fields (palette, selectors, hideOnUtmSources…) are kept as-is.
  for (const data of Object.values(request.modules)) {
    if (Array.isArray(data.config)) data.config = {};
    if (Array.isArray(data.i18n)) data.i18n = {};
    data.config = fixPhpNulls(data.config) as Record<string, unknown>;
    data.i18n = fixPhpNulls(data.i18n) as Record<string, unknown>;
  }

  const schemas = await getModuleSchemas();

  // Pre-parse every module's config/i18n via Zod at build time. The parsed
  // (fully-defaulted) value is written back into request.modules, so the
  // virtual:widgetality-config:* modules emit a JSON literal with every
  // field already present. The runtime no longer needs Zod — saves ~50 KB
  // raw / ~12 KB after brotli in the production bundle.
  for (const [moduleName, data] of Object.entries(request.modules)) {
    const name = moduleName.startsWith('module-') ? moduleName : `module-${moduleName}`;
    const effectiveI18n = Object.keys(data.i18n).length === 0
      ? ((schemas[name]?.defaultI18n as Record<string, unknown>) ?? data.i18n)
      : data.i18n;
    const parsed = await parseModule(moduleName, data.config, effectiveI18n);
    if (parsed) {
      data.config = parsed.config;
      data.i18n = parsed.i18n;
    }
  }

  // Read the `pages` export from each module's index.ts and attach it to
  // request.modules so vite-plugin-widgetality can emit per-page guards.
  // We parse the source via regex (not jiti) because several modules touch
  // `window` at module top-level — that's fine at runtime (we wrap the IIFE
  // until `load`) but blows up under Node where `window` is undefined.
  const modulesDir = resolve(process.cwd(), 'modules');
  for (const moduleName of Object.keys(request.modules)) {
    const name = moduleName.startsWith('module-') ? moduleName : `module-${moduleName}`;
    const indexPath = resolve(modulesDir, name, 'index.ts');
    if (!existsSync(indexPath)) continue;
    try {
      const src = readFileSync(indexPath, 'utf8');
      const pages = extractPagesFromSource(src);
      if (pages !== undefined) {
        (request.modules[moduleName] as Record<string, unknown>).pages = pages;
      }
    } catch {
      // unreadable — skip
    }
  }

  const _require = createRequire(import.meta.url);
  const moduleAliases: Record<string, string> = {
    '@laxarevii/core': _require.resolve('@laxarevii/core'),
  };
  for (const moduleName of getAvailableModules()) {
    const demoEntry = resolve(modulesDir, moduleName, 'demo.ts');
    const prodEntry = resolve(modulesDir, moduleName, 'index.ts');
    moduleAliases[`@laxarevii/${moduleName}`] =
      request.demo === true && existsSync(demoEntry) ? demoEntry : prodEntry;
  }

  const viteConfig: InlineConfig = {
    configFile: false,
    root: resolve(process.cwd()),
    resolve: { alias: moduleAliases },
    plugins: [
      widgetalityPlugin({
        site: 'widget-builder',
        modules: request.modules,
        master: request.master === true,
      }),
      {
        name: 'resolve-workspace-deps',
        resolveId(id) {
          if (!id.startsWith('.') && !id.startsWith('/') && !id.startsWith('\0')) {
            try { return _require.resolve(id); } catch { return null; }
          }
        },
      },
    ],
    build: {
      write: false,
      rollupOptions: {
        input: 'virtual:widgetality-entry',
        output: {
          format: 'iife',
          entryFileNames: 'production.js',
        },
      },
    },
    logLevel: 'silent',
  };

  const result = await build(viteConfig);

  if (!('output' in result)) {
    throw new Error('Build failed: no output');
  }

  const output = Array.isArray(result) ? result[0] : result;
  const chunk = output.output.find(
    (o: Rollup.OutputChunk | Rollup.OutputAsset) => o.type === 'chunk' && o.isEntry,
  );

  if (!chunk || chunk.type !== 'chunk') {
    throw new Error('Build failed: no entry chunk');
  }

  let code = chunk.code;

  if (request.allowedDomain) {
    const d = request.allowedDomain;
    // Encode domain as char codes so the hostname is not plainly visible in the bundle
    const charCodes = Array.from(d).map((c) => c.charCodeAt(0)).join(',');
    const checkSnippet = `(function(){var _d=String.fromCharCode(${charCodes});var _h=window.location.hostname;if(_h!==_d&&!_h.endsWith('.'+_d))throw new Error();}());`;
    // Inject right after the IIFE preamble. We used to splice at the
    // first `;` before the bundle midpoint to make the guard harder to
    // strip, but `;` also appears inside `for(;;)` headers and template
    // literals — when the cut lands inside an expression the obfuscator
    // gets syntactically broken JS and refuses the whole bundle. The
    // snippet is its own IIFE, so it stays self-contained no matter
    // where we drop it.
    const preamble = "'use strict';";
    const idx = code.indexOf(preamble);
    const insertAt = idx >= 0 ? idx + preamble.length : 0;
    code = code.slice(0, insertAt) + checkSnippet + code.slice(insertAt);
  }

  // Defer the main IIFE until the page's `load` event so widget init does not
  // compete with LCP image/critical scripts on Slow 4G. Saves ~2-3s LCP for
  // bundles around 1 MB. The body of the bundle is an IIFE — wrapping it in a
  // named function turns auto-execution into deferred-on-demand execution.
  code = `function __wgts_init(){\n${code}\n}\nif(document.readyState==='complete')__wgts_init();else addEventListener('load',__wgts_init);`;

  const comment = request.comment ?? buildAutoComment(request.allowedDomain ?? request.site);
  code = comment + '\n' + code;

  return code;
}

function buildAutoComment(domain?: string): string {
  const now = new Date();
  const built = now.toUTCString();
  const version = now.toISOString().replace('T', ' ').slice(0, 19);
  const lines = [
    '/**',
    ' * Widgetis — Widget Platform for E-Commerce',
    domain ? ` * Site:     ${domain}` : null,
    ` * Version:  ${version}`,
    ` * Built:    ${built}`,
    ' * ',
    ' * https://widgetis.com',
    ' * https://t.me/widgetis',
    ' * ',
    ' * LICENSE: Proprietary and Confidential.',
    ' * This code is the exclusive intellectual property of Widgetis.',
    ' * Unauthorized copying, decompilation, modification, distribution',
    ' * or reuse of this code, in whole or in part, is strictly prohibited.',
    ` * © ${new Date().getFullYear()} Widgetis. All rights reserved.`,
    ' * https://widgetis.com/license',
    ' * ',
    ' * Protected under Ukrainian law:',
    ' *   Закон №2811-IX «Про авторське право і суміжні права»',
    ' *   zakon.rada.gov.ua/laws/show/2811-20',
    ' *   Ст. 176 КК України — кримінальна відповідальність',
    ' *   Ст. 432 ЦК України — цивільний захист у суді',
    ' */',
  ].filter(Boolean);
  return lines.join('\n');
}

/**
 * Fix PHP JSON serialization quirks:
 * - nullable DB columns produce null instead of "" — breaks Zod z.string()
 */
function fixPhpNulls(value: unknown): unknown {
  if (value === null) return '';
  if (Array.isArray(value)) {
    return value.map(fixPhpNulls);
  }
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = fixPhpNulls(v);
    }
    return result;
  }
  return value;
}

/**
 * Statically extract the `pages` export from a module's index.ts source.
 * Matches:
 *   export const pages: PageType[] = ['product', 'cart'];
 *   export const pages = 'all';
 *   export const pages: PageType[] | 'all' = 'all' as const;
 * Returns the parsed value, or undefined when the export is absent.
 */
function extractPagesFromSource(src: string): string[] | 'all' | undefined {
  const m = src.match(/export\s+const\s+pages\s*(?::[^=]+)?=\s*([^;]+);/);
  if (!m) return undefined;
  const rhs = m[1].trim().replace(/\s+as\s+const\s*$/, '').trim();
  if (rhs === "'all'" || rhs === '"all"') return 'all';
  const arr = rhs.match(/^\[(.*)\]$/);
  if (!arr) return undefined;
  const inner = arr[1].trim();
  if (inner === '') return [];
  const items = inner
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter((s) => s.length > 0);
  return items;
}

async function parseModule(
  moduleName: string,
  config: Record<string, unknown>,
  i18n: Record<string, unknown>,
): Promise<{ config: Record<string, unknown>; i18n: Record<string, unknown> } | null> {
  let parse: ((c: unknown, i: unknown) => { config: unknown; i18n: unknown }) | undefined;
  try {
    const name = moduleName.startsWith('module-') ? moduleName : `module-${moduleName}`;
    const schemaPath = resolve(process.cwd(), 'modules', name, 'schema.ts');
    const schema = _jiti(schemaPath);
    parse = schema.parse;
  } catch {
    return null;
  }

  if (typeof parse !== 'function') return null;

  try {
    const result = parse(config, i18n);
    return {
      config: result.config as Record<string, unknown>,
      i18n: result.i18n as Record<string, unknown>,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Validation failed for "${moduleName}": ${message}`);
  }
}
