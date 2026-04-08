import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, Check, Globe, Package } from 'lucide-react'
import { get, post } from '../../api/client'
import { toast } from 'sonner'
import type { Plan } from '../../types'
import './styles/choose-plan.css'

export default function ChoosePlanPage() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [yearly, setYearly] = useState(false)

  useEffect(() => {
    get<{ data: Plan[] }>('/plans')
      .then((res) => {
        setPlans(res.data)
        const recommended = res.data.find((p) => p.is_recommended)
        if (recommended) setSelectedSlug(recommended.slug)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleStartTrial = async () => {
    if (!selectedSlug || starting) return
    setStarting(true)
    try {
      await post('/profile/subscription/start-trial', { plan_slug: selectedSlug })
      toast.success('Trial активовано! 7 днів безкоштовно')
      navigate('/cabinet', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка')
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return <div className="page-loader">Завантаження…</div>
  }

  return (
    <div className="choose-plan">
      <div className="choose-plan__hero">
        <Crown size={32} className="choose-plan__hero-icon" />
        <h1 className="choose-plan__title">Оберіть план</h1>
        <p className="choose-plan__subtitle">
          Почніть з 7 днів безкоштовного trial. Оплата — після закінчення пробного періоду.
        </p>
      </div>

      {/* Period toggle */}
      <div className="choose-plan__toggle-wrap">
        <div className="choose-plan__toggle">
          <button
            className={`choose-plan__toggle-btn ${!yearly ? 'choose-plan__toggle-btn--active' : ''}`}
            onClick={() => setYearly(false)}
          >
            Щомісяця
          </button>
          <button
            className={`choose-plan__toggle-btn ${yearly ? 'choose-plan__toggle-btn--active' : ''}`}
            onClick={() => setYearly(true)}
          >
            Щорічно <span className="choose-plan__save-badge">-2 міс</span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="choose-plan__cards">
        {plans.map((plan) => {
          const color = getPlanColor(plan.slug)
          const isSelected = selectedSlug === plan.slug
          const price = yearly ? plan.price_yearly : plan.price_monthly
          const period = yearly ? '/рік' : '/міс'

          return (
            <button
              key={plan.id}
              className={`choose-plan__card ${isSelected ? 'choose-plan__card--selected' : ''}`}
              style={{ borderColor: isSelected ? `${color}60` : undefined }}
              onClick={() => setSelectedSlug(plan.slug)}
            >
              <div className="choose-plan__card-top">
                <span className="choose-plan__card-name" style={{ color }}>{plan.name}</span>
                {plan.is_recommended && (
                  <span className="choose-plan__rec">Оптимально</span>
                )}
              </div>

              <div className="choose-plan__card-price">
                <span className="choose-plan__card-amount">{price}</span>
                <span className="choose-plan__card-period">₴{period}</span>
              </div>

              <div className="choose-plan__card-features">
                <div className="choose-plan__card-feature">
                  <Globe size={14} />
                  <span>До {plan.max_sites} сайтів</span>
                </div>
                <div className="choose-plan__card-feature">
                  <Package size={14} />
                  <span>До {plan.max_widgets} віджетів</span>
                </div>
              </div>

              {isSelected && (
                <div className="choose-plan__card-check">
                  <Check size={16} />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* CTA */}
      <button
        className="choose-plan__cta"
        disabled={!selectedSlug || starting}
        onClick={handleStartTrial}
      >
        {starting ? 'Активуємо…' : 'Почати 7 днів безкоштовно'}
      </button>

      <p className="choose-plan__note">
        Після trial підписка автоматично продовжиться. Ви можете скасувати в будь-який момент.
      </p>
    </div>
  )
}

function getPlanColor(slug: string): string {
  switch (slug) {
    case 'basic': return '#10B981'
    case 'pro': return '#3B82F6'
    case 'max': return '#A855F7'
    default: return '#888888'
  }
}
