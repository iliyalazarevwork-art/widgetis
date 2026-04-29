/**
 * Demo entry for module-phone-mask.
 *
 * Production module optionally calls a public GeoIP endpoint
 * (default: https://ipapi.co/json/) to auto-pick the visitor's country.
 * On demo we replace that with a deterministic UA response so the picker
 * always lands on Ukraine — regardless of where the demo is viewed from
 * and irrespective of any rate-limits / CORS quirks of the real service.
 *
 * The shim only activates when the URL looks like a geoip endpoint
 * (matches the configured `geoipUrl` or contains `ipapi`/`geoip`/`country`).
 * Any other fetch is passed through untouched.
 */
import phoneMask from './index';

const LOG = '[widgetality] phone-mask (demo):';
const GEOIP_HINTS = ['ipapi.co', 'ipinfo.io', 'geoip', '/country', 'ip-api.com'];

function looksLikeGeoip(url: string, configuredUrl: string | undefined): boolean {
  if (configuredUrl && url.startsWith(configuredUrl)) return true;
  return GEOIP_HINTS.some((h) => url.includes(h));
}

function shimFetch(configuredGeoipUrl: string | undefined): void {
  const original = window.fetch;
  if (!original) return;

  window.fetch = function patched(input: RequestInfo | URL, init?: RequestInit) {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request)?.url ?? '';

    if (looksLikeGeoip(url, configuredGeoipUrl)) {
      console.log(LOG, 'shimmed geoip request →', url, '→ UA');
      return Promise.resolve(
        new Response(
          JSON.stringify({ country_code: 'UA', country: 'UA', country_name: 'Ukraine' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    }

    return original.call(window, input as RequestInfo, init);
  } as typeof window.fetch;
}

const phoneMaskDemo: typeof phoneMask = (config, i18n) => {
  console.log(LOG, 'init — shimming geoip endpoint');
  const url =
    config && typeof (config as { geoipUrl?: unknown }).geoipUrl === 'string'
      ? (config as { geoipUrl: string }).geoipUrl
      : undefined;
  shimFetch(url);
  return phoneMask(config, i18n);
};

export default phoneMaskDemo;
