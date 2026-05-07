import { X, ArrowRight } from 'lucide-react'
import './MaxUpsellBanner.css'

const MAX_UPSELL_LS_KEY = 'wty_max_upsell_dismissed_until'
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/** Returns true if the banner should be shown (not dismissed or TTL expired). */
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

/** Persist dismissal for 7 days. */
export function dismissMaxUpsellBanner(): void {
  try {
    localStorage.setItem(MAX_UPSELL_LS_KEY, String(Date.now() + DISMISS_TTL_MS))
  } catch { /* quota */ }
}

export interface MaxUpsellBannerProps {
  onUpgradeClick: () => void
  onDismiss: () => void
  className?: string
}

/**
 * Banner shown to Pro users to upsell them to Max.
 * Render only when current plan slug === 'pro'.
 * Dismissal persists in localStorage for 7 days (key: wty_max_upsell_dismissed_until).
 */
export function MaxUpsellBanner({
  onUpgradeClick,
  onDismiss,
  className,
}: MaxUpsellBannerProps) {
  return (
    <div className={`max-upsell${className ? ` ${className}` : ''}`}>
      <div className="max-upsell__icon" aria-hidden="true">⚡</div>
      <div className="max-upsell__body">
        <p className="max-upsell__title">Розблокуй ще 9 преміум-віджетів</p>
        <p className="max-upsell__desc">
          AI-рекомендації, колесо фортуни, SMS, exit-popup і ще 5 мощних інструментів
        </p>
        <p className="max-upsell__price-line">
          Лише <span className="max-upsell__price-accent">+200 ₴/міс</span> понад твій Pro
        </p>
        <button className="max-upsell__cta" onClick={onUpgradeClick}>
          Перейти на Max за 699 ₴
          <ArrowRight size={14} strokeWidth={2.5} />
        </button>
      </div>
      <button
        className="max-upsell__dismiss"
        onClick={onDismiss}
        aria-label="Закрити банер"
      >
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  )
}
