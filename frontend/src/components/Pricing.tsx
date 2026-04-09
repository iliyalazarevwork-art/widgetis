import { useNavigate } from 'react-router-dom'
import { Check, Sparkles, ArrowRight, Shield, Zap, Headphones } from 'lucide-react'
import { PLANS as SHARED_PLANS } from '../data/plans'
import './Pricing.css'

// Derive marketing card data from the shared plans source
const PLANS = SHARED_PLANS.map(p => ({
  id: p.id,
  name: p.name,
  price: p.monthlyPrice,
  widgetsCount: p.widgets,
  tagline: p.pitch,
  popular: p.highlighted,
  widgets: p.features.filter(f => f.slug).map(f => f.label),
  features: p.features.filter(f => !f.slug).map(f => f.label),
}))

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
                <div className="pricing__price-current">
                  <span className="pricing__price-value">{plan.price.toLocaleString('uk-UA')}</span>
                  <span className="pricing__price-currency">грн/міс</span>
                </div>
              </div>
            </div>

            <div className="pricing__meta-row">
              <span className="pricing__widgets-count">
                {plan.widgetsCount} віджетів
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

            <button className={`pricing__cta ${plan.popular ? 'pricing__cta--popular' : ''}`} type="button">
              <span>Від {plan.price.toLocaleString('uk-UA')} грн/міс</span>
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
