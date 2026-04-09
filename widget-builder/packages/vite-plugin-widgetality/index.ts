import type { Plugin } from 'vite';

const VIRTUAL_MODULE_ID = 'virtual:widgetality-entry';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

export type ModuleConfigs = Record<
  string,
  { config: Record<string, unknown>; i18n: Record<string, unknown> }
>;

export default function widgetalityPlugin(options: { site: string; modules: ModuleConfigs }): Plugin {
  const { site, modules } = options;

  return {
    name: 'vite-plugin-widgetality',

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
      if (id.startsWith('virtual:widgetality-config:')) {
        return '\0' + id;
      }
    },

    generateBundle() {},

    load(id) {
      if (id.startsWith('\0virtual:widgetality-config:')) {
        const key = id.replace('\0virtual:widgetality-config:', '');
        const [moduleName, type] = key.split(':');
        const data = modules[moduleName];
        if (!data) return 'export default {};';
        const json = type === 'i18n' ? data.i18n : data.config;
        return `export default ${JSON.stringify(json ?? {})};`;
      }

      if (id !== RESOLVED_VIRTUAL_MODULE_ID) return;

      return generateEntry(modules);
    },
  };
}

// ---------------------------------------------------------------------------
// Single entry codegen
// ---------------------------------------------------------------------------

function generateEntry(modules: ModuleConfigs): string {
  const imports: string[] = [];
  const calls: string[] = [];

  let idx = 0;
  for (const [moduleName, data] of Object.entries(modules)) {
    if (!data.config.enabled) continue;

    const safeVar = moduleName.replace(/-/g, '_').replace(/^module_/, '');

    imports.push(`import ${safeVar} from '@laxarevii/${moduleName}';`);
    imports.push(`import ${safeVar}Config from 'virtual:widgetality-config:${moduleName}:config';`);
    imports.push(`import ${safeVar}I18n from 'virtual:widgetality-config:${moduleName}:i18n';`);

    calls.push(
      `try { const __d${idx} = ${safeVar}(${safeVar}Config, ${safeVar}I18n); if (typeof __d${idx} === 'function') __destroyers.push(__d${idx}); }` +
      ` catch (err) { console.error('[widgetality] ${moduleName}: ❌ error:', err); }`,
    );
    idx++;
  }

  const destroyBlock = [
    '',
    'window.__widgetality_destroy = function() {',
    '  for (const fn of __destroyers) { try { fn(); } catch(e) { console.error("[widgetality] destroy error:", e); } }',
    '  __destroyers.length = 0;',
    '};',
  ];

  return [...imports, '', 'const __destroyers = [];', '', ...calls, ...destroyBlock].join('\n');
}
