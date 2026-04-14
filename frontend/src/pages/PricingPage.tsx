import { useEffect, useState } from 'react'
import { Check, ChevronDown, Send, Minus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { SeoHead } from '../components/SeoHead'
import { InterestButton } from '../components/InterestButton'
import { PlanCard, type PlanCardFeature } from '../components/PlanCard'
import { get, post } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { toast } from 'sonner'
import { PLANS, COMPARISON_ROWS, type PlanSlug } from '../data/plans'
import type { Subscription } from '../types'
import './PricingPage.css'

const FAQ_ITEMS = [
  {
    q: 'Що таке trial і як він працює?',
    a: '7 днів безкоштовного доступу на обраному плані. Після закінчення trial автоматично списується оплата. Можна скасувати в будь-який момент до закінчення пробного періоду.',
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
    a: 'Карта Visa або Mastercard через LiqPay. Щомісячне або щорічне автосписання залежно від обраного тарифу.',
  },
  {
    q: 'Чи можна купити 1–2 віджети без підписки?',
    a: 'Зараз доступна тільки підписка. Якщо Вам потрібні 1–2 конкретні віджети — напишіть нам у Telegram @widgetis, обговоримо.',
  },
  {
    q: 'На скількох сайтах можна використовувати?',
    a: 'Basic — 1 сайт, Pro — 3 сайти, Max — 5 сайтів. Потрібно більше — напишіть нам.',
  },
]

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
  { id: 'basic', label: 'Basic', colorClass: 'pricing__col-basic' },
  { id: 'pro',   label: 'Pro',   colorClass: 'pricing__col-pro'   },
  { id: 'max',   label: 'Max',   colorClass: 'pricing__col-max'   },
] as const

const PLAN_ORDER: Record<string, number> = { basic: 0, pro: 1, max: 2 }

export function PricingPage() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const settings = useSettings()
  const telegramUrl = settings.socials?.telegram || settings.messengers?.telegram || ''
  const [yearly, setYearly] = useState(true)
  const [sub, setSub] = useState<Subscription | null>(null)
  const [subLoading, setSubLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)

  useEffect(() => {
    // If auth is still loading, wait
    if (authLoading) return

    // Auth done: no user → no subscription to fetch
    if (!user) {
      setSubLoading(false)
      return
    }

    // Auth done, user exists → fetch subscription
    setSubLoading(true)
    get<{ data: Subscription }>('/profile/subscription')
      .then(res => {
        setSub(res.data)
        setYearly(res.data.billing_period === 'yearly')
      })
      .catch(() => null)
      .finally(() => setSubLoading(false))
  }, [user, authLoading])

  // True while we don't yet know the user's plan state
  const ctaReady = !authLoading && !subLoading

  const isSubActive = sub !== null && (sub.status === 'active' || sub.status === 'trial')
  const currentPlanOrder = isSubActive ? (PLAN_ORDER[sub!.plan.slug] ?? -1) : -1

  const handleUpgrade = async (planId: string) => {
    if (upgrading) return
    setUpgrading(planId)
    try {
      await post('/profile/subscription/change', { plan_slug: planId })
      toast.success('План змінено!')
      navigate('/cabinet/plan')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка')
      setUpgrading(null)
    }
  }

  return (
    <>
      <SeoHead
        title="Тарифи та ціни — widgetis | Від 0 грн, 7 днів безкоштовно"
        description="Прозорі тарифи widgetis: Free, Basic, Pro і Max. Безкоштовний тріал 7 днів на будь-якому платному плані. Без прихованих платежів, скасувати можна в один клік."
        path="/pricing"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ_ITEMS.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
          })),
        }}
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
              : '7 днів безкоштовно. Скасуєш коли захочеш.'}
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
          {PLANS.map((plan) => {
            const planOrder = PLAN_ORDER[plan.id] ?? 0
            const isCurrent = isSubActive && sub!.plan.slug === plan.id
            const isBelow = isSubActive && planOrder < currentPlanOrder
            const isAbove = isSubActive && planOrder > currentPlanOrder

            const features: PlanCardFeature[] = plan.features.map((f) => ({
              key: f.label,
              label: f.label,
              href: f.slug ? (f.slug.startsWith('/') ? f.slug : `/widgets/${f.slug}`) : undefined,
            }))

            const capLine = `${
              plan.widgets === 17 ? 'Всі 17 віджетів' : `${plan.widgets} віджети`
            } · ${plan.sites} ${plan.sites === 1 ? 'сайт' : 'сайти'}`

            const badge = isCurrent ? (
              <div className="pricing__badge pricing__badge--current">Ваш поточний план</div>
            ) : plan.badge && !isBelow ? (
              <div className="pricing__badge">{plan.badge}</div>
            ) : null

            const cta = !ctaReady ? (
              <span className="pricing__cta pricing__cta--skeleton" />
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
              : plan.id === 'max' && !isCurrent
                ? "Менеджер зв'яжеться протягом дня"
                : !sub
                  ? '7 днів безкоштовно'
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
                highlighted={plan.highlighted}
                dimmed={isCurrent || isBelow}
                badge={badge}
                cta={cta}
                trialNote={trialNote}
              />
            )
          })}
        </div>

        {/* ── Trust row ── */}
        <div className="pricing__trust">
          <span className="pricing__trust-badge">🔒 7 днів безкоштовно · без автосписання без попередження</span>
          <div className="pricing__payment-logos">
            {['Visa', 'Mastercard', 'Privat24', 'Monobank'].map(name => (
              <span key={name} className="pricing__payment-logo">{name}</span>
            ))}
          </div>
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

            {COMPARISON_ROWS.map(row => (
              <div key={row.feature} className="pricing__clist-row">
                <span className="pricing__clist-feature">{row.feature}</span>
                {(['basic', 'pro', 'max'] as PlanSlug[]).map(planId => (
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
              <Link to="/signup?plan=pro" className="pricing__final-cta-btn">
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
