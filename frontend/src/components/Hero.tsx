import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, Star, Timer, Truck } from 'lucide-react'
import { trackCtaClick } from '../lib/analytics'
import './Hero.css'

const DELIVERY_DATES = ['Пн, 14 квітня', 'Вт, 15 квітня', 'Ср, 16 квітня']

type HeroWidget = {
  id: string
  kind: 'shipping' | 'delivery' | 'sale'
}

const HERO_WIDGETS: HeroWidget[] = [
  { id: 'shipping', kind: 'shipping' },
  { id: 'delivery-date', kind: 'delivery' },
  { id: 'sale-countdown', kind: 'sale' },
]

function getWidgetSlots(viewportHeight: number, viewportWidth: number): number {
  if (viewportWidth >= 1024) return 3
  if (viewportWidth >= 390 && viewportHeight >= 760) return 3
  if (viewportHeight >= 620) return 2
  return 1
}

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':')
}

export function Hero() {
  const heroRef = useRef<HTMLElement | null>(null)
  const nextWidgetCursorRef = useRef(0)
  const swapTimersRef = useRef<number[]>([])
  const scheduleTimersRef = useRef<number[]>([])

  const [visible, setVisible] = useState(false)
  const [slots, setSlots] = useState(3)
  const [displayedWidgets, setDisplayedWidgets] = useState<HeroWidget[]>(HERO_WIDGETS)
  const [animatingSlot, setAnimatingSlot] = useState<number | null>(null)
  const [animStage, setAnimStage] = useState<'out' | 'in' | null>(null)
  const [inView, setInView] = useState(false)
  const [tabActive, setTabActive] = useState(() => (
    typeof document === 'undefined' ? true : !document.hidden
  ))
  const [deliveryIndex, setDeliveryIndex] = useState(0)
  const [deliverySeconds, setDeliverySeconds] = useState(135)
  const [saleSeconds, setSaleSeconds] = useState(8143)
  const [cartDone, setCartDone] = useState(false)

  const clearSwapTimers = useCallback(() => {
    swapTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    swapTimersRef.current = []
  }, [])

  const clearScheduleTimers = useCallback(() => {
    scheduleTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    scheduleTimersRef.current = []
  }, [])

  const runSlotSwap = useCallback((slot: number) => {
    setDisplayedWidgets((current) => {
      if (!current.length || slot >= current.length) return current

      const currentIds = new Set(current.map((widget) => widget.id))
      let nextWidget: HeroWidget | null = null

      for (let i = 0; i < HERO_WIDGETS.length; i += 1) {
        const idx = (nextWidgetCursorRef.current + i) % HERO_WIDGETS.length
        const candidate = HERO_WIDGETS[idx]
        if (!currentIds.has(candidate.id)) {
          nextWidget = candidate
          nextWidgetCursorRef.current = (idx + 1) % HERO_WIDGETS.length
          break
        }
      }

      if (!nextWidget) return current

      setAnimatingSlot(slot)
      setAnimStage('out')

      const outTimer = window.setTimeout(() => {
        setDisplayedWidgets((latest) => {
          if (slot >= latest.length) return latest
          const next = [...latest]
          next[slot] = nextWidget as HeroWidget
          return next
        })
        setAnimStage('in')

        const inTimer = window.setTimeout(() => {
          setAnimStage(null)
          setAnimatingSlot(null)
        }, 260)
        swapTimersRef.current.push(inTimer)
      }, 220)

      swapTimersRef.current.push(outTimer)
      return current
    })
  }, [])

  const scheduleSlot = useCallback((slot: number, firstDelayMs: number, periodMs: number) => {
    const tick = () => {
      runSlotSwap(slot)
      const nextTimer = window.setTimeout(tick, periodMs)
      scheduleTimersRef.current.push(nextTimer)
    }
    const firstTimer = window.setTimeout(tick, firstDelayMs)
    scheduleTimersRef.current.push(firstTimer)
  }, [runSlotSwap])

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 80)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const onResize = () => setSlots(getWidgetSlots(window.innerHeight, window.innerWidth))
    onResize()
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const onVisible = () => setTabActive(!document.hidden)
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const obs = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2 })
    obs.observe(hero)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const count = Math.min(slots, HERO_WIDGETS.length)
    clearSwapTimers()
    clearScheduleTimers()

    const timer = window.setTimeout(() => {
      setDisplayedWidgets(HERO_WIDGETS.slice(0, count))
      setAnimatingSlot(null)
      setAnimStage(null)
      nextWidgetCursorRef.current = count % HERO_WIDGETS.length
    }, 0)

    return () => window.clearTimeout(timer)
  }, [slots, clearSwapTimers, clearScheduleTimers])

  useEffect(() => () => {
    clearSwapTimers()
    clearScheduleTimers()
  }, [clearSwapTimers, clearScheduleTimers])

  useEffect(() => {
    clearScheduleTimers()
    if (!inView || !tabActive || slots >= HERO_WIDGETS.length) return

    if (slots === 1) {
      scheduleSlot(0, 2600, 3200)
    } else {
      scheduleSlot(1, 3000, 6200)
      scheduleSlot(0, 6100, 6200)
    }

    return () => {
      clearSwapTimers()
      clearScheduleTimers()
    }
  }, [inView, tabActive, slots, clearScheduleTimers, clearSwapTimers, scheduleSlot])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCartDone((current) => !current)
    }, 2400)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDeliverySeconds((current) => {
        if (current > 0) return current - 1
        setDeliveryIndex((idx) => (idx + 1) % DELIVERY_DATES.length)
        return 135
      })

      setSaleSeconds((current) => (current > 0 ? current - 1 : 8143))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  const saleParts = formatTime(saleSeconds).split(':')

  return (
    <section ref={heroRef} className={`hero ${visible ? 'hero--visible' : ''}`}>
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__glow hero__glow--left" />
        <div className="hero__glow hero__glow--right" />
        <div className="hero__grid" />
      </div>

      <div className="hero__wrap">
        <div className="hero__content">
          <p className="hero__eyebrow">Набір готових віджетів для e-commerce</p>
          <h1 className="hero__title">
            <span>Готові віджети</span>
            <span>
              що <span className="hero__title-accent">повертають</span>
            </span>
            <span className="hero__title-accent">продажі</span>
          </h1>
          <p className="hero__sub">
            Міні-блоки вже готові до запуску: показують вигоду, термін доставки
            і дедлайн акції прямо на сторінці товару.
          </p>
        </div>

        <div className="hero__bottom-group">
          <div className="hero__widgets" aria-label="Міні-версії готових віджетів">
            {displayedWidgets.map((widget, idx) => {
              const swapClass = animatingSlot === idx
                ? (animStage === 'out' ? ' hero-mini--swap-out' : animStage === 'in' ? ' hero-mini--swap-in' : '')
                : ''

              if (widget.kind === 'shipping') {
                return (
                  <article
                    className={`hero-mini hero-mini--shipping ${cartDone ? 'hero-mini--done' : ''}${swapClass}`}
                    key={`${widget.id}-${idx}`}
                  >
                    <div className="hero-mini__main">
                      <span className="hero-mini__icon hero-mini__icon--green" aria-hidden="true">
                        <Truck size={18} strokeWidth={2.25} />
                      </span>
                      <strong className="hero-mini__title">
                        {cartDone ? 'Безкоштовна доставка!' : 'До безкоштовної доставки 180 грн'}
                      </strong>
                    </div>
                    <div className="hero-mini__progress" aria-hidden="true">
                      <span />
                    </div>
                  </article>
                )
              }

              if (widget.kind === 'delivery') {
                return (
                  <article className={`hero-mini hero-mini--delivery${swapClass}`} key={`${widget.id}-${idx}`}>
                    <span className="hero-mini__icon hero-mini__icon--blue" aria-hidden="true">
                      <Calendar size={18} strokeWidth={2.25} />
                    </span>
                    <div className="hero-mini__copy">
                      <strong className="hero-mini__title" key={deliveryIndex}>
                        Доставка: {DELIVERY_DATES[deliveryIndex]}
                      </strong>
                      <span className="hero-mini__sub">Замовте протягом 2 годин</span>
                    </div>
                    <strong className="hero-mini__badge">{formatTime(deliverySeconds).slice(3)}</strong>
                  </article>
                )
              }

              return (
                <article className={`hero-mini hero-mini--sale${swapClass}`} key={`${widget.id}-${idx}`}>
                  <span className="hero-mini__icon hero-mini__icon--red" aria-hidden="true">
                    <Timer size={18} strokeWidth={2.25} />
                  </span>
                  <div className="hero-mini__copy">
                    <strong className="hero-mini__title">Акція закінчується!</strong>
                    <span className="hero-mini__sub">Знижка 20% — тільки сьогодні</span>
                  </div>
                  <div className="hero-mini__countdown" aria-label={`До кінця акції ${formatTime(saleSeconds)}`}>
                    {saleParts.map((part, index) => (
                      <span className="hero-mini__count-part" key={index}>
                        {part}
                      </span>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>

          <div className="hero__bottom">
            <Link
              to="/pricing"
              className="hero__cta"
              onClick={() => trackCtaClick('hero__cta')}
            >
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
        </div>
      </div>
    </section>
  )
}
