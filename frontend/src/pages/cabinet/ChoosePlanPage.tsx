import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ArrowRight, Sprout, Zap, Crown } from 'lucide-react'
import { get, post } from '../../api/client'
import { toast } from 'sonner'
import type { Plan } from '../../types'
import './styles/choose-plan.css'

const PLAN_CONFIG: Record<string, {
  color: string
  icon: typeof Sprout
  pitch: string
  order: number
  features: string[]
}> = {
  basic: {
    color: '#10B981',
    icon: Sprout,
    pitch: 'Для початку',
    order: 0,
    features: [
      'Дата доставки',
      'Безкоштовна доставка',
      'Бігуча стрічка',
      'Хто зараз дивиться',
      '1 сайт',
      'Email + Telegram підтримка',
    ],
  },
  pro: {
    color: '#3B82F6',
    icon: Zap,
    pitch: 'Оптимально',
    order: 1,
    features: [
      'Всі 8 віджетів',
      'Лічильник залишків',
      'Прогрес кошика',
      'Фотовідгуки',
      '3 сайти',
      'Self-service кастомізація',
    ],
  },
  max: {
    color: '#8B5CF6',
    icon: Crown,
    pitch: 'Все включено',
    order: 2,
    features: [
      'Всі 17 віджетів',
      'Кешбек-калькулятор',
      'Таймер терміновості',
      '5 сайтів',
      'VIP підтримка',
      'Повна кастомізація',
    ],
  },
}

export default function ChoosePlanPage() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [yearly, setYearly] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)

  useEffect(() => {
    get<{ data: Plan[] }>('/plans')
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

  const sorted = [...plans].sort((a, b) =>
    (PLAN_CONFIG[a.slug]?.order ?? 9) - (PLAN_CONFIG[b.slug]?.order ?? 9)
  )

  return (
    <div className="pricing">
      {/* Hero */}
      <div className="pricing__hero">
        <h1 className="pricing__title">Обери свій план</h1>
        <p className="pricing__subtitle">7 днів безкоштовно. Скасуєш коли захочеш.</p>
      </div>

      {/* Toggle */}
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

      {/* Plan cards */}
      <div className="pricing__plans">
        {sorted.map((plan) => {
          const cfg = PLAN_CONFIG[plan.slug]
          if (!cfg) return null
          const { color, icon: Icon, pitch, features } = cfg
          const isPro = plan.slug === 'pro'
          const monthlyPrice = plan.price_monthly
          const yearlyTotal = plan.price_yearly
          const yearlyMonthly = Math.round(yearlyTotal / 12)
          const savings = monthlyPrice * 12 - yearlyTotal

          return (
            <div
              key={plan.id}
              className={`pricing__card ${isPro ? 'pricing__card--pro' : ''}`}
              style={{ borderColor: `${color}${isPro ? '' : '70'}` }}
            >
              {isPro && (
                <div className="pricing__badge-wrap">
                  <span className="pricing__badge">Обирає 73% клієнтів</span>
                </div>
              )}

              {/* Top: icon + name + pitch */}
              <div className="pricing__card-top">
                <div className="pricing__card-icon-wrap" style={{ background: `${color}18` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div className="pricing__card-name-col">
                  <span className="pricing__card-name" style={{ color: isPro ? '#FFF' : '#F0F0F0' }}>
                    {plan.name}
                  </span>
                  <span className="pricing__card-pitch" style={{ color: isPro ? '#9BB3D4' : '#666' }}>
                    {pitch}
                  </span>
                </div>
              </div>

              {/* Price block */}
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

              {/* Widget/site count */}
              <span className="pricing__card-count" style={{ color: isPro ? '#D0DCF0' : '#DDD' }}>
                {plan.max_widgets} віджетів · {plan.max_sites} {plan.max_sites === 1 ? 'сайт' : plan.max_sites < 5 ? 'сайти' : 'сайтів'}
              </span>

              {/* Divider */}
              <div className="pricing__card-divider" style={{ background: isPro ? `${color}20` : 'rgba(255,255,255,0.08)' }} />

              {/* Feature list */}
              <div className="pricing__card-feats">
                {features.map((feat) => (
                  <div key={feat} className="pricing__card-feat">
                    <Check size={12} style={{ color }} />
                    <span style={{ color: isPro ? '#D0DCF0' : '#AAA' }}>{feat}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
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

      {/* Final CTA */}
      <div className="pricing__final">
        <h2 className="pricing__final-title">Готові почати?</h2>
        <button
          className="pricing__final-btn"
          onClick={() => handleStart('pro')}
          disabled={starting !== null}
        >
          Почати безкоштовно
          <ArrowRight size={16} />
        </button>
        <span className="pricing__final-note">7 днів безкоштовно, без зобов'язань</span>
      </div>
    </div>
  )
}
