# `window.__WIDGETIS_CFG__` — per-session config contract

## What this is

The shape of the **inline configuration object** that `site-proxy` injects into
the merchant page right before the demo bundle runs. It lets a single shared
`demo-bundle.js` produce a different demo for every visitor based on the demo
session code (`/live-demo?code=XXX`).

## Producers and consumers

| Side | What it does |
|---|---|
| **Backend** (`POST /api/v1/admin/demo-sessions`, `GET /api/v1/demo-sessions/{code}/config`) | Stores the config in `wgt_demo_sessions.config`, exposes it on a public read endpoint for site-proxy. |
| **site-proxy** (`services/site-proxy/server.mjs`) | When the iframe URL contains `?demo_code=XXX`, fetches the config from the backend, embeds it as `<script>window.__WIDGETIS_CFG__ = {...}</script>` immediately before the demo bundle script tag. |
| **vite-plugin-widgetality** entry generator | At runtime, every module's init wrapper reads `window.__WIDGETIS_CFG__.modules[name]` and either skips the module (`is_enabled: false`) or deep-merges per-session config/i18n on top of the baked-in defaults. |
| **Site-configurator agent** (`.claude/agents/site-configurator.md`) | Produces the `config` payload by analyzing the merchant's site (HTML + screenshot). |

## Shape

```ts
window.__WIDGETIS_CFG__ = {
  // Identifies the session — for diagnostics and analytics only.
  demo_code: string,

  // Optional. Brand-level hints derived from the merchant's logo / primary
  // buttons. Modules that opt in to brand colors will pick these up; modules
  // with hardcoded palettes ignore them.
  brand?: {
    primary_color?: string,   // hex, e.g. "#E91E63"
    accent_color?: string,    // hex
    text_color?: string       // hex, optional override for body text
  },

  // Per-module overrides. Whitelist semantics: if a module is missing from
  // this map, the bundle uses its baked-in defaults (current behaviour).
  modules: {
    [moduleSlug: string]: {
      is_enabled: boolean,    // false → module init is skipped entirely

      // Deep-merged on top of the module's baked-in `config`. Anything not
      // overridden keeps its default value. Use to override colors, texts,
      // selectors, thresholds, etc. on a per-merchant basis.
      config?: Record<string, unknown>,

      // Deep-merged on top of the module's baked-in `i18n`. Use to replace
      // texts with merchant-specific copy (e.g. niche-aware phrasing in
      // Ukrainian).
      i18n?: Record<string, unknown>
    }
  }
};
```

## Module slugs

Slugs match the `widget-builder/modules/module-{slug}/` directory name with the
`module-` prefix dropped. So `cart-goal`, `sticky-buy-button`, `promo-line`,
`photo-video-reviews`, `sms-otp-checkout`, `trust-badges`, `spin-the-wheel`,
`last-chance-popup`, `progressive-discount`, `phone-mask`, `video-preview`,
`stock-left`, `cart-recommender`, `delivery-date`, `buyer-count`,
`minorder-goal`, `one-plus-one`, `prize-banner`, `promo-auto-apply`.

## Whitelist semantics

`__WIDGETIS_CFG__.modules` is a **whitelist with explicit disables**:

- A slug present with `is_enabled: true` runs (with merged overrides).
- A slug present with `is_enabled: false` is skipped entirely — no DOM, no
  network calls.
- A slug missing from the map runs with its baked-in defaults — the same
  behaviour as a vanilla demo without `?demo_code`.

The agent's job is therefore to produce a map that:

1. Disables modules the merchant already has on their site (`is_enabled: false`).
2. Enables and tunes the modules that fit the niche.
3. Leaves everything else implicit so the bundle's defaults apply.

## Example payload

```json
{
  "demo_code": "8V5BJ4",
  "brand": {
    "primary_color": "#E91E63",
    "accent_color": "#212121"
  },
  "modules": {
    "promo-line":       { "is_enabled": false },
    "cart-goal": {
      "is_enabled": true,
      "config": { "threshold": 1500 },
      "i18n": { "ua": { "text": "До безкоштовної доставки залишилось" } }
    },
    "sticky-buy-button": { "is_enabled": true },
    "photo-video-reviews": { "is_enabled": true },
    "spin-the-wheel":    { "is_enabled": false },
    "last-chance-popup": { "is_enabled": false }
  }
}
```

## When the global is absent

The global is absent on plain `/site/{domain}/` requests without
`?demo_code=XXX`. The bundle must function unchanged in that case — every
module runs with its baked-in defaults. This is what keeps the
no-`demo_code` flow byte-identical to the historical behaviour.

## Where to find the runtime check

The merge logic lives inside the entry generator at
`widget-builder/packages/vite-plugin-widgetality/index.ts`. It is emitted into
the bundle once per module init site, alongside a small `__mergeDeep` helper
shared by all modules in the bundle.
