import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Gem, Star } from 'lucide-react'
import { trackCtaClick } from '../lib/analytics'
import './Hero.css'

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function formatUa(value: number, decimals: number): string {
  return value.toFixed(decimals).replace('.', ',')
}

function useCountUp(from: number, to: number, decimals: number, run: boolean, durationMs = 1400, delayMs = 0) {
  const [value, setValue] = useState(from)
  const rafRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!run) {
      setValue(from)
      return
    }
    const start = () => {
      const t0 = performance.now()
      const tick = (now: number) => {
        const elapsed = now - t0
        const progress = Math.min(1, elapsed / durationMs)
        setValue(from + (to - from) * easeOutCubic(progress))
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    if (delayMs > 0) {
      timerRef.current = window.setTimeout(start, delayMs)
    } else {
      start()
    }
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [run, from, to, decimals, durationMs, delayMs])

  return formatUa(value, decimals)
}

export function Hero() {
  const metricsRef = useRef<HTMLDivElement | null>(null)
  const [run, setRun] = useState(false)

  useEffect(() => {
    const node = metricsRef.current
    if (!node) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRun(true)
          obs.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [])

  const conversion = useCountUp(2.1, 2.4, 1, run, 1600, 0)
  const conversionDelta = useCountUp(0.0, 0.3, 1, run, 1600, 0)
  const checkAbs = useCountUp(60, 180, 0, run, 1800, 100)
  const checkRel = useCountUp(4, 12, 0, run, 1600, 100)

  return (
    <section className="hero hero--visible">
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__glow hero__glow--left" />
        <div className="hero__glow hero__glow--right" />
        <div className="hero__grid" />
      </div>

      <div className="hero__wrap">
        <div className="hero__top">
          <p className="hero__eyebrow">
            <Gem size={14} strokeWidth={2.25} />
            Зроблено для Хорошоп
          </p>
          <h1 className="hero__title">
            Більший чек<br />з кожного замовлення.
          </h1>
          <p className="hero__sub">
            Спробуйте — побачите різницю за тиждень.
          </p>
        </div>

        <div className="hero__metrics" ref={metricsRef}>
          <p className="hero__metrics-caption">У наших клієнтів за тиждень</p>
          <div className="hero__metric-cards">
            <div className="hero__metric-card">
              <span className="hero__metric-label">КОНВЕРСІЯ</span>
              <div className="hero__metric-values">
                <span className="hero__metric-value">{conversion}%</span>
                <span className="hero__metric-delta">+{conversionDelta}%</span>
              </div>
            </div>
            <div className="hero__metric-divider" aria-hidden="true" />
            <div className="hero__metric-card">
              <span className="hero__metric-label">СЕРЕДНІЙ ЧЕК</span>
              <div className="hero__metric-values">
                <span className="hero__metric-value">+{checkAbs} ₴</span>
                <span className="hero__metric-delta">+{checkRel}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hero__trust">
          <Star size={13} strokeWidth={0} fill="#FBBF24" />
          <span>4.9 · 120+ українських магазинів</span>
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
            to="/free-demo"
            className="hero__cta hero__cta--secondary"
            onClick={() => trackCtaClick('hero__cta')}
          >
            Подивитися демо
            <ArrowRight size={14} strokeWidth={2.25} />
          </Link>
        </div>
      </div>
    </section>
  )
}
