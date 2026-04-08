import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ArrowLeft, ArrowRight, Sprout, Zap, Crown, type LucideIcon } from 'lucide-react'
import { get, post } from '../../api/client'
import { toast } from 'sonner'
import type { Plan } from '../../types'
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
  const [plans, setPlans] = useState<PlanWithFeatures[]>([])
  const [loading, setLoading] = useState(true)
  const [yearly, setYearly] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)

  useEffect(() => {
    get<{ data: PlanWithFeatures[] }>('/plans')
      .then((res) => setPlans(res.data))
      .finally(() => setLoading(false))
  }, [])

  const handleStart = async (slug: string) => {
    if (starting) return
    setStarting(slug)
    try {
      await post('/profile/subscription/start-trial', { plan_slug: slug })
      toast.success('Trial активовано! 7 днів безкоштовно')
      navigate('/cabinet', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка')
    } finally {
      setStarting(null)
    }
  }

  if (loading) return <div className="page-loader">Завантаження…</div>

  return (
    <div className="pricing">
      <header className="pricing__header">
        <button className="pricing__back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
      </header>

      <div className="pricing__hero">
        <h1 className="pricing__title">Обери свій план</h1>
        <p className="pricing__subtitle">7 днів безкоштовно. Скасуєш коли захочеш.</p>
      </div>

      <div className="pricing__toggle-wrap">
        <div className="pricing__toggle">
          <button
            className={`pricing__toggle-btn ${!yearly ? 'pricing__toggle-btn--active' : ''}`}
            onClick={() => setYearly(false)}
          >
            Місяць
          </button>
          <button
            className={`pricing__toggle-btn ${yearly ? 'pricing__toggle-btn--active' : ''}`}
            onClick={() => setYearly(true)}
          >
            Рік
            <span className="pricing__toggle-save">−17%</span>
          </button>
        </div>
      </div>

      <div className="pricing__plans">
        {plans.map((plan) => {
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

          // Show only included features (true or string) for the card list
          const included = (plan.feature_list ?? []).filter(
            (f) => f.value === true || (typeof f.value === 'string' && f.value.length > 0)
          )

          return (
            <div
              key={plan.id}
              className={`pricing__card ${isPro ? 'pricing__card--pro' : ''}`}
              style={{ borderColor: `${color}${isPro ? '' : '70'}` }}
            >
              {badge && (
                <div className="pricing__badge-wrap">
                  <span className="pricing__badge">{badge}</span>
                </div>
              )}

              <div className="pricing__card-top">
                <div className="pricing__card-icon-wrap" style={{ background: `${color}18` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div className="pricing__card-name-col">
                  <span className="pricing__card-name" style={{ color: isPro ? '#FFF' : '#F0F0F0' }}>
                    {plan.name}
                  </span>
                  {pitch && (
                    <span className="pricing__card-pitch" style={{ color: isPro ? '#9BB3D4' : '#666' }}>
                      {pitch}
                    </span>
                  )}
                </div>
              </div>

              <div className="pricing__card-price-block">
                <div className="pricing__card-price-line">
                  {yearly && (
                    <span className="pricing__card-old-price">
                      {monthlyPrice.toLocaleString('uk-UA')}
                      <span className="pricing__card-strike" />
                    </span>
                  )}
                  <span className="pricing__card-amount" style={{ color: isPro ? '#FFF' : '#F0F0F0' }}>
                    {yearly ? yearlyMonthly.toLocaleString('uk-UA') : monthlyPrice.toLocaleString('uk-UA')}
                  </span>
                  <span className="pricing__card-unit" style={{ color: isPro ? '#9BB3D4' : '#666' }}>
                    грн/міс
                  </span>
                </div>
                {yearly && (
                  <div className="pricing__card-annual-line">
                    <span className="pricing__card-annual-text">
                      {yearlyTotal.toLocaleString('uk-UA')} грн/рік
                    </span>
                    <span className="pricing__card-savings">
                      Економія {savings.toLocaleString('uk-UA')} грн
                    </span>
                  </div>
                )}
              </div>

              <span className="pricing__card-count" style={{ color: isPro ? '#D0DCF0' : '#DDD' }}>
                {plan.max_widgets} віджетів · {plan.max_sites} {pluralSites(plan.max_sites)}
              </span>

              <div className="pricing__card-divider" style={{ background: isPro ? `${color}20` : 'rgba(255,255,255,0.08)' }} />

              <div className="pricing__card-feats">
                {included.map((f) => (
                  <div key={f.key} className="pricing__card-feat">
                    <Check size={12} style={{ color }} />
                    <span style={{ color: isPro ? '#D0DCF0' : '#AAA' }}>
                      {typeof f.value === 'string' ? `${f.name}: ${f.value}` : f.name}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className="pricing__card-btn"
                style={{ background: `${color}22`, borderColor: `${color}55`, color }}
                onClick={() => handleStart(plan.slug)}
                disabled={starting !== null}
              >
                {starting === plan.slug ? 'Активуємо…' : 'Почати безкоштовно'}
              </button>

              <span className="pricing__card-trial" style={{ color: isPro ? `${color}80` : 'rgba(255,255,255,0.32)' }}>
                {isPro ? '7 днів безкоштовно · без зобов\'язань' : '7 днів безкоштовно'}
              </span>
            </div>
          )
        })}
      </div>

      <div className="pricing__final">
        <h2 className="pricing__final-title">Готові почати?</h2>
        <button
          className="pricing__final-btn"
          onClick={() => handleStart('pro')}
          disabled={starting !== null}
        >
          Почати безкоштовно <ArrowRight size={16} />
        </button>
        <span className="pricing__final-note">7 днів безкоштовно, без зобов'язань</span>
      </div>
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
