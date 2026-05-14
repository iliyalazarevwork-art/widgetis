import { readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { build, type InlineConfig, type Rollup } from 'vite';
import widgetalityPlugin, { type ModuleConfigs } from '@laxarevii/vite-plugin-widgetality';
import { createJiti } from 'jiti';

const _jiti = createJiti(import.meta.url);

export type { ModuleConfigs };

export type BuildRequest = {
  modules: ModuleConfigs;
  obfuscate?: boolean;
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

  for (const [moduleName, data] of Object.entries(request.modules)) {
    if (data.config.enabled) {
      // When i18n is empty the bundle falls back to its baked-in defaults at runtime.
      // Validate against the module's default i18n so schemas that require ≥1 language
      // don't reject an otherwise valid build request.
      const name = moduleName.startsWith('module-') ? moduleName : `module-${moduleName}`;
      const effectiveI18n = Object.keys(data.i18n).length === 0
        ? ((schemas[name]?.defaultI18n as Record<string, unknown>) ?? data.i18n)
        : data.i18n;
      await validateModule(moduleName, data.config, effectiveI18n);
    }
  }

  const modulesDir = resolve(process.cwd(), 'modules');
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

  if (request.obfuscate) {
    const { default: JavaScriptObfuscator } = await import('javascript-obfuscator');
    const obfuscated = JavaScriptObfuscator.obfuscate(code, {
      compact: true,
      controlFlowFlattening: false,
      deadCodeInjection: false,
      identifierNamesGenerator: 'hexadecimal',
      renameGlobals: false,
      stringArray: false,
      selfDefending: false,
      disableConsoleOutput: false,
      target: 'browser',
    });
    code = obfuscated.getObfuscatedCode();
  }

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

async function validateModule(
  moduleName: string,
  config: Record<string, unknown>,
  i18n: Record<string, unknown>,
): Promise<void> {
  let validate: ((...args: unknown[]) => void) | undefined;
  try {
    const schemaPath = resolve(process.cwd(), 'modules', moduleName, 'schema.ts');
    const schema = _jiti(schemaPath);
    validate = schema.validate;
  } catch {
    return;
  }

  if (typeof validate !== 'function') return;

  try {
    validate(config, i18n);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Validation failed for "${moduleName}": ${message}`);
  }
}
