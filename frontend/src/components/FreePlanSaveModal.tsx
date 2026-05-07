import { X, Zap, Check, XCircle } from 'lucide-react'
import { useFoundingRemaining } from '../hooks/useFoundingRemaining'
import { usePlansWithSlugs } from '../hooks/useWidgets'
import { PLAN_ICONS } from '../data/plans'
import type { ApiPlan } from '../api/widgets'
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

type ComparisonRow = { free: string; pro: string; highlight?: boolean }

const LANG_LABEL: Record<string, string> = {
  uk: 'українська',
  en: 'англійська',
  ru: 'російська',
}

function pluralUa(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

function formatLanguages(codes: string[]): string {
  if (codes.length === 0) return '—'
  if (codes.length === 1) return `Тільки ${LANG_LABEL[codes[0]] ?? codes[0]}`
  return codes.map((c) => c.toUpperCase()).join(' + ')
}

function buildComparison(free: ApiPlan, pro: ApiPlan): ComparisonRow[] {
  return [
    {
      free: `${free.max_sites} ${pluralUa(free.max_sites, 'сайт', 'сайти', 'сайтів')}`,
      pro: `${pro.max_sites} ${pluralUa(pro.max_sites, 'сайт', 'сайти', 'сайтів')}`,
      highlight: true,
    },
    {
      free: `${free.max_widgets} ${pluralUa(free.max_widgets, 'віджет', 'віджети', 'віджетів')} з лімітами`,
      pro: `${pro.max_widgets} ${pluralUa(pro.max_widgets, 'віджет', 'віджети', 'віджетів')} без лімітів`,
      highlight: true,
    },
    {
      free: formatLanguages(free.languages_supported ?? []),
      pro: formatLanguages(pro.languages_supported ?? []),
    },
  ]
}

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
  const { plans } = usePlansWithSlugs()

  if (!open) return null

  const freePlan = plans.find((p) => p.slug === 'free')
  const proPlan = plans.find((p) => p.slug === 'pro')

  const { title, subtitle } = CONTEXT_COPY[context]
  const foundingActive = founding != null && founding.remaining > 0
  const normalPrice = proPlan ? Math.round(proPlan.price_monthly) : null
  const proPrice = foundingActive ? founding!.locked_price_monthly : normalPrice
  const comparison: ComparisonRow[] =
    freePlan && proPlan ? buildComparison(freePlan, proPlan) : []

  const handleOverlayClick = () => onClose()
  const stopProp = (e: React.MouseEvent) => e.stopPropagation()

  const FreeIcon = PLAN_ICONS.free
  const ProIcon = PLAN_ICONS.pro

  const foundingProgress =
    foundingActive && founding != null
      ? Math.max(0, Math.min(100, ((founding.total - founding.remaining) / founding.total) * 100))
      : 0

  return (
    <div className="fsm__overlay" onClick={handleOverlayClick}>
      <div className="fsm" onClick={stopProp} role="dialog" aria-modal="true" aria-label={title}>
        <span className="fsm__drag-handle" aria-hidden="true" />
        <button className="fsm__close" onClick={onClose} aria-label="Закрити">
          <X size={18} strokeWidth={2} />
        </button>

        {/* Hero */}
        <div className="fsm__hero">
          <div className="fsm__hero-badge" aria-hidden="true">
            <ProIcon size={22} strokeWidth={2.25} />
          </div>
          <h2 className="fsm__title">{title}</h2>
          {subtitle && <p className="fsm__subtitle">{subtitle}</p>}
        </div>

        {/* Founding offer — prominent, before comparison */}
        {foundingActive && founding != null && (
          <div className="fsm__founding">
            <div className="fsm__founding-head">
              <span className="fsm__founding-title">
                <Zap size={14} strokeWidth={2.5} />
                Перші {founding.total} — {proPrice} ₴
                <span className="fsm__founding-strike">замість {normalPrice} ₴</span>
              </span>
              <span className="fsm__founding-remaining">
                лишилось <strong>{founding.remaining}</strong> з {founding.total}
              </span>
            </div>
            <div
              className="fsm__founding-bar"
              role="progressbar"
              aria-valuenow={foundingProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span
                className="fsm__founding-bar-fill"
                style={{ width: `${foundingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Comparison: Free vs Pro */}
        {comparison.length > 0 && (
          <div className="fsm__compare">
            <div className="fsm__col fsm__col--free">
              <div className="fsm__col-head">
                <FreeIcon size={13} strokeWidth={2.5} />
                Free
              </div>
              <ul className="fsm__col-list">
                {comparison.map((row) => (
                  <li key={`free-${row.free}`} className="fsm__col-item">
                    <XCircle size={13} strokeWidth={2.5} className="fsm__col-x" />
                    <span>{row.free}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="fsm__col fsm__col--pro">
              <div className="fsm__col-head">
                <ProIcon size={13} strokeWidth={2.5} />
                Pro
              </div>
              <ul className="fsm__col-list">
                {comparison.map((row) => (
                  <li
                    key={`pro-${row.pro}`}
                    className={`fsm__col-item${row.highlight ? ' fsm__col-item--hl' : ''}`}
                  >
                    <Check size={13} strokeWidth={3} className="fsm__col-check" />
                    <span>{row.pro}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="fsm__actions">
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
          <button className="fsm__btn-link" onClick={onConfirmFree}>
            Ні, дякую — лишитись на Free
          </button>
        </div>
      </div>
    </div>
  )
}
