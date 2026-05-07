import { useEffect, useState } from 'react'
import { Check, ChevronDown, Send, Minus } from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { SeoHead } from '../components/SeoHead'
import { InterestButton } from '../components/InterestButton'
import { PlanCard, type PlanCardFeature } from '../components/PlanCard'
import { FreePlanSaveModal } from '../components/FreePlanSaveModal'
import { get } from '../api/client'
import { fetchWidgets, type ApiWidget } from '../api/widgets'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { PLANS, SERVICE_COMPARISON_ROWS, type PlanSlug } from '../data/plans'
import { PLAN_ICON_MAP } from '../components/planIconMap'
import { useFoundingRemaining } from '../hooks/useFoundingRemaining'
import type { Subscription } from '../types'
import './PricingPage.css'

interface ApiPlanData {
  slug: string
  icon: string
  color: string
  price_monthly: number
  price_yearly: number
  trial_days: number
  max_sites: number
  max_widgets: number
  is_recommended: boolean
  widget_slugs: string[]
}

const FAQ_ITEMS = [
  {
    q: 'Що таке trial і як він працює?',
    a: 'Безкоштовний доступ на 14 днів на будь-якому плані. Після закінчення trial автоматично списується оплата. Можна скасувати в будь-який момент до закінчення пробного періоду.',
  },
  {
    q: 'Чи можна змінити план?',
    a: 'Так, у будь-який час. Апгрейд на вищий план діє одразу, даунгрейд — з наступного платіжного циклу.',
  },
  {
    q: 'Що буде, якщо я відмовлюсь від підписки?',
    a: 'Доступ до віджетів зберігається до кінця оплаченого циклу. Всі Ваші налаштування зберігаються.',
  },
  {
    q: 'Як працює оплата?',
    a: 'Карта Visa або Mastercard. Щомісячне або щорічне автосписання залежно від обраного тарифу.',
  },
  {
    q: 'Чи можна купити 1–2 віджети без підписки?',
    a: 'Зараз доступна тільки підписка. Якщо Вам потрібні 1–2 конкретні віджети — напишіть нам у Telegram @widgetis, обговоримо.',
  },
  {
    q: 'На скількох сайтах можна використовувати?',
    a: 'Free — 1 сайт, Pro — 3 сайти, Max — 5 сайтів. Потрібно більше — напишіть нам.',
  },
]

// ─── Founding banner ─────────────────────────────────────────────────────────

interface FoundingBannerProps {
  remaining: number
  total: number
  lockedPrice: number
}

function FoundingBanner({ remaining, total, lockedPrice }: FoundingBannerProps) {
  const urgency = remaining <= 5
  return (
    <div className={`founding-banner${urgency ? ' founding-banner--urgent' : ''}`}>
      <span className="founding-banner__fire">🔥</span>
      <span className="founding-banner__text">
        Перші {total} клієнтів — Pro за <strong>{lockedPrice} ₴</strong> назавжди!{' '}
        {urgency
          ? <span className="founding-banner__remaining founding-banner__remaining--urgent">Лишилось {remaining}!</span>
          : <span className="founding-banner__remaining">Лишилось {remaining} з {total}</span>
        }
      </span>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CellValue({ value, planId }: { value: boolean | string; planId: string }) {
  if (value === true)
    return <Check size={15} strokeWidth={2.5} className={`pricing__check pricing__check--${planId}`} />
  if (value === false)
    return <Minus size={13} strokeWidth={2} className="pricing__lock" />
  const isNumeric = /^\d+$/.test(value as string)
  return (
    <span
      className={`pricing__cell-text${isNumeric ? ` pricing__cell-text--num pricing__cell-text--num-${planId}` : ''}`}
    >
      {value}
    </span>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`pricing__faq-item ${open ? 'pricing__faq-item--open' : ''}`}>
      <button className="pricing__faq-q" onClick={() => setOpen(o => !o)}>
        {q}
        <ChevronDown size={18} strokeWidth={2} className="pricing__faq-chevron" />
      </button>
      {open && <p className="pricing__faq-a">{a}</p>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PLAN_HEADERS = [
  { id: 'free', label: 'Free', colorClass: 'pricing__col-free' },
  { id: 'pro', label: 'Pro', colorClass: 'pricing__col-pro' },
  { id: 'max', label: 'Max', colorClass: 'pricing__col-max' },
] as const

const PLAN_ORDER: Record<string, number> = { free: 0, pro: 1, max: 2 }

export function PricingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isLoading: authLoading } = useAuth()
  const settings = useSettings()
  const telegramUrl = settings.socials?.telegram || settings.messengers?.telegram || ''
  const founding = useFoundingRemaining()
  const [yearly, setYearly] = useState(false)
  const hashPlan = location.hash.replace(/^#/, '')
  const [sub, setSub] = useState<Subscription | null>(null)
  const [subLoading, setSubLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [freeSaveModalOpen, setFreeSaveModalOpen] = useState(false)
  // Pending billing period captured when Free CTA is clicked, used after modal
  const [pendingFreeBilling, setPendingFreeBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [openFeature, setOpenFeature] = useState<string | null>(null)
  const handleFeatureToggle = (key: string) => setOpenFeature((prev) => (prev === key ? null : key))
  const [planData, setPlanData] = useState<Record<string, ApiPlanData>>({})
  const [widgets, setWidgets] = useState<ApiWidget[]>([])
  const [mobileCenteredPlan, setMobileCenteredPlan] = useState<string | null>(null)

  useEffect(() => {
    const planIds = PLANS.map(p => p.id)
    const update = () => {
      if (window.innerWidth >= 720) { setMobileCenteredPlan(null); return }
      const mid = window.innerHeight / 2
      let closest: string | null = null
      let minDist = Infinity
      for (const id of planIds) {
        const el = document.getElementById(id)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        const dist = Math.abs(rect.top + rect.height / 2 - mid)
        if (dist < minDist) { minDist = dist; closest = id }
      }
      setMobileCenteredPlan(closest)
    }
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  useEffect(() => {
    get<{ data: ApiPlanData[] }>('/plans')
      .then(res => setPlanData(Object.fromEntries(res.data.map(p => [p.slug, p]))))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchWidgets()
      .then(setWidgets)
      .catch(() => {})
  }, [])

  useEffect(() => {
    // If auth is still loading, wait
    if (authLoading) return

    // Auth done: no user → no subscription to fetch
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSubLoading(false)
      return
    }

    // Auth done, user exists → fetch subscription
    setSubLoading(true)
    get<{ data: Subscription }>('/profile/subscription')
      .then(res => {
        setSub(res.data)
      })
      .catch(() => null)
      .finally(() => setSubLoading(false))
  }, [user, authLoading])

  // True while we don't yet know the user's plan state
  const ctaReady = !authLoading && !subLoading

  useEffect(() => {
    if (!ctaReady) return
    const hash = window.location.hash.replace(/^#/, '')
    if (!hash) return
    const el = document.getElementById(hash)
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [ctaReady])

  const isSubActive = sub !== null && (sub.status === 'active' || sub.status === 'trial')
  const currentPlanOrder = isSubActive ? (PLAN_ORDER[sub!.plan.slug] ?? -1) : -1
  const validPlanSlugs = new Set(PLANS.map(p => p.id))
  const hashTargetsAPlan = validPlanSlugs.has(hashPlan as PlanSlug)

  const mergedPlans = PLANS.map(plan => {
    const api = planData[plan.id]
    return {
      ...plan,
      icon: api?.icon ? (PLAN_ICON_MAP[api.icon] ?? plan.icon) : plan.icon,
      color: api?.color ?? plan.color,
      monthlyPrice: api?.price_monthly ?? plan.monthlyPrice,
      yearlyPrice: api?.price_yearly ?? plan.yearlyPrice,
      yearlyMonthly: api ? Math.round(api.price_yearly / 12) : plan.yearlyMonthly,
      widgets: api?.max_widgets ?? plan.widgets,
      sites: api?.max_sites ?? plan.sites,
      highlighted: api?.is_recommended ?? plan.highlighted,
      widgetSlugs: api?.widget_slugs ?? [],
    }
  })

  const widgetsBySlug = new Map(widgets.map((w) => [w.slug, w]))

  const slugsToWidgets = (slugs: string[]) =>
    slugs
      .map((slug) => widgetsBySlug.get(slug))
      .filter((w): w is ApiWidget => Boolean(w))
      .map((w) => ({ slug: w.slug, name: w.name }))

  const proSlugs = new Set(mergedPlans.find((p) => p.id === 'pro')?.widgetSlugs ?? [])

  const buildExpandableGroups = (planId: PlanSlug, planSlugs: string[]) => {
    if (planId === 'free') {
      return [
        { key: 'new', title: 'Віджети Free', items: slugsToWidgets(planSlugs) },
      ]
    }
    if (planId === 'pro') {
      return [
        { key: 'new', title: 'Віджети Pro', items: slugsToWidgets(planSlugs) },
      ]
    }
    if (planId === 'max') {
      const inherited = slugsToWidgets(planSlugs.filter((s) => proSlugs.has(s)))
      const added = slugsToWidgets(planSlugs.filter((s) => !proSlugs.has(s)))
      return [
        { key: 'inherited', title: 'Все з Pro', items: inherited },
        { key: 'new', title: 'Нові в Max', items: added },
      ]
    }
    return []
  }

  const slugsByPlanSet: Record<PlanSlug, Set<string>> = {
    free: new Set(mergedPlans.find((p) => p.id === 'free')?.widgetSlugs ?? []),
    pro: new Set(mergedPlans.find((p) => p.id === 'pro')?.widgetSlugs ?? []),
    max: new Set(mergedPlans.find((p) => p.id === 'max')?.widgetSlugs ?? []),
  }

  const orderedComparisonSlugs: string[] = []
  const seenComparisonSlugs = new Set<string>()
  for (const planId of ['free', 'pro', 'max'] as PlanSlug[]) {
    for (const slug of slugsByPlanSet[planId]) {
      if (!seenComparisonSlugs.has(slug)) {
        orderedComparisonSlugs.push(slug)
        seenComparisonSlugs.add(slug)
      }
    }
  }

  const widgetComparisonRows = orderedComparisonSlugs
    .map((slug) => widgetsBySlug.get(slug))
    .filter((w): w is ApiWidget => Boolean(w))
    .map((w) => ({
      feature: w.name,
      free: slugsByPlanSet.free.has(w.slug),
      pro: slugsByPlanSet.pro.has(w.slug),
      max: slugsByPlanSet.max.has(w.slug),
    }))

  const comparisonRows: Array<{
    feature: string
    free: boolean | string
    pro: boolean | string
    max: boolean | string
  }> = [
    {
      feature: 'Сайтів',
      free: String(planData['free']?.max_sites ?? '1'),
      pro: String(planData['pro']?.max_sites ?? '—'),
      max: String(planData['max']?.max_sites ?? '—'),
    },
    {
      feature: 'Кількість віджетів',
      free: String(slugsByPlanSet.free.size || 11),
      pro: String(slugsByPlanSet.pro.size || 11),
      max: String(slugsByPlanSet.max.size || 20),
    },
    ...widgetComparisonRows,
    ...SERVICE_COMPARISON_ROWS,
  ]

  const handleUpgrade = async (planId: string) => {
    if (upgrading) return
    // Plan changes with an active subscription must go through the paid
    // upgrade flow (prorated amount → provider checkout). The dedicated
    // page handles the preview + redirect — PricingPage just sends the user
    // there so the same UX is reused across entry points.
    navigate(`/cabinet/plan?upgrade=${planId}`)
    setUpgrading(null)
  }

  const handleFreeSaveConfirmFree = () => {
    setFreeSaveModalOpen(false)
    navigate(`/signup?plan=free&billing=${pendingFreeBilling}`)
  }

  const handleFreeSaveChoosePro = () => {
    setFreeSaveModalOpen(false)
    navigate(`/signup?plan=pro&billing=${pendingFreeBilling}`)
  }

  return (
    <>
      <FreePlanSaveModal
        open={freeSaveModalOpen}
        onClose={() => setFreeSaveModalOpen(false)}
        onConfirmFree={handleFreeSaveConfirmFree}
        onChoosePro={handleFreeSaveChoosePro}
        context="choose_free"
      />
      <SeoHead
        title="Тарифи на віджети для Хорошоп — від 799 ₴/міс | Widgetis"
        description="Тарифи на маркетингові віджети для Хорошоп: Basic від 799 ₴, Pro 1599 ₴, Max 3990 ₴. До 14 днів безкоштовного тріалу. Скасувати в один клік."
        keywords="ціна віджети Хорошоп, тарифи плагіни Хорошоп, тарифи Horoshop, безкоштовні плагіни Хорошоп, підписка Widgetis, ціна віджети Horoshop"
        path="/pricing"
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ_ITEMS.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          },
          ...mergedPlans.map((plan) => ({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: `Widgetis ${plan.name}`,
            description: `Підписка на маркетингові віджети для Хорошоп — план ${plan.name}: ${plan.widgets} віджетів. ${plan.pitch}.`,
            brand: { '@type': 'Brand', name: 'Widgetis' },
            category: 'SaaS / E-commerce widgets',
            url: `https://widgetis.com/pricing#${plan.id}`,
            offers: [
              {
                '@type': 'Offer',
                name: `${plan.name} — щомісяця`,
                price: plan.monthlyPrice.toString(),
                priceCurrency: 'UAH',
                priceSpecification: {
                  '@type': 'UnitPriceSpecification',
                  price: plan.monthlyPrice.toString(),
                  priceCurrency: 'UAH',
                  unitCode: 'MON',
                  referenceQuantity: { '@type': 'QuantitativeValue', value: '1', unitCode: 'MON' },
                },
                availability: 'https://schema.org/InStock',
                url: `https://widgetis.com/signup?plan=${plan.id}&billing=monthly`,
              },
              {
                '@type': 'Offer',
                name: `${plan.name} — щороку`,
                price: plan.yearlyPrice.toString(),
                priceCurrency: 'UAH',
                priceSpecification: {
                  '@type': 'UnitPriceSpecification',
                  price: plan.yearlyPrice.toString(),
                  priceCurrency: 'UAH',
                  unitCode: 'ANN',
                  referenceQuantity: { '@type': 'QuantitativeValue', value: '1', unitCode: 'ANN' },
                },
                availability: 'https://schema.org/InStock',
                url: `https://widgetis.com/signup?plan=${plan.id}&billing=yearly`,
              },
            ],
          })),
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Головна', item: 'https://widgetis.com/' },
              { '@type': 'ListItem', position: 2, name: 'Тарифи', item: 'https://widgetis.com/pricing' },
            ],
          },
        ]}
      />

      <div className="pricing">

        {/* ── Hero ── */}
        <header className="pricing__hero">
          <h1 className="pricing__hero-title">
            {isSubActive ? 'Підвищити план' : 'Обери свій план'}
          </h1>
          <p className="pricing__hero-sub">
            {isSubActive
              ? `Поточний план: ${sub!.plan.name} · ${sub!.billing_period === 'yearly' ? 'Рік' : 'Місяць'}`
              : `До ${planData['pro']?.trial_days ?? 14} днів безкоштовно. Скасуєш коли захочеш.`}
          </p>
        </header>

        {/* ── Toggle (hidden for active subscribers — billing period is locked) ── */}
        {!isSubActive && (
          <div className="pricing__seg" role="group" aria-label="Період оплати">
            <button
              className={`pricing__seg-btn ${!yearly ? 'pricing__seg-btn--active' : ''}`}
              onClick={() => setYearly(false)}
            >
              Місяць
            </button>
            <button
              className={`pricing__seg-btn ${yearly ? 'pricing__seg-btn--active' : ''}`}
              onClick={() => setYearly(true)}
            >
              Рік
              <span className="pricing__seg-save">−17%</span>
            </button>
          </div>
        )}

        {/* ── Plans ── */}
        <div className="pricing__plans">
          {mergedPlans.map((plan) => {
            const planOrder = PLAN_ORDER[plan.id] ?? 0
            const isCurrent = isSubActive && sub!.plan.slug === plan.id
            const isBelow = isSubActive && planOrder < currentPlanOrder
            const isAbove = isSubActive && planOrder > currentPlanOrder

            const activePlanWidgets = slugsToWidgets(plan.widgetSlugs)
            const expandableGroups = buildExpandableGroups(plan.id, plan.widgetSlugs)
            const expandableTotal = expandableGroups.reduce((sum, g) => sum + g.items.length, 0)
            const showExpandable =
              (plan.id === 'free' || plan.id === 'pro' || plan.id === 'max') && expandableTotal > 0

            const inheritedCount = expandableGroups.find((g) => g.key === 'inherited')?.items.length ?? 0
            const newCount = expandableGroups.find((g) => g.key === 'new')?.items.length ?? 0
            const lowerPlanName = plan.id === 'max' ? 'Pro' : ''
            const hint = showExpandable && lowerPlanName
              ? `Все з ${lowerPlanName} (${inheritedCount}) + ще ${newCount} ${newCount === 1 ? 'віджет' : newCount < 5 ? 'віджети' : 'віджетів'}`
              : undefined

            const features: PlanCardFeature[] = plan.features.map((f, idx) => {
              const isAllWidgetsRow = showExpandable && idx === 0
              return {
                key: f.label,
                label: isAllWidgetsRow && plan.id !== 'free' ? `Всі ${expandableTotal} віджетів` : f.label,
                hint: isAllWidgetsRow ? hint : undefined,
                href:
                  isAllWidgetsRow
                    ? undefined
                    : f.slug
                      ? f.slug.startsWith('/')
                        ? f.slug
                        : `/widgets/${f.slug}`
                      : undefined,
                expandable: isAllWidgetsRow ? expandableGroups : undefined,
              }
            })

            const totalWidgets = showExpandable ? expandableTotal : activePlanWidgets.length || plan.widgets
            const capLine = `${
              plan.id === 'max' ? `Всі ${totalWidgets} віджетів` : `${totalWidgets} ${totalWidgets === 1 ? 'віджет' : totalWidgets < 5 ? 'віджети' : 'віджетів'}`
            } · ${plan.sites} ${plan.sites === 1 ? 'сайт' : plan.sites < 5 ? 'сайти' : 'сайтів'}`

            const badge = isCurrent ? (
              <div className="pricing__badge pricing__badge--current">Ваш поточний план</div>
            ) : plan.badge && !isBelow ? (
              <div className="pricing__badge">{plan.badge}</div>
            ) : null

            // Founding offer: show discounted price on Pro card when slots remain
          const foundingActive = plan.id === 'pro' && founding != null && founding.remaining > 0
          const foundingBannerNode = foundingActive && founding != null ? (
            <FoundingBanner
              remaining={founding.remaining}
              total={founding.total}
              lockedPrice={founding.locked_price_monthly}
            />
          ) : undefined

          const cta = !ctaReady ? (
              <span className="pricing__cta pricing__cta--skeleton" />
            ) : plan.id === 'free' && !isCurrent ? (
              isSubActive ? (
                <span className={`pricing__cta pricing__cta--free pricing__cta--disabled`}>
                  Нижчий план
                </span>
              ) : (
                <button
                  className="pricing__cta pricing__cta--free"
                  onClick={() => {
                    setPendingFreeBilling(yearly ? 'yearly' : 'monthly')
                    setFreeSaveModalOpen(true)
                  }}
                >
                  Почати безкоштовно
                </button>
              )
            ) : plan.id === 'max' && !isCurrent ? (
              <InterestButton type="plan" id="max" />
            ) : isCurrent ? (
              <Link
                to="/cabinet/plan"
                className={`pricing__cta pricing__cta--${plan.id} pricing__cta--current`}
              >
                Мій план
              </Link>
            ) : isBelow ? (
              <span className={`pricing__cta pricing__cta--${plan.id} pricing__cta--disabled`}>
                Нижчий план
              </span>
            ) : isAbove ? (
              <button
                className={`pricing__cta pricing__cta--${plan.id} ${
                  plan.highlighted ? 'pricing__cta--highlight' : ''
                }`}
                onClick={() => handleUpgrade(plan.id)}
                disabled={upgrading !== null}
              >
                {upgrading === plan.id ? 'Змінюємо…' : `Перейти на ${plan.name}`}
              </button>
            ) : (
              <Link
                to={`/signup?plan=${plan.id}&billing=${yearly ? 'yearly' : 'monthly'}`}
                className={`pricing__cta pricing__cta--${plan.id} ${
                  plan.highlighted ? 'pricing__cta--highlight' : ''
                }`}
              >
                Почати безкоштовно
              </Link>
            )

            const trialNote = !ctaReady
              ? null
              : plan.id === 'free'
                ? null
                : plan.id === 'max' && !isCurrent
                  ? "Менеджер зв'яжеться протягом дня"
                  : !sub
                    ? '14 днів безкоштовно'
                    : null

            return (
              <PlanCard
                key={plan.id}
                slug={plan.id}
                name={plan.name}
                pitch={plan.pitch}
                Icon={plan.icon}
                monthlyPrice={plan.monthlyPrice}
                yearlyPrice={plan.yearlyPrice}
                yearlyMonthlyPrice={plan.yearlyMonthly}
                yearly={yearly}
                capLine={capLine}
                featureSections={[features]}
                highlighted={!hashTargetsAPlan && plan.highlighted}
                dimmed={isCurrent || isBelow}
                urlFocused={hashPlan === plan.id}
                mobileActive={mobileCenteredPlan === plan.id}
                badge={badge}
                cta={cta}
                trialNote={trialNote}
                foundingPrice={foundingActive && founding != null ? founding.locked_price_monthly : undefined}
                foundingBanner={foundingBannerNode}
                openFeatureKey={openFeature}
                onFeatureToggle={handleFeatureToggle}
              />
            )
          })}
        </div>

        {/* ── Comparison table ── */}
        <div id="compare-plans" className="pricing__compare-wrap">
          <h2 className="pricing__compare-title">Порівняння планів</h2>

          <div className="pricing__clist">
            {/* Header row */}
            <div className="pricing__clist-header">
              <div className="pricing__clist-feature-col" />
              {PLAN_HEADERS.map(p => (
                <div key={p.id} className={`pricing__clist-plan-col ${p.colorClass}`}>{p.label}</div>
              ))}
            </div>

            {comparisonRows.map(row => (
              <div key={row.feature} className="pricing__clist-row">
                <span className="pricing__clist-feature">{row.feature}</span>
                {(['free', 'pro', 'max'] as PlanSlug[]).map(planId => (
                  <span key={planId} className={`pricing__clist-cell pricing__clist-cell--${planId}`}>
                    <CellValue value={row[planId]} planId={planId} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── A-la-carte teaser ── */}
        <div className="pricing__alacarte">
          <p>Потрібні тільки 1–2 віджети?<br />Напишіть — обговоримо окремо.</p>
          <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="pricing__alacarte-btn">
            <Send size={14} strokeWidth={2} />
            Telegram @widgetis
          </a>
        </div>

        {/* ── FAQ ── */}
        <div className="pricing__faq-wrap">
          <h2 className="pricing__faq-title">Часті питання</h2>
          <div className="pricing__faq-list">
            {FAQ_ITEMS.map(item => <FaqItem key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>

        {/* ── Final CTA ── */}
        <div className="pricing__final-cta">
          <h2 className="pricing__final-cta-title">Готові почати?</h2>
          {ctaReady && (sub ? (
            <Link to="/cabinet/plan" className="pricing__final-cta-btn">
              Переглянути мій план
            </Link>
          ) : (
            <>
              <Link to="/signup?plan=pro&billing=monthly" className="pricing__final-cta-btn">
                Почати безкоштовно
              </Link>
              <p className="pricing__final-cta-note">7 днів безкоштовно, без зобов'язань</p>
            </>
          ))}
        </div>

      </div>
    </>
  )
}
