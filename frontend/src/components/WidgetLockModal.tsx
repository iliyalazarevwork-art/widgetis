import './WidgetLockModal.css'

export interface WidgetLockModalProps {
  open: boolean
  /** Slug of the locked widget (for display or analytics). */
  widgetSlug: string
  onClose: () => void
  onUpgrade: () => void
}

/**
 * Modal shown when a Pro user tries to enable a Max-only widget.
 * Wire: check widgetSlug against MAX_ONLY_WIDGETS before enabling.
 */
export function WidgetLockModal({
  open,
  onClose,
  onUpgrade,
}: WidgetLockModalProps) {
  if (!open) return null

  return (
    <div className="wlm__overlay" onClick={onClose}>
      <div
        className="wlm"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Цей віджет доступний на Max"
      >
        <div className="wlm__icon" aria-hidden="true">🔒</div>
        <h2 className="wlm__title">Цей віджет доступний на Max</h2>
        <p className="wlm__desc">
          <strong>+9 преміум-віджетів</strong> за <strong>+200 ₴/міс</strong> —<br />
          AI-рекомендації, колесо фортуни, SMS та інші потужні інструменти.
        </p>
        <div className="wlm__actions">
          <button className="wlm__btn-upgrade" onClick={onUpgrade}>
            Перейти на Max
          </button>
          <button className="wlm__btn-close" onClick={onClose}>
            Закрити
          </button>
        </div>
      </div>
    </div>
  )
}
