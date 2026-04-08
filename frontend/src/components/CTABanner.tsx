import { MessageSquareText, Gift, LayoutList } from 'lucide-react'
import { Link } from 'react-router-dom'
import './CTABanner.css'

interface CTABannerProps {
  onConsultation: () => void
}

export function CTABanner({ onConsultation }: CTABannerProps) {
  return (
    <section className="cta-banner">
      <div className="cta-banner__container">
        <h2 className="cta-banner__title">
          Готові <span className="cta-banner__title-gradient">спробувати</span>?
        </h2>
        <p className="cta-banner__subtitle">
          Обери віджети, отримай готовий скрипт, вставляй в адмінку — і вони запрацюють.
        </p>
        <div className="cta-banner__actions">
          <button
            className="cta-banner__btn cta-banner__btn--primary"
            onClick={onConsultation}
            type="button"
          >
            <Gift size={20} strokeWidth={2} />
            Почати 7-денний trial
          </button>
          <Link to="/pricing" className="cta-banner__btn cta-banner__btn--outline">
            <LayoutList size={20} strokeWidth={2} />
            Переглянути тарифи
          </Link>
          <button
            className="cta-banner__btn cta-banner__btn--ghost"
            onClick={onConsultation}
            type="button"
          >
            <MessageSquareText size={20} strokeWidth={2} />
            Безкоштовна консультація
          </button>
        </div>
        <p className="cta-banner__note">7 днів безкоштовно. Картка не обов'язкова.</p>
      </div>
    </section>
  )
}
