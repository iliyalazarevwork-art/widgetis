/**
 * Central host map for E2E tests.
 *
 * Single source of truth for "which origin serves what". To rebrand,
 * point at staging, or change a subdomain, edit this file (or override
 * via env) and every test follows.
 *
 * Resolution order:
 *   1. Explicit env vars (E2E_*_URL) win when set.
 *   2. Otherwise: if E2E_BASE_URL points at a deployed environment, the
 *      sibling subdomains (api, preview, manage) are derived from it.
 *   3. Otherwise (local): everything goes through the Vite dev server,
 *      which proxies /api to the local backend.
 */

export type HostMap = {
  /** SPA origin — React frontend. */
  spa: string
  /** JSON API origin — Laravel backend (also serves OAuth + payment callbacks). */
  api: string
  /** Live-site demo proxy (Node). */
  preview: string
  /** Filament admin panel. */
  manage: string
}

const LOCAL_VITE = 'http://127.0.0.1:5173'

function deriveSubdomain(spa: string, sub: string): string {
  const u = new URL(spa)
  const apex = u.host.replace(/^www\./i, '')
  return `${u.protocol}//${sub}.${apex}`
}

export function hosts(): HostMap {
  const spaEnv = process.env.E2E_BASE_URL?.replace(/\/+$/, '')

  // Local mode — Vite proxies /api → backend, so SPA + API share an origin.
  if (!spaEnv) {
    return { spa: LOCAL_VITE, api: LOCAL_VITE, preview: LOCAL_VITE, manage: LOCAL_VITE }
  }

  return {
    spa: spaEnv,
    api: process.env.E2E_API_BASE_URL?.replace(/\/+$/, '') ?? deriveSubdomain(spaEnv, 'api'),
    preview: process.env.E2E_PREVIEW_BASE_URL?.replace(/\/+$/, '') ?? deriveSubdomain(spaEnv, 'preview'),
    manage: process.env.E2E_MANAGE_BASE_URL?.replace(/\/+$/, '') ?? deriveSubdomain(spaEnv, 'manage'),
  }
}

/** True when SPA and API live on different origins (i.e. deployed env). */
export function hasSeparateApiHost(): boolean {
  const h = hosts()
  return h.spa !== h.api
}
