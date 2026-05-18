// Module loader — reads URL params and activates the specified widget module.
//
// Defaults: production passes already-Zod-parsed configs to runtime modules
// (parsing happens build-time in widget-builder/index.ts → parseModule).
// To mirror that we merge schema.getDefaultConfig() under the test's config
// so partial test configs still see all defaults. We do NOT call schema.parse()
// here — many existing fixture specs pass shorthand values (e.g.
// positionDesktop: 'bottom-right') that wouldn't pass strict validation.
const params = new URLSearchParams(location.search);
const moduleName = params.get('module');

if (moduleName) {
  (async () => {
    try {
      const mod = await import(/* @vite-ignore */ `/modules/${moduleName}/index.ts`);
      const schema = await import(/* @vite-ignore */ `/modules/${moduleName}/schema.ts`);

      const rawConfig = params.get('config') ? JSON.parse(params.get('config')!) : {};
      const rawI18n = params.get('i18n') ? JSON.parse(params.get('i18n')!) : {};

      const defaultConfig =
        typeof schema.getDefaultConfig === 'function' ? schema.getDefaultConfig() : {};
      const defaultI18n =
        typeof schema.getDefaultI18n === 'function' ? schema.getDefaultI18n() : {};

      const config = { ...defaultConfig, ...rawConfig };
      const i18n = Object.keys(rawI18n).length === 0 ? defaultI18n : rawI18n;

      const cleanup = mod.default(config, i18n);

      (window as any).__widgetCleanup = typeof cleanup === 'function' ? cleanup : null;
      (window as any).__widgetLoaded = true;
      document.dispatchEvent(new CustomEvent('widget:loaded'));
      console.log(`[fixture] ${moduleName} ✅ loaded`);
    } catch (err) {
      console.error(`[fixture] ${moduleName} ❌ failed:`, err);
      (window as any).__widgetError = String(err);
      document.dispatchEvent(new CustomEvent('widget:error'));
    }
  })();
}
