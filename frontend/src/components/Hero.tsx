import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Gem, Star, TrendingUp } from 'lucide-react'
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
  const [prevRun, setPrevRun] = useState(run)
  const [prevFrom, setPrevFrom] = useState(from)
  const rafRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)

  if (prevRun !== run || prevFrom !== from) {
    setPrevRun(run)
    setPrevFrom(from)
    if (!run) setValue(from)
  }

  useEffect(() => {
    if (!run) return
    const start = () => {
      const t0 = performance.now()
      const tick = (now: number) => {
        const elapsed = now - t0
        const progress = Math.min(1, elapsed / durationMs)
        setValue(from + (to - from) * easeOutCubic(progress))
        if (progress < 1) rafRef.current = requestAnimationFrame(tick)
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

// 0–5 s: fast ticks every FAST_PULSE_MS.
// 5–60 s: delay grows exponentially — delay = FAST_PULSE_MS * e^(k*(elapsed-FAST_PHASE_MS))
//          k chosen so that at 60 s the delay reaches ~30 s (effectively frozen).
// After 60 s: hard stop, value freezes wherever it is.
const ANIM_MS       = 60_000
const FAST_PHASE_MS = 5_000
const FAST_PULSE_MS = 500
const TAU_MS        = 15_000 // controls how fast value approaches target
// k = ln(3 000 000 / FAST_PULSE_MS) / (ANIM_MS - FAST_PHASE_MS) ≈ 0.000158 per ms
// At t=10 s → ~1 s delay, t=20 s → ~5 s, t=30 s → ~26 s (nearly frozen)
const SLOW_K = Math.log(3_000_000 / FAST_PULSE_MS) / (ANIM_MS - FAST_PHASE_MS)

function useAsymptoticValue(
  from: number,
  to: number,
  decimals: number,
  enabled: boolean,
): { formatted: string; tick: number } {
  const [formatted, setFormatted] = useState(formatUa(from, decimals))
  const [tick, setTick] = useState(0)
  const startMs = useRef(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) return
    startMs.current = Date.now()

    const scheduleNext = () => {
      const elapsed = Date.now() - startMs.current
      if (elapsed >= ANIM_MS) return // freeze

      const delay = elapsed < FAST_PHASE_MS
        ? FAST_PULSE_MS
        : FAST_PULSE_MS * Math.exp(SLOW_K * (elapsed - FAST_PHASE_MS))

      timerRef.current = window.setTimeout(() => {
        const e2 = Date.now() - startMs.current
        const t = 1 - Math.exp(-e2 / TAU_MS)
        const next = formatUa(from + (to - from) * t, decimals)
        setFormatted(prev => { if (next !== prev) setTick(n => n + 1); return next })
        scheduleNext()
      }, delay)
    }

    scheduleNext()
    return () => { if (timerRef.current !== null) window.clearTimeout(timerRef.current) }
  }, [enabled, from, to, decimals])

  return { formatted, tick }
}

const COUNT_UP_DURATION = 1800

export function Hero() {
  const metricsRef = useRef<HTMLDivElement | null>(null)
  const [phase, setPhase] = useState<'idle' | 'counting' | 'live'>('idle')

  useEffect(() => {
    const node = metricsRef.current
    if (!node) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhase('counting')
          window.setTimeout(() => setPhase('live'), COUNT_UP_DURATION + 200)
          obs.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [])

  const counting = phase === 'counting'
  const live = phase === 'live'

  // ── Count-up phase (idle defaults → good values, 1.8 s) ──
  const conversionUp      = useCountUp(1.8, 2.4, 1, counting, COUNT_UP_DURATION)
  const conversionDeltaUp = useCountUp(0.1, 0.3, 1, counting, COUNT_UP_DURATION)
  const checkAbsUp        = useCountUp(190, 270, 0, counting, COUNT_UP_DURATION, 100)
  const checkRelUp        = useCountUp(8,    12, 0, counting, COUNT_UP_DURATION, 100)

  // ── Live phase (asymptotic, 60 s, then freeze) ──
  const { formatted: conversion,      tick: conversionTick } = useAsymptoticValue(2.4, 9.0, 1, live)
  const { formatted: conversionDelta, tick: deltaTick      } = useAsymptoticValue(0.3, 6.9, 1, live)
  const { formatted: checkAbs,        tick: checkAbsTick   } = useAsymptoticValue(270, 480, 0, live)
  const { formatted: checkRel,        tick: checkRelTick   } = useAsymptoticValue(12,   28, 0, live)

  // idle: show non-zero defaults immediately on page load
  const cvStr  = live ? conversion      : (counting ? conversionUp      : '1,8')
  const cvdStr = live ? conversionDelta : (counting ? conversionDeltaUp : '0,1')
  const caStr  = live ? checkAbs        : (counting ? checkAbsUp        : '190')
  const crStr  = live ? checkRel        : (counting ? checkRelUp        : '8')

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
            Віджети для Хорошоп
          </p>
          <h1 className="hero__title">
            Збільшіть чек<br /><span className="hero__title-keyword">кожного</span> замовлення
          </h1>
          <p className="hero__sub">
            Спробуйте — побачите різницю за тиждень
          </p>
        </div>

        <div className="hero__metrics" ref={metricsRef}>
          <p className="hero__metrics-caption">У наших клієнтів за тиждень</p>
          <div className="hero__metric-cards">
            <div className="hero__metric-card">
              <span className="hero__metric-label">
                КОНВЕРСІЯ
                <TrendingUp size={11} strokeWidth={2.5} className="hero__metric-trend" />
              </span>
              <div className="hero__metric-values">
                <span key={live ? conversionTick : 'cv'} className={`hero__metric-value${live ? ' hero__metric-value--bump' : ''}`}>{cvStr}%</span>
                <span key={live ? `d${deltaTick}` : 'cvd'} className={`hero__metric-delta${live ? ' hero__metric-delta--bump' : ''}`}>+{cvdStr}%</span>
              </div>
            </div>
            <div className="hero__metric-divider" aria-hidden="true" />
            <div className="hero__metric-card">
              <span className="hero__metric-label">СЕРЕДНІЙ ЧЕК</span>
              <div className="hero__metric-values">
                <span key={live ? checkAbsTick : 'ca'} className={`hero__metric-value${live ? ' hero__metric-value--bump' : ''}`}>+{caStr} ₴</span>
                <span key={live ? `cr${checkRelTick}` : 'cr'} className={`hero__metric-delta${live ? ' hero__metric-delta--bump' : ''}`}>+{crStr}%</span>
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
