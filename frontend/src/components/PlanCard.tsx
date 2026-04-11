import { Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/**
 * Single feature inside a plan card.
 * `href` makes the label a link (used by the public landing pricing page to
 * deep-link to a widget detail page); plain labels render as text.
 */
export interface PlanCardFeature {
  key: string
  label: string
  href?: string
}

export interface PlanCardProps {
  /** Plan slug — drives all `--<slug>` CSS modifiers (basic / pro / max). */
  slug: string
  name: string
  pitch: string
  /** Pre-rendered badge node (e.g. "Найкращий вибір" or "Ваш поточний план"). */
  badge?: ReactNode
  Icon: LucideIcon
  monthlyPrice: number
  yearlyPrice: number
  /** Pre-computed yearly→monthly price (i.e. yearlyPrice / 12). */
  yearlyMonthlyPrice: number
  /** Toggle state — whether to display the yearly view. */
  yearly: boolean
  /** Pre-formatted single line under the price ("Всі 17 віджетів · 5 сайтів"). */
  capLine: string
  /**
   * One or more sections of features. The card renders a thin divider between
   * sections — pass `[allFeatures]` for the simple flat-list case.
   */
  featureSections: PlanCardFeature[][]
  highlighted?: boolean
  dimmed?: boolean
  /** Pre-rendered CTA element (button/link/InterestButton). */
  cta: ReactNode
  trialNote?: ReactNode
}

/**
 * Shared plan card used by /pricing AND /cabinet/choose-plan.
 *
 * The component is intentionally presentational — it computes nothing about
 * the user's subscription state. Callers compute `dimmed` / `badge` / `cta`
 * themselves and pass them in. This keeps the card free of routing/auth
 * concerns and lets each page decide its own CTA semantics.
 *
 * Styles live in `pages/PricingPage.css` under the `pricing__*` namespace
 * (still imported by both consumers) so we don't duplicate the CSS surface.
 */
export function PlanCard({
  slug,
  name,
  pitch,
  badge,
  Icon,
  monthlyPrice,
  yearlyPrice,
  yearlyMonthlyPrice,
  yearly,
  capLine,
  featureSections,
  highlighted = false,
  dimmed = false,
  cta,
  trialNote,
}: PlanCardProps) {
  const price = yearly ? yearlyMonthlyPrice : monthlyPrice
  const yearlySavings = monthlyPrice * 12 - yearlyPrice

  const cardClass = [
    'pricing__card',
    `pricing__card--${slug}`,
    highlighted && 'pricing__card--highlight',
    dimmed && 'pricing__card--dimmed',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cardClass}>
      {badge}

      <div className="pricing__card-top">
        <div className={`pricing__plan-icon pricing__plan-icon--${slug}`}>
          <Icon size={22} strokeWidth={2} />
        </div>
        <div>
          <h2 className="pricing__plan-name">{name}</h2>
          <p className="pricing__plan-pitch">{pitch}</p>
        </div>
      </div>

      <div className="pricing__price-block">
        {yearly && (
          <span className="pricing__price-old">{monthlyPrice.toLocaleString('uk-UA')}</span>
        )}
        <span className="pricing__price">{price.toLocaleString('uk-UA')}</span>
        <span className="pricing__price-unit">грн/міс</span>
      </div>
      {yearly ? (
        <div className="pricing__price-yearly-row">
          <p className="pricing__price-annual">
            {yearlyPrice.toLocaleString('uk-UA')} грн/рік
          </p>
          <span className="pricing__savings">
            Економія {yearlySavings.toLocaleString('uk-UA')} грн
          </span>
        </div>
      ) : (
        <p className="pricing__price-annual pricing__price-annual--placeholder">
          При річній оплаті — 2 міс у подарунок
        </p>
      )}

      <p className="pricing__widgets-count">{capLine}</p>

      {featureSections.map((section, sectionIdx) => (
        <ul
          key={sectionIdx}
          className={`pricing__features${sectionIdx > 0 ? ' pricing__features--secondary' : ''}`}
        >
          {section.map((f) => (
            <li key={f.key}>
              <Check
                size={14}
                strokeWidth={2.5}
                className={`pricing__feature-check pricing__feature-check--${slug}`}
              />
              {f.href ? (
                <Link
                  to={f.href}
                  className={`pricing__feature-link pricing__feature-link--${slug}`}
                >
                  {f.label}
                </Link>
              ) : (
                f.label
              )}
            </li>
          ))}
        </ul>
      ))}

      {cta}

      {trialNote && <p className="pricing__trial-note">{trialNote}</p>}
    </div>
  )
}
