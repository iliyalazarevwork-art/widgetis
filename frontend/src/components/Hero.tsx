import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Star } from 'lucide-react'
import { PreviewCartGoal, PreviewCountdown, PreviewDelivery, PreviewPurchaseCounter } from './WidgetPreviews'
import './Hero.css'

type HeroWidget = {
  id: string
  kind: 'delivery' | 'deadline' | 'countdown' | 'purchase'
}

const HERO_WIDGETS: HeroWidget[] = [
  { id: 'delivery', kind: 'delivery' },
  { id: 'deadline', kind: 'deadline' },
  { id: 'countdown', kind: 'countdown' },
  { id: 'purchase', kind: 'purchase' },
]

function getWidgetSlots(viewportHeight: number, viewportWidth: number) {
  if (viewportWidth >= 1024) return 3
  if (viewportHeight >= 700) return 3
  return 2
}

export function Hero() {
  const heroRef = useRef<HTMLElement | null>(null)
  const nextWidgetCursorRef = useRef(0)
  const swapTimersRef = useRef<number[]>([])
  const scheduleTimersRef = useRef<number[]>([])

  const [slots, setSlots] = useState(3)
  const [displayedWidgets, setDisplayedWidgets] = useState<HeroWidget[]>(HERO_WIDGETS.slice(0, 3))
  const [animatingSlot, setAnimatingSlot] = useState<number | null>(null)
  const [animStage, setAnimStage] = useState<'out' | 'in' | null>(null)
  const [inView, setInView] = useState(false)
  const [tabActive, setTabActive] = useState(!document.hidden)

  const clearSwapTimers = () => {
    swapTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    swapTimersRef.current = []
  }

  const clearScheduleTimers = () => {
    scheduleTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    scheduleTimersRef.current = []
  }

  const runSlotSwap = (slot: number) => {
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

      if (!nextWidget) {
        nextWidget = HERO_WIDGETS[nextWidgetCursorRef.current]
        nextWidgetCursorRef.current = (nextWidgetCursorRef.current + 1) % HERO_WIDGETS.length
      }

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
  }

  const scheduleSlot = (slot: number, firstDelayMs: number, periodMs: number) => {
    const tick = () => {
      runSlotSwap(slot)
      const nextTimer = window.setTimeout(tick, periodMs)
      scheduleTimersRef.current.push(nextTimer)
    }
    const firstTimer = window.setTimeout(tick, firstDelayMs)
    scheduleTimersRef.current.push(firstTimer)
  }

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
    const initial = HERO_WIDGETS.slice(0, count)
    setDisplayedWidgets(initial)
    setAnimatingSlot(null)
    setAnimStage(null)
    nextWidgetCursorRef.current = count % HERO_WIDGETS.length
    clearSwapTimers()
    clearScheduleTimers()
  }, [slots])

  useEffect(() => () => {
    clearSwapTimers()
    clearScheduleTimers()
  }, [])

  useEffect(() => {
    if (!inView || !tabActive) return
    clearScheduleTimers()

    if (slots === 1) {
      scheduleSlot(0, 3000, 3000)
    } else if (slots === 2) {
      scheduleSlot(1, 3000, 6000)
      scheduleSlot(0, 6000, 6000)
    } else if (slots >= 3) {
      scheduleSlot(2, 3200, 9000)
      scheduleSlot(1, 6200, 9000)
      scheduleSlot(0, 9200, 9000)
    }

    return () => {
      clearSwapTimers()
      clearScheduleTimers()
    }
  }, [inView, tabActive, slots])

  return (
    <section ref={heroRef} className="hero hero--visible">
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__glow hero__glow--left" />
        <div className="hero__glow hero__glow--right" />
        <div className="hero__grid" />
      </div>

      <div className="hero__wrap">
        <div className="hero__content">
          <p className="hero__eyebrow">
            <Sparkles size={11} strokeWidth={2.5} />
            Набір готових віджетів для e-commerce
          </p>
          <h1 className="hero__title">
            <span>Віджети,</span>
            <span>що самі</span>
            <span className="hero__title-accent">продають.</span>
          </h1>
          <p className="hero__sub">
            Встановіть за 2 хвилини — і магазин починає конвертувати краще.
          </p>
        </div>

        <div className="hero__bottom-group">
          <div className="hero__widgets" aria-live="polite">
            {displayedWidgets.map((widget, idx) => {
              const swapClass = animatingSlot === idx
                ? (animStage === 'out' ? ' hero__widget-card--swap-out' : animStage === 'in' ? ' hero__widget-card--swap-in' : '')
                : ''

              if (widget.kind === 'delivery') {
                return (
                  <article className={`hero__widget-card hero__widget-card--preview${swapClass}`} key={`${widget.id}-${idx}`}>
                    <PreviewCartGoal />
                  </article>
                )
              }

              if (widget.kind === 'deadline') {
                return (
                  <article className={`hero__widget-card hero__widget-card--preview${swapClass}`} key={`${widget.id}-${idx}`}>
                    <PreviewDelivery />
                  </article>
                )
              }

              if (widget.kind === 'purchase') {
                return (
                  <article className={`hero__widget-card hero__widget-card--preview${swapClass}`} key={`${widget.id}-${idx}`}>
                    <PreviewPurchaseCounter />
                  </article>
                )
              }

              return (
                <article className={`hero__widget-card hero__widget-card--preview${swapClass}`} key={`${widget.id}-${idx}`}>
                  <PreviewCountdown />
                </article>
              )
            })}
          </div>

          <div className="hero__bottom">
            <Link to="/pricing" className="hero__cta">
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
