import { X, Check, Zap } from 'lucide-react'
import { useFoundingRemaining } from '../hooks/useFoundingRemaining'
import { FOUNDING_PRICE_MONTHLY } from '../data/plans'
import './FreePlanSaveModal.css'

export type FreePlanSaveModalContext =
  | 'choose_free'
  | 'trial_expired_pro'
  | 'trial_expired_max'
  | 'cancel_pro'
  | 'cancel_max'

export interface FreePlanSaveModalProps {
  open: boolean
  onClose: () => void
  /** User confirmed they want Free despite the upsell. */
  onConfirmFree: () => void
  /** User chose Pro from inside the modal. */
  onChoosePro: () => void
  context: FreePlanSaveModalContext
}

const CONTEXT_COPY: Record<
  FreePlanSaveModalContext,
  { title: string; subtitle?: string }
> = {
  choose_free: {
    title: 'Точно перейти на Free?',
  },
  trial_expired_pro: {
    title: 'Триал Pro закінчився.',
    subtitle: 'Лишишся на Pro чи перейдеш у Free?',
  },
  trial_expired_max: {
    title: 'Триал Max закінчився.',
    subtitle: 'Не йди одразу у Free — Pro збереже основні віджети.',
  },
  cancel_pro: {
    title: 'Точно скасовуєш Pro?',
  },
  cancel_max: {
    title: 'Не йди одразу у Free —',
    subtitle: 'лишишся на Pro 499 ₴?',
  },
}

const FREE_LOSSES = [
  'Тільки 1 сайт',
  'Ліміти на кожному віджеті',
  'Тільки українська мова',
  'Без EN-перекладу',
]

const PRO_GAINS = [
  '3 сайти',
  '11 віджетів без лімітів',
  'uk + en',
  'Telegram-підтримка',
]

/**
 * Upsell modal shown when a user is about to drop to Free.
 * Pitches Pro only — never Max.
 *
 * Trigger points (wire externally):
 *  1. Click "Free" on PricingPage — context='choose_free' (wired)
 *  2. Trial expired (Pro) — context='trial_expired_pro'
 *  3. Trial expired (Max) — context='trial_expired_max'
 *  4. Cancel Pro subscription — context='cancel_pro'
 *  5. Cancel Max subscription — context='cancel_max'
 */
export function FreePlanSaveModal({
  open,
  onClose,
  onConfirmFree,
  onChoosePro,
  context,
}: FreePlanSaveModalProps) {
  const founding = useFoundingRemaining()

  if (!open) return null

  const { title, subtitle } = CONTEXT_COPY[context]
  const foundingActive = founding != null && founding.remaining > 0
  const proPrice = foundingActive ? founding!.locked_price_monthly : FOUNDING_PRICE_MONTHLY
  const normalPrice = 499

  const handleOverlayClick = () => onClose()
  const stopProp = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <div className="fsm__overlay" onClick={handleOverlayClick}>
      <div className="fsm" onClick={stopProp} role="dialog" aria-modal="true" aria-label={title}>
        <button className="fsm__close" onClick={onClose} aria-label="Закрити">
          <X size={18} strokeWidth={2} />
        </button>

        {/* Header */}
        <h2 className="fsm__title">{title}</h2>
        {subtitle && <p className="fsm__subtitle">{subtitle}</p>}

        {/* Free losses */}
        <p className="fsm__losses-label">На Free тебе чекає:</p>
        <ul className="fsm__losses">
          {FREE_LOSSES.map((item) => (
            <li key={item} className="fsm__loss">{item}</li>
          ))}
        </ul>

        <hr className="fsm__divider" />

        {/* Pro gains */}
        <p className="fsm__gains-label">Pro знімає всі обмеження:</p>
        <ul className="fsm__gains">
          {PRO_GAINS.map((item) => (
            <li key={item} className="fsm__gain">
              <Check size={14} strokeWidth={2.5} className="fsm__gain-check" />
              {item}
            </li>
          ))}
        </ul>

        {/* Founding offer block */}
        {foundingActive && founding != null && (
          <div className="fsm__founding">
            <p className="fsm__founding-title">
              <Zap size={14} strokeWidth={2.5} />
              Перші {founding.total} — {proPrice} ₴ замість {normalPrice} ₴
            </p>
            <p className="fsm__founding-remaining">
              Лишилось {founding.remaining} з {founding.total}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="fsm__actions">
          <button className="fsm__btn-secondary" onClick={onConfirmFree}>
            Все одно Free
          </button>
          <button className="fsm__btn-primary" onClick={onChoosePro}>
            <Zap size={16} strokeWidth={2.5} />
            Обрати Pro{' '}
            {foundingActive ? (
              <>
                {proPrice} ₴{' '}
                <span className="fsm__price-strike">{normalPrice} ₴</span>
              </>
            ) : (
              <>{normalPrice} ₴</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
