import { MessageSquareText, Gift } from 'lucide-react'
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
          <Link to="/pricing" className="cta-banner__btn cta-banner__btn--primary">
            <Gift size={20} strokeWidth={2} />
            Почати 7-денний trial
          </Link>
          <button
            className="cta-banner__btn cta-banner__btn--consultation"
            onClick={onConsultation}
            type="button"
          >
            <MessageSquareText size={20} strokeWidth={2} />
            Безкоштовна консультація
          </button>
        </div>
        <p className="cta-banner__note">7 днів безкоштовно — картка не потрібна.</p>
      </div>
    </section>
  )
}
