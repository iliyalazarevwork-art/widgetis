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

/**
 * Slug used by the per-session config (window.__WIDGETIS_CFG__.modules[slug]):
 * the directory name `module-foo-bar` exposed to the agent and the API as
 * `foo-bar`. Keep this in sync with docs/agent-config-contract.md.
 */
function configSlugFor(moduleName: string): string {
  return moduleName.replace(/^module-/, '');
}

/**
 * Helper emitted once per bundle. Deep-merges the per-session override over
 * the baked-in default config/i18n. Arrays are replaced wholesale (the
 * common case is "swap the entire palette" or "swap segments"), objects
 * are merged key-by-key.
 */
const MERGE_DEEP_HELPER = [
  'function __wgtsMergeDeep(target, source) {',
  '  if (source === undefined || source === null) return target;',
  '  if (typeof source !== "object") return source;',
  '  if (Array.isArray(source)) return source;',
  '  var out = (target && typeof target === "object" && !Array.isArray(target)) ? Object.assign({}, target) : {};',
  '  for (var k in source) {',
  '    if (!Object.prototype.hasOwnProperty.call(source, k)) continue;',
  '    var sv = source[k];',
  '    var tv = out[k];',
  '    if (sv && typeof sv === "object" && !Array.isArray(sv) && tv && typeof tv === "object" && !Array.isArray(tv)) {',
  '      out[k] = __wgtsMergeDeep(tv, sv);',
  '    } else if (sv !== undefined) {',
  '      out[k] = sv;',
  '    }',
  '  }',
  '  return out;',
  '}',
].join('\n');

function generateEntry(modules: ModuleConfigs): string {
  const imports: string[] = [];
  const calls: string[] = [];

  let idx = 0;
  for (const [moduleName, data] of Object.entries(modules)) {
    if (!data.config.enabled) continue;

    const safeVar = moduleName.replace(/-/g, '_').replace(/^module_/, '');
    const slug = configSlugFor(moduleName);
    const slugLit = JSON.stringify(slug);

    imports.push(`import ${safeVar} from '@laxarevii/${moduleName}';`);
    imports.push(`import ${safeVar}Config from 'virtual:widgetality-config:${moduleName}:config';`);
    imports.push(`import ${safeVar}I18n from 'virtual:widgetality-config:${moduleName}:i18n';`);

    // Per-module init wrapper:
    //   1. Read window.__WIDGETIS_CFG__.modules[slug] (may be missing).
    //   2. Whitelist mode activates only when demo_code is present AND modules
    //      is a non-empty object (admin-crafted session). A public session has
    //      modules:{} — that means "show everything with defaults", not "hide all".
    //   3. If is_enabled === false, skip the module entirely.
    //   4. Otherwise deep-merge config/i18n overrides over the baked-in defaults.
    // When __WIDGETIS_CFG__ is absent or modules is empty, the path collapses
    // to the original baked-in behaviour with no overrides.
    calls.push(
      [
        'try {',
        `  var __mods${idx} = (typeof window !== "undefined" && window.__WIDGETIS_CFG__ && window.__WIDGETIS_CFG__.modules) ? window.__WIDGETIS_CFG__.modules : null;`,
        `  var __hasWhitelist${idx} = !!(__mods${idx} && Object.keys(__mods${idx}).length > 0);`,
        `  var __ov${idx} = __mods${idx} ? __mods${idx}[${slugLit}] : null;`,
        `  if (__hasWhitelist${idx} && !__ov${idx}) {`,
        `    console.log('[widgetality] ${moduleName}: skipped — not present in per-session config');`,
        `  } else if (__ov${idx} && __ov${idx}.is_enabled === false) {`,
        `    console.log('[widgetality] ${moduleName}: skipped by per-session config');`,
        '  } else {',
        `    var __cfg${idx} = (__ov${idx} && __ov${idx}.config) ? __wgtsMergeDeep(${safeVar}Config, __ov${idx}.config) : ${safeVar}Config;`,
        `    var __i18n${idx} = (__ov${idx} && __ov${idx}.i18n) ? __wgtsMergeDeep(${safeVar}I18n, __ov${idx}.i18n) : ${safeVar}I18n;`,
        `    var __d${idx} = ${safeVar}(__cfg${idx}, __i18n${idx});`,
        `    if (typeof __d${idx} === 'function') __destroyers.push(__d${idx});`,
        '  }',
        `} catch (err) { console.error('[widgetality] ${moduleName}: ❌ error:', err); }`,
      ].join('\n'),
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

  return [
    ...imports,
    '',
    MERGE_DEEP_HELPER,
    '',
    'const __destroyers = [];',
    '',
    ...calls,
    ...destroyBlock,
  ].join('\n');
}
