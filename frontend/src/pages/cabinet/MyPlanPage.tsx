import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Crown, Globe, Package, Calendar, AlertTriangle } from 'lucide-react'
import { get } from '../../api/client'
import type { Subscription, Plan } from '../../types'
import './styles/plan.css'

export default function MyPlanPage() {
  const [sub, setSub] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      get<{ data: Subscription }>('/profile/subscription').catch(() => null),
      get<{ data: Plan[] }>('/plans'),
    ]).then(([subRes, plansRes]) => {
      if (subRes) setSub(subRes.data)
      setPlans(plansRes?.data || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-loader">Завантаження…</div>

  const planColor = getPlanColor(sub?.plan?.slug)

  return (
    <div className="plan-page">
      <div className="plan-page__header">
        <Link to="/cabinet" className="plan-page__back"><ArrowLeft size={18} /></Link>
        <span className="plan-page__title">Мій план</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="plan-page__body">
        {sub ? (
          <div className="plan-page__current" style={{ borderColor: `${planColor}30` }}>
            <div className="plan-page__current-top">
              <div>
                <span className="plan-page__current-label">Поточний план</span>
                <span className="plan-page__current-name" style={{ color: planColor }}>
                  <Crown size={16} /> {sub.plan.name}
                </span>
              </div>
              {sub.is_trial && (
                <span className="plan-page__trial-badge">Trial</span>
              )}
            </div>

            <div className="plan-page__stats">
              <div className="plan-page__stat">
                <Globe size={14} />
                <span>До {sub.plan.max_sites} сайтів</span>
              </div>
              <div className="plan-page__stat">
                <Package size={14} />
                <span>До {sub.plan.max_widgets} віджетів</span>
              </div>
              <div className="plan-page__stat">
                <Calendar size={14} />
                <span>Наступне списання: {new Date(sub.current_period_end).toLocaleDateString('uk-UA')}</span>
              </div>
            </div>

            {sub.status === 'cancelled' && (
              <div className="plan-page__cancelled">
                <AlertTriangle size={14} />
                <span>Підписка скасована. Доступ до {new Date(sub.current_period_end).toLocaleDateString('uk-UA')}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="plan-page__no-plan">
            <p>У вас немає активного плану</p>
          </div>
        )}

        <h2 className="plan-page__section-title">Порівняти плани</h2>
        <div className="plan-page__plans">
          {plans.map((plan) => {
            const color = getPlanColor(plan.slug)
            const isCurrent = sub?.plan?.id === plan.id
            return (
              <div key={plan.id} className={`plan-page__plan-card ${isCurrent ? 'plan-page__plan-card--current' : ''}`}>
                <div className="plan-page__plan-header">
                  <span className="plan-page__plan-name" style={{ color }}>{plan.name}</span>
                  {plan.is_recommended && <span className="plan-page__rec-badge">Оптимально</span>}
                </div>
                <div className="plan-page__plan-price">
                  <span className="plan-page__plan-amount">{plan.price_monthly}</span>
                  <span className="plan-page__plan-period">₴/міс</span>
                </div>
                <div className="plan-page__plan-limits">
                  <span>{plan.max_sites} сайтів · {plan.max_widgets} віджетів</span>
                </div>
                {isCurrent ? (
                  <span className="plan-page__plan-current-label">Поточний</span>
                ) : (
                  <button className="plan-page__plan-btn">Обрати</button>
                )}
              </div>
            )
          })}
        </div>

        {sub && sub.status !== 'cancelled' && (
          <Link to="/cabinet/plan/cancel" className="plan-page__cancel-link">
            Скасувати підписку
          </Link>
        )}
      </div>
    </div>
  )
}

function getPlanColor(slug?: string | null): string {
  switch (slug) {
    case 'basic': return '#10B981'
    case 'pro': return '#3B82F6'
    case 'max': return '#A855F7'
    default: return '#888888'
  }
}
