import { useNavigate } from 'react-router-dom'
import { Check, Sparkles, ArrowRight, Shield, Zap, Headphones, Gift } from 'lucide-react'
import './Pricing.css'

interface Plan {
  id: 'start' | 'pro' | 'max'
  name: string
  price: number
  originalPrice: number
  widgetsCount: number
  tagline: string
  popular?: boolean
  widgets: string[]
  features: string[]
  bonus?: string
  bonusHint?: string
}

const PLANS: Plan[] = [
  {
    id: 'start',
    name: 'Start',
    price: 699,
    originalPrice: 899,
    widgetsCount: 3,
    tagline: 'Почати працювати',
    widgets: [
      'Бігуча стрічка',
      'Дата доставки',
      'Ціль кошика',
    ],
    features: [
      'Готовий скрипт + інструкція',
      '3 місяці оновлень',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 999,
    originalPrice: 1299,
    widgetsCount: 5,
    tagline: 'Найпопулярніший',
    popular: true,
    widgets: [
      'Все зі Start',
      '+ Лічильник переглядів',
      '+ Відео-прев\'ю товару',
    ],
    features: [
      'Пріоритетна підтримка',
      '6 місяців оновлень',
    ],
  },
  {
    id: 'max',
    name: 'Max',
    price: 1599,
    originalPrice: 1999,
    widgetsCount: 6,
    tagline: 'Усі віджети + кастом',
    widgets: [
      'Все з Pro',
      '+ Лічильник покупок',
    ],
    features: [
      'Пріоритетна підтримка',
      '12 місяців оновлень',
    ],
    bonus: '1 кастомний віджет під твою нішу',
    bonusHint: 'вартість від 6 000 грн',
  },
]

export function Pricing() {
  const navigate = useNavigate()

  const goToPlan = (planId: string) => () => {
    navigate(`/pricing?plan=${planId}`)
  }
  const handleCardKey = (planId: string) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate(`/pricing?plan=${planId}`)
    }
  }

  return (
    <section className="pricing" id="pricing">
      <div className="pricing__header">
        <p className="pricing__eyebrow pricing__eyebrow--urgent">
          <span className="pricing__live-dot" aria-hidden="true" />
          Залишилось 7 пакетів за стартовою ціною
        </p>
        <h2 className="pricing__title">
          Знижка <span className="pricing__title-accent">до 400 грн</span>
        </h2>
        <p className="pricing__sub">
          Разова покупка, без підписки. Встанови за 3 хвилини.
        </p>
      </div>

      <div className="pricing__stack">
        {PLANS.map((plan) => (
          <article
            key={plan.id}
            className={`pricing__card ${plan.popular ? 'pricing__card--popular' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={`Обрати пакет ${plan.name}`}
            onClick={goToPlan(plan.id)}
            onKeyDown={handleCardKey(plan.id)}
          >
            {plan.popular && (
              <div className="pricing__popular-badge">
                <Sparkles size={12} strokeWidth={2.5} />
                <span>Найпопулярніший</span>
              </div>
            )}

            <div className="pricing__card-head">
              <div className="pricing__card-head-left">
                <h3 className="pricing__plan-name">{plan.name}</h3>
                <p className="pricing__plan-tagline">{plan.tagline}</p>
              </div>
              <div className="pricing__price">
                <span className="pricing__price-old">
                  {plan.originalPrice.toLocaleString('uk-UA')} ₴
                </span>
                <div className="pricing__price-current">
                  <span className="pricing__price-value">{plan.price.toLocaleString('uk-UA')}</span>
                  <span className="pricing__price-currency">грн</span>
                </div>
              </div>
            </div>

            <div className="pricing__meta-row">
              <span className="pricing__widgets-count">
                {plan.widgetsCount} віджетів
              </span>
              <span className="pricing__save-badge">
                −{(plan.originalPrice - plan.price).toLocaleString('uk-UA')} ₴
              </span>
            </div>

            <div className="pricing__divider" />

            <ul className="pricing__widgets-list">
              {plan.widgets.map((w, idx) => (
                <li key={idx} className="pricing__list-item pricing__list-item--widget">
                  <Check size={14} strokeWidth={3} />
                  <span>{w}</span>
                </li>
              ))}
            </ul>

            <ul className="pricing__features-list">
              {plan.features.map((f, idx) => (
                <li key={idx} className="pricing__list-item">
                  <Check size={14} strokeWidth={2.5} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {plan.bonus && (
              <div className="pricing__bonus">
                <div className="pricing__bonus-head">
                  <Gift size={15} strokeWidth={2.5} className="pricing__bonus-icon" />
                  <span className="pricing__bonus-label">Бонус</span>
                </div>
                <p className="pricing__bonus-text">{plan.bonus}</p>
                {plan.bonusHint && (
                  <p className="pricing__bonus-hint">{plan.bonusHint}</p>
                )}
              </div>
            )}

            <button className={`pricing__cta ${plan.popular ? 'pricing__cta--popular' : ''}`} type="button">
              <span>Встановити за {plan.price.toLocaleString('uk-UA')} грн</span>
              <ArrowRight size={16} strokeWidth={2.5} />
            </button>
          </article>
        ))}
      </div>

      <div className="pricing__trust-bar">
        <div className="pricing__trust-item">
          <Shield size={18} strokeWidth={2.25} />
          <div className="pricing__trust-text">
            <span className="pricing__trust-title">14 днів гарантія</span>
            <span className="pricing__trust-sub">не сподобається — повернемо гроші</span>
          </div>
        </div>
        <div className="pricing__trust-item">
          <Zap size={18} strokeWidth={2.25} />
          <div className="pricing__trust-text">
            <span className="pricing__trust-title">3 хвилини</span>
            <span className="pricing__trust-sub">від скрипта до запуску</span>
          </div>
        </div>
        <div className="pricing__trust-item">
          <Headphones size={18} strokeWidth={2.25} />
          <div className="pricing__trust-text">
            <span className="pricing__trust-title">Підтримка</span>
            <span className="pricing__trust-sub">українською, без ботів</span>
          </div>
        </div>
      </div>

      <p className="pricing__note">
        Окремий віджет — 699 грн. У пакеті — вигідніше до 56%.
      </p>
    </section>
  )
}
