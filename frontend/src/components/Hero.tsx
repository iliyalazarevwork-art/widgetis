import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { trackCtaClick } from '../lib/analytics'
import { PreviewCartGoal, PreviewCountdown, PreviewDelivery } from './WidgetPreviews'
import './Hero.css'

export function Hero() {
  const heroRef = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 80)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <section ref={heroRef} className={`hero ${visible ? 'hero--visible' : ''}`}>
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__glow hero__glow--left" />
        <div className="hero__glow hero__glow--right" />
      </div>

      <div className="hero__wrap">
        <div className="hero__content">
          <h1 className="hero__title">
            <span>Готові віджети</span>
            <span>
              що <span className="hero__title-accent">повертають</span>
            </span>
            <span className="hero__title-accent">продажі</span>
          </h1>
          <div className="hero__pill">
            <span className="hero__pill-text">Для сайтів на платформі</span>
            <span className="hero__pill-accent">Хорошоп</span>
          </div>
        </div>

        <div className="hero__bottom-group">
          <div className="hero__widgets" aria-label="Міні-версії готових віджетів">
            <article className="hero__widget-card hero__widget-card--preview">
              <PreviewCartGoal />
            </article>
            <article className="hero__widget-card hero__widget-card--preview">
              <PreviewDelivery />
            </article>
            <article className="hero__widget-card hero__widget-card--preview">
              <PreviewCountdown />
            </article>
          </div>

          <div className="hero__ctas">
            <Link
              to="/pricing"
              className="hero__cta hero__cta--primary"
              onClick={() => trackCtaClick('hero__cta')}
            >
              Спробувати безкоштовно
            </Link>
            <Link
              to="/demo"
              className="hero__cta hero__cta--secondary"
              onClick={() => trackCtaClick('hero__cta')}
            >
              Подивитися демо
              <ArrowRight size={18} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
