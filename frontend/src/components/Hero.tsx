import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Gift, RotateCcw, Truck } from 'lucide-react'
import { trackCtaClick } from '../lib/analytics'
import './Hero.css'

const DELIVERY_DATE = 'завтра, 11 квітня'
const DELIVERY_CUTOFF = 'до 18:00'

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':')
}

export function Hero() {
  const heroRef = useRef<HTMLElement | null>(null)

  const [visible, setVisible] = useState(false)
  const [cartDone, setCartDone] = useState(false)
  const [deliverySeconds, setDeliverySeconds] = useState(64837)
  const [returnSeconds, setReturnSeconds] = useState(862)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 80)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setCartDone((v) => !v), 3200)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDeliverySeconds((s) => (s > 0 ? s - 1 : 64837))
      setReturnSeconds((s) => (s > 0 ? s - 1 : 862))
    }, 1000)
    return () => window.clearInterval(timer)
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

            {/* Cart Goal */}
            <article className={`hero-mini hero-mini--cart-goal${cartDone ? ' hero-mini--done' : ''}`}>
              <div className="hero-mini__main">
                <span className="hero-mini__icon hero-mini__icon--orange" aria-hidden="true">
                  <Gift size={20} strokeWidth={2} />
                </span>
                <div className="hero-mini__title-wrap">
                  <span className={`hero-mini__title-state${cartDone ? ' hero-mini__title-state--hidden' : ''}`}>
                    <span className="hero-mini__label">До безкоштовної доставки:</span>
                    <strong className="hero-mini__amount">910 грн</strong>
                  </span>
                  <span className={`hero-mini__title-state hero-mini__title-state--done${cartDone ? '' : ' hero-mini__title-state--hidden'}`}>
                    <strong className="hero-mini__amount hero-mini__amount--done">Безкоштовна доставка!</strong>
                  </span>
                </div>
              </div>
              <div className="hero-mini__progress" aria-hidden="true">
                <span className={`hero-mini__prog-fill${cartDone ? ' hero-mini__prog-fill--done' : ''}`} />
              </div>
            </article>

            {/* Delivery Date */}
            <article className="hero-mini hero-mini--delivery">
              <span className="hero-mini__icon hero-mini__icon--green" aria-hidden="true">
                <Truck size={20} strokeWidth={2} />
              </span>
              <div className="hero-mini__copy">
                <div className="hero-mini__row">
                  <span className="hero-mini__label">Доставка</span>
                  <strong className="hero-mini__date">{DELIVERY_DATE}</strong>
                </div>
                <div className="hero-mini__row">
                  <span className="hero-mini__sub">Замов {DELIVERY_CUTOFF} — залишилось</span>
                  <strong className="hero-mini__timer">{formatTime(deliverySeconds)}</strong>
                </div>
              </div>
            </article>

            {/* Abandoned Cart */}
            <article className="hero-mini hero-mini--return">
              <span className="hero-mini__icon hero-mini__icon--blue" aria-hidden="true">
                <RotateCcw size={20} strokeWidth={2} />
              </span>
              <div className="hero-mini__copy">
                <div className="hero-mini__row">
                  <span className="hero-mini__label">Покинутий кошик</span>
                  <strong className="hero-mini__accent">повертаємо клієнта</strong>
                </div>
                <div className="hero-mini__row">
                  <span className="hero-mini__sub">Нагадування через</span>
                  <strong className="hero-mini__timer">{formatTime(returnSeconds)}</strong>
                </div>
              </div>
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
