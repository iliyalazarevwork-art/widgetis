import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronDown, Sprout, Zap, Crown, type LucideIcon } from 'lucide-react'
import { get, post } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { InterestButton } from '../../components/InterestButton'
import { PlanCard, type PlanCardFeature } from '../../components/PlanCard'
import { toast } from 'sonner'
import type { Plan, Subscription } from '../../types'
import { PageLoader } from '../../components/PageLoader'
import './styles/choose-plan.css'
import '../PricingPage.css'

interface PlanFeatureItem {
  key: string
  name: string
  value: boolean | string
  category: string
}

interface PlanWithFeatures extends Plan {
  feature_list: PlanFeatureItem[]
}

// Default icon per plan slug (matches PricingPage.tsx)
const PLAN_DEFAULT_ICONS: Record<string, LucideIcon> = {
  basic: Sprout,
  pro: Zap,
  max: Crown,
}

// Icon override from backend 'features.icon' field
const PLAN_ICON_MAP: Record<string, LucideIcon> = {
  sprout: Sprout,
  zap: Zap,
  crown: Crown,
}

interface PlanMockFeature {
  widgets: string[]
  service: Array<{ name: string; value?: string }>
  badge?: string
  pitch?: string
}

const PLAN_MOCK: Record<string, PlanMockFeature> = {
  basic: {
    pitch: 'Для початку',
    widgets: [
      'Дата доставки',
      'Безкоштовна доставка',
      'Бігуча стрічка',
      'Хто зараз дивиться',
    ],
    service: [
      { name: 'Кастомізація', value: 'Базова' },
      { name: 'Підтримка', value: 'Email + Telegram' },
    ],
  },
  pro: {
    pitch: 'Оптимально',
    badge: 'Обирає 73% клієнтів',
    widgets: [
      'Всі 8 віджетів',
      'Лічильник залишків',
      'Прогрес кошика',
      'Фотовідгуки',
    ],
    service: [
      { name: 'Кастомізація', value: 'Self-service' },
      { name: 'Підтримка', value: 'Email + Telegram' },
    ],
  },
  max: {
    pitch: 'Все включено',
    widgets: [
      'Всі 17 віджетів',
      'Кешбек-калькулятор',
      'Таймер терміновості',
      'Повна кастомізація',
    ],
    service: [
      { name: 'Кастомізація', value: 'Повна' },
      { name: 'Підтримка', value: 'VIP' },
    ],
  },
}


export default function ChoosePlanPage() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const [allPlans, setAllPlans] = useState<PlanWithFeatures[]>([])
  const [sub, setSub] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [yearly, setYearly] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)

  useEffect(() => {
    // Wait for auth to resolve before fetching subscription
    if (authLoading) return

    const plansFetch = get<{ data: PlanWithFeatures[] }>('/plans')
    const subFetch = user
      ? get<{ data: Subscription }>('/profile/subscription').catch(() => null)
      : Promise.resolve(null)

    Promise.all([plansFetch, subFetch])
      .then(([plansRes, subRes]) => {
        setAllPlans(plansRes.data)
        const rawSub = subRes?.data ?? null
        // Only treat as current plan if payment was confirmed (active or trial).
        // A pending subscription means the user initiated checkout but hasn't paid yet —
        // they should still be able to choose or re-choose any plan.
        const subscription = rawSub && (rawSub.status === 'active' || rawSub.status === 'trial') ? rawSub : null
        setSub(subscription)
        if (subscription) {
          setYearly(subscription.billing_period === 'yearly')
        }
      })
      .finally(() => setLoading(false))
  }, [user, authLoading])

  // Sort all plans by price ascending
  const sortedPlans = [...allPlans].sort((a, b) => a.price_monthly - b.price_monthly)
  const currentPlanIdx = sub ? sortedPlans.findIndex(p => p.id === sub.plan.id) : -1
  // Plans higher than current (or all plans if not subscribed)
  const visiblePlans = currentPlanIdx >= 0
    ? sortedPlans.slice(currentPlanIdx + 1)
    : sortedPlans
  const isMaxPlan = sub !== null && visiblePlans.length === 0

  const handleStart = async (slug: string) => {
    if (starting) return
    setStarting(slug)
    const billingPeriod = yearly ? 'yearly' : 'monthly'

    // If user already has a subscription — upgrade it
    if (sub) {
      try {
        await post('/profile/subscription/change', { plan_slug: slug })
        toast.success('План змінено!')
        navigate('/cabinet/plan')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Помилка')
        setStarting(null)
      }
      return
    }

    // Redirect to full signup flow (site URL, platform, LiqPay payment)
    navigate(`/signup?plan=${slug}&billing=${billingPeriod}`)
    return
  }

  if (loading) return <PageLoader fullscreen />

  // User is on max plan — show info screen
  if (isMaxPlan) {
    const endDate = new Date(sub!.current_period_end).toLocaleDateString('uk-UA', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
    return (
      <>
        <Header />
        <div className="choose-plan">
          <div className="choose-plan__hero">
            <h1 className="choose-plan__title">У вас вже максимальний план</h1>
            <p className="choose-plan__subtitle">
              Підписка {sub!.billing_period === 'yearly' ? 'річна' : 'місячна'} · {sub!.plan.name}
            </p>
            <p className="choose-plan__subtitle" style={{ marginTop: 8, color: 'rgba(255,255,255,0.4)' }}>
              Діє до {endDate}
            </p>
          </div>
          <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 14 }}>
              Повертайтесь після закінчення підписки, щоб обрати новий план.
            </p>
            <button
              className="choose-plan__card-btn"
              style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', color: '#fff' }}
              onClick={() => navigate('/cabinet')}
            >
              Переглянути мій план
            </button>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
    <Header />
    <div className="choose-plan">
      <div className="choose-plan__hero">
        <h1 className="choose-plan__title">
          {sub ? 'Підвищити план' : 'Обери свій план'}
        </h1>
        <p className="choose-plan__subtitle">
          {sub
            ? `Поточний план: ${sub.plan.name} · ${sub.billing_period === 'yearly' ? 'Рік' : 'Місяць'}`
            : '7 днів безкоштовно. Скасуєш коли захочеш.'}
        </p>
      </div>

      {/* Show billing toggle only when user has no subscription */}
      {!sub && (
        <div className="choose-plan__toggle-wrap">
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
        </div>
      )}

      <div className="pricing__plans">
        {visiblePlans.map((plan) => {
          const isPro = plan.slug === 'pro'
          const features = (Array.isArray(plan.features) ? null : plan.features) as Record<string, unknown> | null
          // Use backend icon if set, otherwise fall back to per-slug default
          const iconName = features?.icon as string | undefined
          const Icon = (iconName ? PLAN_ICON_MAP[iconName] : null) ?? PLAN_DEFAULT_ICONS[plan.slug] ?? Zap
          const mock = PLAN_MOCK[plan.slug]
          const pitch = resolveTr(features?.pitch) ?? mock?.pitch ?? ''
          const badgeText = resolveTr(features?.badge) ?? mock?.badge ?? null
          const yearlyMonthly = Math.round(plan.price_yearly / 12)

          // Backend feature_list when available, fall back to PLAN_MOCK
          const backendWidgets = (plan.feature_list ?? []).filter(
            (f) => f.category === 'widgets' && f.value !== false,
          )
          const backendService = (plan.feature_list ?? []).filter(
            (f) => f.category === 'service' && f.value !== false,
          )
          const widgetFeatures: PlanCardFeature[] = backendWidgets.length > 0
            ? backendWidgets.map((f) => ({ key: f.key, label: f.name }))
            : (mock?.widgets ?? []).map((w, i) => ({ key: `mock-w-${i}`, label: w }))
          const serviceFeatures: PlanCardFeature[] = backendService.length > 0
            ? backendService.map((f) => ({
                key: f.key,
                label: typeof f.value === 'string' ? `${f.name}: ${f.value}` : f.name,
              }))
            : (mock?.service ?? []).map((s, i) => ({
                key: `mock-s-${i}`,
                label: s.value ? `${s.name}: ${s.value}` : s.name,
              }))

          const featureSections: PlanCardFeature[][] =
            serviceFeatures.length > 0
              ? [widgetFeatures, serviceFeatures]
              : [widgetFeatures]

          const capLine = `${plan.max_widgets} віджетів · ${plan.max_sites} ${pluralSites(plan.max_sites)}`

          const badge = badgeText
            ? <div className="pricing__badge">{badgeText}</div>
            : null

          const btnLabel = starting === plan.slug
            ? sub ? 'Змінюємо…' : 'Активуємо…'
            : sub ? `Перейти на ${plan.name}` : 'Почати безкоштовно'

          const cta = plan.slug === 'max' ? (
            <InterestButton type="plan" id="max" />
          ) : (
            <button
              type="button"
              className={`pricing__cta pricing__cta--${plan.slug} ${
                isPro ? 'pricing__cta--highlight' : ''
              }`}
              onClick={() => handleStart(plan.slug)}
              disabled={starting !== null}
            >
              {btnLabel}
            </button>
          )

          const trialNote = !sub
            ? plan.slug === 'max'
              ? "Менеджер зв'яжеться протягом дня"
              : isPro
                ? "7 днів безкоштовно · без зобов'язань"
                : '7 днів безкоштовно'
            : null

          return (
            <PlanCard
              key={plan.id}
              slug={plan.slug}
              name={plan.name}
              pitch={pitch}
              Icon={Icon}
              monthlyPrice={plan.price_monthly}
              yearlyPrice={plan.price_yearly}
              yearlyMonthlyPrice={yearlyMonthly}
              yearly={yearly}
              capLine={capLine}
              featureSections={featureSections}
              highlighted={isPro}
              badge={badge}
              cta={cta}
              trialNote={trialNote}
            />
          )
        })}
      </div>

      {!sub && (
        <div className="choose-plan__final">
          <Link to="/pricing#compare-plans" className="choose-plan__compare-link">
            <ChevronDown size={16} />
            Переглянути порівняння планів
          </Link>
        </div>
      )}
    </div>
    <Footer />
    </>
  )
}

function resolveTr(val: unknown): string | null {
  if (!val) return null
  if (typeof val === 'string') return val
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, string>
    return obj.uk ?? obj.en ?? null
  }
  return null
}

function pluralSites(n: number): string {
  if (n === 1) return 'сайт'
  if (n >= 2 && n <= 4) return 'сайти'
  return 'сайтів'
}
