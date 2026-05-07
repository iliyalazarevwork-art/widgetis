// Module loader — reads URL params and activates the specified widget module
const params = new URLSearchParams(location.search);
const moduleName = params.get('module');

if (moduleName) {
  (async () => {
    try {
      // Absolute path from Vite root (widget-builder/)
      const mod = await import(/* @vite-ignore */ `/modules/${moduleName}/index.ts`);
      const config = params.get('config') ? JSON.parse(params.get('config')!) : {};
      const i18n = params.get('i18n') ? JSON.parse(params.get('i18n')!) : {};

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
