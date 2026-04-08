import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Star } from 'lucide-react'
import { PreviewViewers, PreviewStock, PreviewCartGoal } from './WidgetPreviews'
import './Hero.css'

const PREVIEW_CARDS = [
  {
    id:    'live-viewers',
    title: 'Хто зараз дивиться',
    desc:  'Показує кількість людей, які переглядають товар прямо зараз. Створює ефект дефіциту уваги.',
    Preview: PreviewViewers,
  },
  {
    id:    'purchase-counter',
    title: 'Лічильник залишків',
    desc:  'Дефіцит товару стимулює швидку покупку і знижує зволікання.',
    Preview: PreviewStock,
  },
  {
    id:    'free-delivery',
    title: 'Прогрес кошика',
    desc:  'Показує скільки залишилось до безкоштовної доставки. Мотивує додати ще товарів.',
    Preview: PreviewCartGoal,
  },
]

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView]       = useState(false)
  const [tabActive, setTabActive] = useState(!document.hidden)
  const [visible, setVisible]     = useState(false)
  const [cardIdx, setCardIdx]     = useState(0)
  const [cardIn, setCardIn]       = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const h = () => setTabActive(!document.hidden)
    document.addEventListener('visibilitychange', h)
    return () => document.removeEventListener('visibilitychange', h)
  }, [])

  useEffect(() => {
    if (!inView || !tabActive) return
    const interval = setInterval(() => {
      setCardIn(false)
      setTimeout(() => {
        setCardIdx(i => (i + 1) % PREVIEW_CARDS.length)
        setCardIn(true)
      }, 280)
    }, 3500)
    return () => clearInterval(interval)
  }, [inView, tabActive])

  const card = PREVIEW_CARDS[cardIdx]

  return (
    <section ref={sectionRef} className={`hero ${visible ? 'hero--visible' : ''}`}>

      <div className="hero__bg" aria-hidden="true">
        <div className="hero__glow hero__glow--left" />
        <div className="hero__glow hero__glow--right" />
        <div className="hero__grid" />
      </div>

      {/* ── Top: eyebrow + title + sub ── */}
      <div className="hero__content">
        <p className="hero__eyebrow">
          <Sparkles size={11} strokeWidth={2.5} />
          Набір готових віджетів для e-commerce
        </p>
        <h1 className="hero__title">
          Віджети,<br />
          що самі <span className="hero__title-accent">продають.</span>
        </h1>
        <p className="hero__sub">
          Встановіть за 2 хвилини — і магазин починає конвертувати краще.
        </p>
      </div>

      {/* ── Middle: cycling widget card ── */}
      <div
        className={`hero__wcard ${cardIn ? 'hero__wcard--in' : 'hero__wcard--out'}`}
        aria-live="polite"
      >
        <div className="hero__wcard-preview">
          <card.Preview />
        </div>
      </div>

      {/* ── Bottom: CTA + social proof ── */}
      <div className="hero__bottom">
        <Link to="/signup" className="hero__cta">
          Спробувати 7 днів безкоштовно
          <ArrowRight size={16} strokeWidth={2.5} />
        </Link>

        <div className="hero__proof">
          <div className="hero__proof-stars" aria-label="Оцінка 4.9">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={11} strokeWidth={0} fill="currentColor" />
            ))}
            <span>4.9</span>
          </div>
          <div className="hero__proof-div" aria-hidden="true" />
          <span className="hero__proof-trust">Нам довіряють 120+ магазинів</span>
        </div>
      </div>

      <div className="hero__fade-bottom" aria-hidden="true" />
    </section>
  )
}
