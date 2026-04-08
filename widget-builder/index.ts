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
};

const MODULES_ORDER = [
  'module-marquee',
  'module-min-order',
  'module-cart-goal',
  'module-delivery-date',
  'module-product-video-preview',
  'module-social-proof',
  'module-one-plus-one',
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
  // Fix PHP empty array serialization: [] → {} for z.record() compatibility
  for (const data of Object.values(request.modules)) {
    data.config = fixPhpNulls(data.config) as Record<string, unknown>;
    data.i18n = fixPhpNulls(data.i18n) as Record<string, unknown>;
  }

  for (const [moduleName, data] of Object.entries(request.modules)) {
    if (data.config.enabled) {
      await validateModule(moduleName, data.config, data.i18n);
    }
  }

  const modulesDir = resolve(process.cwd(), 'modules');
  const _require = createRequire(import.meta.url);
  const moduleAliases: Record<string, string> = {
    '@laxarevii/core': _require.resolve('@laxarevii/core'),
  };
  for (const moduleName of getAvailableModules()) {
    moduleAliases[`@laxarevii/${moduleName}`] = resolve(modulesDir, moduleName, 'index.ts');
  }

  const viteConfig: InlineConfig = {
    configFile: false,
    root: resolve(process.cwd()),
    resolve: { alias: moduleAliases },
    plugins: [
      widgetalityPlugin({ site: 'widget-builder', modules: request.modules }),
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
    code = `(function(){var _h=window.location.hostname;if(_h!=="${d}"&&!_h.endsWith(".${d}"))return;${code}})();`;
  }

  if (request.obfuscate) {
    const { default: JavaScriptObfuscator } = await import('javascript-obfuscator');
    const obfuscated = JavaScriptObfuscator.obfuscate(code, {
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.5,
      deadCodeInjection: false,
      stringArray: true,
      stringArrayThreshold: 0.5,
      stringArrayEncoding: ['base64'],
      selfDefending: false,
      disableConsoleOutput: false,
    });
    code = obfuscated.getObfuscatedCode();
  }

  return code;
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
