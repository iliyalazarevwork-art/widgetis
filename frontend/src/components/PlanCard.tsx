import { Check, ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

/**
 * Single feature inside a plan card.
 * `href` makes the label a link (used by the public landing pricing page to
 * deep-link to a widget detail page); plain labels render as text.
 * `expandable` turns the row into a disclosure: clicking the label toggles
 * a nested list of widget links, optionally grouped (e.g. "From Basic" /
 * "New in Pro") so the user sees both inherited and added widgets.
 */
export interface PlanCardFeature {
  key: string
  label: string
  /** Small muted hint shown under the label (always visible). */
  hint?: string
  href?: string
  expandable?: PlanCardExpandableGroup[]
}

export interface PlanCardExpandableGroup {
  key: string
  title?: string
  items: Array<{ slug: string; name: string }>
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
  urlFocused?: boolean
  /** Pre-rendered CTA element (button/link/InterestButton). */
  cta: ReactNode
  trialNote?: ReactNode
  /**
   * Founding offer: discounted monthly price shown instead of regular price.
   * When set, the regular price is crossed out and this price is shown big.
   */
  foundingPrice?: number
  /** Pre-rendered founding banner shown above the card content. */
  foundingBanner?: ReactNode
  /** Controlled accordion: key of the currently open expandable (or null). */
  openFeatureKey?: string | null
  /** Called when a feature row is toggled; parent closes others. */
  onFeatureToggle?: (key: string) => void
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
  urlFocused = false,
  cta,
  trialNote,
  foundingPrice,
  foundingBanner,
  openFeatureKey,
  onFeatureToggle,
}: PlanCardProps) {
  const basePrice = yearly ? yearlyMonthlyPrice : monthlyPrice
  // When founding price is active, show it as the main price; original becomes struck-out
  const price = foundingPrice ?? basePrice
  const displayOld = foundingPrice != null ? basePrice : (yearly && monthlyPrice > 0 ? monthlyPrice : undefined)
  const yearlySavings = monthlyPrice * 12 - yearlyPrice

  const cardClass = [
    'pricing__card',
    `pricing__card--${slug}`,
    highlighted && 'pricing__card--highlight',
    dimmed && 'pricing__card--dimmed',
    urlFocused && 'pricing__card--url-focused',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div id={slug} className={cardClass}>
      {foundingBanner}
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
        {displayOld != null && (
          <span className="pricing__price-old">{displayOld.toLocaleString('uk-UA')}</span>
        )}
        <span className="pricing__price">{price.toLocaleString('uk-UA')}</span>
        <span className="pricing__price-unit">{price === 0 ? 'грн' : 'грн/міс'}</span>
      </div>
      {foundingPrice != null ? (
        <p className="pricing__price-annual pricing__price-annual--founding">
          Засновницька ціна · назавжди
        </p>
      ) : yearly && price !== 0 ? (
        <div className="pricing__price-yearly-row">
          <p className="pricing__price-annual">
            {yearlyPrice.toLocaleString('uk-UA')} грн/рік
          </p>
          <span className="pricing__savings">
            Економія {yearlySavings.toLocaleString('uk-UA')} грн
          </span>
        </div>
      ) : price !== 0 ? (
        <p className="pricing__price-annual pricing__price-annual--placeholder">
          При річній оплаті — 2 міс у подарунок
        </p>
      ) : (
        <p className="pricing__price-annual pricing__price-annual--placeholder">
          Після пробного — без оплати
        </p>
      )}

      <p className="pricing__widgets-count">{capLine}</p>

      {featureSections.map((section, sectionIdx) => (
        <ul
          key={sectionIdx}
          className={`pricing__features${sectionIdx > 0 ? ' pricing__features--secondary' : ''}`}
        >
          {section.map((f) => (
            <FeatureRow
              key={f.key}
              feature={f}
              slug={slug}
              isOpen={openFeatureKey !== undefined ? openFeatureKey === `${slug}:${f.key}` : undefined}
              onToggle={onFeatureToggle ? () => onFeatureToggle(`${slug}:${f.key}`) : undefined}
            />
          ))}
        </ul>
      ))}

      {cta}

      {trialNote && <p className="pricing__trial-note">{trialNote}</p>}
    </div>
  )
}

function FeatureRow({
  feature,
  slug,
  isOpen,
  onToggle,
}: {
  feature: PlanCardFeature
  slug: string
  isOpen?: boolean
  onToggle?: () => void
}) {
  const [localOpen, setLocalOpen] = useState(false)
  const open = isOpen !== undefined ? isOpen : localOpen
  const handleToggle = onToggle ?? (() => setLocalOpen((o) => !o))
  const groups = feature.expandable?.filter((g) => g.items.length > 0) ?? []
  const hasExpandable = groups.length > 0

  const showHint = !!feature.hint
  const liClass = [
    hasExpandable ? 'pricing__feature-item--expandable' : '',
    showHint ? 'pricing__feature-item--with-hint' : '',
  ]
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <li className={liClass}>
      <div className="pricing__feature-row">
        <Check
          size={14}
          strokeWidth={2.5}
          className={`pricing__feature-check pricing__feature-check--${slug}`}
        />
        {hasExpandable ? (
          <button
            type="button"
            className={`pricing__feature-toggle pricing__feature-toggle--${slug}`}
            onClick={handleToggle}
            aria-expanded={open}
          >
            {feature.label}
            <ChevronDown
              size={14}
              strokeWidth={2.5}
              className={`pricing__feature-chevron${open ? ' pricing__feature-chevron--open' : ''}`}
            />
          </button>
        ) : feature.href ? (
          <Link
            to={feature.href}
            className={`pricing__feature-link pricing__feature-link--${slug}`}
          >
            {feature.label}
          </Link>
        ) : (
          <span>{feature.label}</span>
        )}
      </div>
      {showHint && <p className="pricing__feature-hint">{feature.hint}</p>}
      {hasExpandable && open && (
        <div className={`pricing__feature-sublist pricing__feature-sublist--${slug}`}>
          {groups.map((group) => (
            <div key={group.key} className="pricing__feature-subgroup">
              {group.title && (
                <p
                  className={subgroupTitleClass(group.title)}
                >
                  {group.title}
                </p>
              )}
              <ul className="pricing__feature-sublist-items">
                {group.items.map((w) => (
                  <li key={w.slug}>
                    <Link
                      to={`/widgets/${w.slug}`}
                      className={`pricing__feature-link pricing__feature-link--${group.key === 'inherited' ? 'pro' : slug}`}
                    >
                      {w.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </li>
  )
}

const PLAN_NAME_SLUG: Record<string, string> = { free: 'free', basic: 'basic', pro: 'pro', max: 'max' }

function subgroupTitleClass(title: string): string {
  const lastWord = title.trim().split(/\s+/).pop()?.toLowerCase() ?? ''
  const planSlug = PLAN_NAME_SLUG[lastWord]
  return planSlug
    ? `pricing__feature-subgroup-title pricing__feature-subgroup-title--${planSlug}`
    : 'pricing__feature-subgroup-title'
}
