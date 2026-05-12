import { useState, useEffect, useRef } from 'react'
import { Star, BadgeCheck, ExternalLink, Box, ChevronLeft, ChevronRight } from 'lucide-react'
import { useVisible } from '../hooks/useVisible'
import { PLANS, type PlanSlug } from '../data/plans'
import './Testimonials.css'

// Parse "+2 130 ₴" → { prefix: "+", num: 2130, suffix: " ₴" }
function parseMetric(value: string) {
  const match = value.match(/^(\D*)([\d\s]+)(.*)$/)
  if (!match) return { prefix: '', num: 0, suffix: value }
  return {
    prefix: match[1],
    num: parseInt(match[2].replace(/\s/g, ''), 10) || 0,
    suffix: match[3],
  }
}

// Format number with thin space as thousands separator: 2130 → "2 130"
function formatNum(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function CountUp({ value, run, duration = 1400 }: { value: string; run: boolean; duration?: number }) {
  const { prefix, num, suffix } = parseMetric(value)
  // Delta: 10% of target, мін 3, макс 80 — щоб тіків було помітно, але не занадто
  const delta = Math.max(3, Math.min(Math.round(num * 0.1), 80))
  const startValue = Math.max(0, num - delta)
  const [current, setCurrent] = useState(startValue)

  useEffect(() => {
    if (!run) {
      setCurrent(num)
      return
    }
    setCurrent(startValue)
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      // easeOutCubic — швидко стартує, плавно завершує
      const eased = 1 - Math.pow(1 - t, 3)
      setCurrent(startValue + Math.round((num - startValue) * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [num, duration, run])

  return (
    <>
      {prefix}
      {formatNum(current)}
      {suffix}
    </>
  )
}

type MetricType = 'traffic' | 'revenue'

interface Metric {
  value: string
  label: string
  type: MetricType
}

interface Testimonial {
  quote: string
  owner: string
  role: string
  avatar?: string
  rating: number
  store: string
  storeUrl: string
  purchase: string
  plan?: PlanSlug
  metrics: Metric[]
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: 'Протестили — все круто. Встановили швидко, без програміста.',
    owner: 'Денис',
    role: 'Власник',
    avatar: '/reviews/denis-ballistic.webp',
    rating: 5,
    store: 'ballistic.com.ua',
    storeUrl: 'https://ballistic.com.ua/',
    purchase: 'Тариф Pro',
    plan: 'pro',
    metrics: [
      { value: '+9%', label: 'конверсія', type: 'traffic' },
      { value: '+2 131 ₴', label: 'середній чек', type: 'revenue' },
    ],
  },
  {
    quote: 'Задоволений на 100%. Підібрали віджети саме під нашу нішу.',
    owner: 'Ігор',
    role: 'Власник',
    avatar: '/reviews/igor-ptashkinsad.webp',
    rating: 5,
    store: 'ptashkinsad.com',
    storeUrl: 'https://ptashkinsad.com/',
    purchase: 'Тариф Max',
    plan: 'max',
    metrics: [
      { value: '+11%', label: 'до кошика', type: 'traffic' },
      { value: '+379 ₴', label: 'середній чек', type: 'revenue' },
    ],
  },
  {
    quote: 'Поставили — і одразу бачимо віддачу від відвідувачів.',
    owner: 'Олександр',
    role: 'Власник',
    avatar: '/reviews/Alex.webp',
    rating: 5,
    store: 'shop.aquamyrgorod.com.ua',
    storeUrl: 'https://shop.aquamyrgorod.com.ua/',
    purchase: 'Тариф Free',
    plan: 'free',
    metrics: [
      { value: '+14%', label: 'конверсія', type: 'traffic' },
      { value: '+419 ₴', label: 'середній чек', type: 'revenue' },
    ],
  },
  {
    quote: 'Віджет "Дата доставки" зайшов прям ідеально під наш магазин.',
    owner: 'Катерина',
    role: 'Власниця',
    avatar: '/reviews/kate.webp',
    rating: 5,
    store: 'zoo-vet.com.ua',
    storeUrl: 'https://zoo-vet.com.ua/',
    purchase: '1 віджет · Дата доставки',
    metrics: [
      { value: '+11%', label: 'замовлень', type: 'traffic' },
      { value: '+281 ₴', label: 'середній чек', type: 'revenue' },
    ],
  },
]

function PurchaseBadge({ purchase, plan }: { purchase: string; plan?: PlanSlug }) {
  const planDef = plan ? PLANS.find(p => p.id === plan) : null
  const Icon = planDef ? planDef.icon : Box
  const color = planDef ? planDef.color : '#888888'
  return (
    <div className="tst__purchase" style={{ borderColor: `${color}33`, color }}>
      <Icon size={12} strokeWidth={2.5} color={color} />
      <span>{purchase}</span>
    </div>
  )
}

export function Testimonials() {
  const { ref: sectionRef, active } = useVisible<HTMLElement>()
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const dragStartX = useRef<number | null>(null)
  const dragDeltaX = useRef(0)
  const dragged = useRef(false)

  useEffect(() => {
    if (paused || !active) return
    const t = setInterval(
      () => setCurrent((c) => (c + 1) % TESTIMONIALS.length),
      5000,
    )
    return () => clearInterval(t)
  }, [paused, active])

  function goToPrev() {
    setPaused(true)
    setCurrent((c) => (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
  }

  function goToNext() {
    setPaused(true)
    setCurrent((c) => (c + 1) % TESTIMONIALS.length)
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    dragStartX.current = e.clientX
    dragDeltaX.current = 0
    dragged.current = false
    setPaused(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (dragStartX.current === null) return
    dragDeltaX.current = e.clientX - dragStartX.current
    if (Math.abs(dragDeltaX.current) > 8) dragged.current = true
  }

  function onPointerEnd() {
    const dx = dragDeltaX.current
    if (Math.abs(dx) > 40) {
      if (dx < 0) goToNext()
      else goToPrev()
    }
    dragStartX.current = null
    dragDeltaX.current = 0
    window.setTimeout(() => {
      dragged.current = false
    }, 0)
  }

  return (
    <section
      ref={sectionRef}
      className="tst"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="tst__header">
        <p className="tst__eyebrow">Справжні кейси · справжні цифри</p>
        <h2 className="tst__title">
          Що кажуть <span className="tst__title-accent">клієнти</span>
        </h2>
      </div>

      <div
        className="tst__viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <button
          type="button"
          className="tst__arrow tst__arrow--prev"
          onClick={goToPrev}
          aria-label="Попередній відгук"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>

        <div className="tst__track">
          {TESTIMONIALS.map((t, i) => {
            const offset = i - current
            const wrapped =
              offset > TESTIMONIALS.length / 2
                ? offset - TESTIMONIALS.length
                : offset < -TESTIMONIALS.length / 2
                ? offset + TESTIMONIALS.length
                : offset
            const isActive = wrapped === 0
            const isNeighbor = Math.abs(wrapped) === 1
            const isVisible = isActive || isNeighbor
            return (
              <article
                key={i}
                className={`tst__card ${isActive ? 'tst__card--active' : ''}`}
                style={{
                  transform: `translateX(${wrapped * 78}%) scale(${isActive ? 1 : 0.82})`,
                  opacity: isVisible ? (isActive ? 1 : 0.35) : 0,
                  zIndex: isActive ? 2 : 1,
                  pointerEvents: isActive ? 'auto' : 'none',
                }}
                onClick={() => {
                  if (dragged.current) return
                  if (!isActive && isNeighbor) {
                    setPaused(true)
                    setCurrent(i)
                  }
                }}
              >
                <PurchaseBadge purchase={t.purchase} plan={t.plan} />

                <div className="tst__stars">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      size={14}
                      strokeWidth={0}
                      fill={j < t.rating ? '#fbbf24' : 'rgba(255,255,255,0.12)'}
                    />
                  ))}
                </div>

                <div
                  className="tst__metrics"
                  key={isActive ? `m-${current}` : `m-static-${i}`}
                >
                  {t.metrics.map((m, j) => (
                    <div key={j} className="tst__metric" style={{ animationDelay: `${j * 150}ms` }}>
                      <span className="tst__metric-value">
                        <CountUp value={m.value} run={isActive} duration={1400 + j * 200} />
                      </span>
                      <span className="tst__metric-label">{m.label}</span>
                    </div>
                  ))}
                </div>

                <p className="tst__quote">«{t.quote}»</p>

                <div className="tst__author">
                  {t.avatar ? (
                    <img src={t.avatar} alt={t.owner} className="tst__avatar" loading="lazy" decoding="async" width="64" height="64" />
                  ) : (
                    <div className="tst__avatar tst__avatar--ph">
                      {t.owner.charAt(0)}
                    </div>
                  )}
                  <div className="tst__author-info">
                    <div className="tst__owner">
                      {t.owner}
                      <BadgeCheck
                        size={13}
                        strokeWidth={2.5}
                        className="tst__verified"
                      />
                    </div>
                    <a
                      href={t.storeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tst__store-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t.store}
                      <ExternalLink size={11} strokeWidth={2.25} />
                    </a>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        <button
          type="button"
          className="tst__arrow tst__arrow--next"
          onClick={goToNext}
          aria-label="Наступний відгук"
        >
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="tst__dots-nav">
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`tst__dot ${i === current ? 'tst__dot--active' : ''}`}
            onClick={() => {
              setPaused(true)
              setCurrent(i)
            }}
            aria-label={`Відгук ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
