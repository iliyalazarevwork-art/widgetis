const MAX_UPSELL_LS_KEY = 'wty_max_upsell_dismissed_until'
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export function shouldShowMaxUpsellBanner(): boolean {
  try {
    const raw = localStorage.getItem(MAX_UPSELL_LS_KEY)
    if (!raw) return true
    const until = parseInt(raw, 10)
    return Date.now() > until
  } catch {
    return true
  }
}

export function dismissMaxUpsellBanner(): void {
  try {
    localStorage.setItem(MAX_UPSELL_LS_KEY, String(Date.now() + DISMISS_TTL_MS))
  } catch {
    // Ignore localStorage failures such as quota or private mode restrictions.
  }
}
