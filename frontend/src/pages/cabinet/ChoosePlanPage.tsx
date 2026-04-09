import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ArrowLeft, ArrowRight, Sprout, Zap, Crown, type LucideIcon } from 'lucide-react'
import { get, post } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'sonner'
import type { Plan, Subscription } from '../../types'
import './styles/choose-plan.css'

interface PlanFeatureItem {
  key: string
  name: string
  value: boolean | string
  category: string
}

interface PlanWithFeatures extends Plan {
  feature_list: PlanFeatureItem[]
}

const PLAN_COLORS: Record<string, string> = {
  basic: '#10B981',
  pro: '#3B82F6',
  max: '#8B5CF6',
}

const PLAN_ICONS: Record<string, LucideIcon> = {
  sprout: Sprout,
  zap: Zap,
  crown: Crown,
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
        const subscription = subRes?.data ?? null
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

    // New subscription flow (trial)
    sessionStorage.setItem('wty_trial_signup', JSON.stringify({
      email: user?.email ?? '',
      site: '',
      platform: 'horoshop',
      plan: slug,
      billing: billingPeriod,
    }))

    try {
      const res = await post<{ data: { checkout_url: string; data: string; signature: string; emulated?: boolean } }>(
        '/profile/subscription/checkout/trial',
        { plan_slug: slug, billing_period: billingPeriod },
      )

      if (res.data.emulated) {
        navigate('/signup/success')
        return
      }

      const form = document.createElement('form')
      form.method = 'POST'
      form.action = res.data.checkout_url

      const dataField = document.createElement('input')
      dataField.type = 'hidden'
      dataField.name = 'data'
      dataField.value = res.data.data

      const sigField = document.createElement('input')
      sigField.type = 'hidden'
      sigField.name = 'signature'
      sigField.value = res.data.signature

      form.appendChild(dataField)
      form.appendChild(sigField)
      document.body.appendChild(form)
      form.submit()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'ALREADY_SUBSCRIBED') {
        navigate('/signup/success')
        return
      }
      toast.error(err instanceof Error ? err.message : 'Помилка')
      setStarting(null)
    }
  }

  if (loading) return <div className="page-loader">Завантаження…</div>

  // User is on max plan — show info screen
  if (isMaxPlan) {
    const endDate = new Date(sub!.current_period_end).toLocaleDateString('uk-UA', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
    return (
      <div className="choose-plan">
        <header className="choose-plan__header">
          <button className="choose-plan__back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
        </header>
        <div className="choose-plan__hero">
          <h1 className="choose-plan__title">У вас вже максимальний план</h1>
          <p className="choose-plan__subtitle">
            Підписка {sub!.billing_period === 'yearly' ? 'річна' : 'місячна'} · {sub!.plan.name}
          </p>
          <p className="choose-plan__subtitle" style={{ marginTop: 8, color: 'rgba(255,255,255,0.4)' }}>
            Діє до {endDate}
          </p>
        </div>
        <div className="choose-plan__plans" style={{ justifyContent: 'center', alignItems: 'center', padding: '40px 20px' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 14 }}>
            Повертайтесь після закінчення підписки, щоб обрати новий план.
          </p>
          <button
            className="choose-plan__card-btn"
            style={{ marginTop: 24, background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', color: '#fff' }}
            onClick={() => navigate('/cabinet/plan')}
          >
            Переглянути мій план
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="choose-plan">
      <header className="choose-plan__header">
        <button className="choose-plan__back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
      </header>

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
          <div className="choose-plan__toggle">
            <button
              className={`choose-plan__toggle-btn ${!yearly ? 'choose-plan__toggle-btn--active' : ''}`}
              onClick={() => setYearly(false)}
            >
              Місяць
            </button>
            <button
              className={`choose-plan__toggle-btn ${yearly ? 'choose-plan__toggle-btn--active' : ''}`}
              onClick={() => setYearly(true)}
            >
              Рік
              <span className="choose-plan__toggle-save">−17%</span>
            </button>
          </div>
        </div>
      )}

      <div className="choose-plan__plans">
        {visiblePlans.map((plan) => {
          const color = PLAN_COLORS[plan.slug] ?? '#888'
          const isPro = plan.slug === 'pro'
          const features = (Array.isArray(plan.features) ? null : plan.features) as Record<string, unknown> | null
          const iconName = (features?.icon as string) || 'zap'
          const Icon = PLAN_ICONS[iconName] ?? Zap
          const pitch = resolveTr(features?.pitch)
          const badge = resolveTr(features?.badge)
          const monthlyPrice = plan.price_monthly
          const yearlyTotal = plan.price_yearly
          const yearlyMonthly = Math.round(yearlyTotal / 12)
          const savings = monthlyPrice * 12 - yearlyTotal

          const included = (plan.feature_list ?? []).filter(
            (f) => f.value === true || (typeof f.value === 'string' && f.value.length > 0)
          )

          const btnLabel = starting === plan.slug
            ? (sub ? 'Змінюємо…' : 'Активуємо…')
            : (sub ? `Перейти на ${plan.name}` : 'Почати безкоштовно')

          return (
            <div
              key={plan.id}
              className={`choose-plan__card ${isPro ? 'choose-plan__card--pro' : ''}`}
              style={{ borderColor: `${color}${isPro ? '' : plan.slug === 'max' ? '80' : '70'}` }}
            >
              {badge && (
                <div className="choose-plan__badge-wrap">
                  <span className="choose-plan__badge">{badge}</span>
                </div>
              )}

              <div className="choose-plan__card-top">
                <div className="choose-plan__card-icon-wrap" style={{ background: `${color}18` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div className="choose-plan__card-name-col">
                  <span className="choose-plan__card-name" style={{ color: isPro ? '#FFF' : '#F0F0F0' }}>
                    {plan.name}
                  </span>
                  {pitch && (
                    <span className="choose-plan__card-pitch" style={{ color: isPro ? '#9BB3D4' : '#666' }}>
                      {pitch}
                    </span>
                  )}
                </div>
              </div>

              <div className="choose-plan__card-price-block">
                <div className="choose-plan__card-price-line">
                  {yearly && (
                    <span className="choose-plan__card-old-price">
                      {monthlyPrice.toLocaleString('uk-UA')}
                      <span className="choose-plan__card-strike" />
                    </span>
                  )}
                  <span className="choose-plan__card-amount" style={{ color: isPro ? '#FFF' : '#F0F0F0' }}>
                    {yearly ? yearlyMonthly.toLocaleString('uk-UA') : monthlyPrice.toLocaleString('uk-UA')}
                  </span>
                  <span className="choose-plan__card-unit" style={{ color: isPro ? '#9BB3D4' : '#666' }}>
                    грн/міс
                  </span>
                </div>
                {yearly && (
                  <div className="choose-plan__card-annual-line">
                    <span className="choose-plan__card-annual-text">
                      {yearlyTotal.toLocaleString('uk-UA')} грн/рік
                    </span>
                    <span className="choose-plan__card-savings">
                      Економія {savings.toLocaleString('uk-UA')} грн
                    </span>
                  </div>
                )}
              </div>

              <span className="choose-plan__card-count" style={{ color: isPro ? '#D0DCF0' : '#DDD' }}>
                {plan.max_widgets} віджетів · {plan.max_sites} {pluralSites(plan.max_sites)}
              </span>

              <div className="choose-plan__card-divider" style={{ background: isPro ? `${color}20` : 'rgba(255,255,255,0.08)' }} />

              <div className="choose-plan__card-feats">
                {included.map((f) => (
                  <div key={f.key} className="choose-plan__card-feat">
                    <Check size={12} style={{ color }} />
                    <span style={{ color: isPro ? '#D0DCF0' : '#AAA' }}>
                      {typeof f.value === 'string' ? `${f.name}: ${f.value}` : f.name}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className="choose-plan__card-btn"
                style={{ background: `${color}22`, borderColor: `${color}55`, color }}
                onClick={() => handleStart(plan.slug)}
                disabled={starting !== null}
              >
                {btnLabel}
              </button>

              {!sub && (
                <span className="choose-plan__card-trial" style={{ color: isPro ? `${color}80` : 'rgba(255,255,255,0.32)' }}>
                  {isPro ? '7 днів безкоштовно · без зобов\'язань' : '7 днів безкоштовно'}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {!sub && (
        <div className="choose-plan__final">
          <h2 className="choose-plan__final-title">Готові почати?</h2>
          <button
            className="choose-plan__final-btn"
            onClick={() => handleStart('pro')}
            disabled={starting !== null}
          >
            Почати безкоштовно <ArrowRight size={16} />
          </button>
          <span className="choose-plan__final-note">7 днів безкоштовно, без зобов'язань</span>
        </div>
      )}
    </div>
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
