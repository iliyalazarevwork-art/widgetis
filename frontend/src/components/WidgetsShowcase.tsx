import { useState, useEffect } from 'react'
import {
  Sparkles,
  Zap,
  ShoppingBag,
  Eye,
  Check,
  Plus,
  X,
  ShieldCheck,
  RotateCcw,
  Truck,
} from 'lucide-react'
import { useVisible } from '../hooks/useVisible'
import './WidgetsShowcase.css'

function useLocalTime() {
  const [time, setTime] = useState(() => {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  })
  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date()
      setTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
    }, 10_000)
    return () => clearInterval(t)
  }, [])
  return time
}

// ─── Phone animation: MODO store + One-Plus-One widget ────────────────────────

// phase 0: product page (idle, marquee running)
// phase 1: page scrolled down (buy button more prominent)
// phase 2: dim + bottom sheet slides up ("Часто беруть разом")
// phase 3: first item added (green checkmark)
type Phase = 0 | 1 | 2 | 3

const PHASE_DURATIONS: Record<Phase, number> = {
  0: 1600,  // scroll gesture
  1: 1460,  // scroll settles + cursor glides to buy button + clicks
  2: 1330,  // sheet opens + cursor from center → "+" → clicks
  3: 320,   // green check flashes on open sheet, then cycle resets
}

function MarqueeItems() {
  return (
    <>
      <span className="wss__ph-mq-item">
        <Sparkles size={9} strokeWidth={2} /> Нова колекція SS26
      </span>
      <span className="wss__ph-mq-sep">·</span>
      <span className="wss__ph-mq-item">FREE доставка від 1500 грн</span>
      <span className="wss__ph-mq-sep">·</span>
      <span className="wss__ph-mq-item wss__ph-mq-item--promo">
        <Zap size={9} strokeWidth={2} /> -15% на все
      </span>
      <span className="wss__ph-mq-sep">·</span>
    </>
  )
}

const trustItems = [
  {
    icon: ShieldCheck,
  },
  {
    icon: RotateCcw,
  },
  {
    icon: Truck,
  },
]

function SlideModo() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [phase, setPhase] = useState<Phase>(0)
  const time = useLocalTime()

  useEffect(() => {
    if (!active) {
      setPhase(0)
      return
    }
    const t = setTimeout(
      () => setPhase((p) => ((p + 1) % 4) as Phase),
      PHASE_DURATIONS[phase],
    )
    return () => clearTimeout(t)
  }, [phase, active])

  const scrolled = phase >= 1
  const sheetOpen = phase >= 2
  const itemAdded = phase === 3

  return (
    <div className="wss__ph-wrap" ref={ref} data-anim={active ? 'play' : 'pause'}>
      <div className="wss__ph">
        <div className="wss__ph-frame">
          {/* Volume / power buttons */}
          <div className="wss__ph-btn wss__ph-btn--volu" />
          <div className="wss__ph-btn wss__ph-btn--vold" />
          <div className="wss__ph-btn wss__ph-btn--pwr" />

          {/* ── Screen ── */}
          <div className="wss__ph-screen">

            {/* Main scrollable content */}
            <div
              className="wss__ph-mc"
              style={{ transform: scrolled ? 'translateY(-85px)' : 'translateY(0)' }}
            >
              {/* Status bar */}
              <div className="wss__ph-sb">
                <span className="wss__ph-time">{time}</span>
                <div className="wss__ph-sbr">
                  <span className="wss__ph-bat-pct">100%</span>
                  <div className="wss__ph-bat" />
                </div>
              </div>

              {/* Marquee */}
              <div className="wss__ph-mq">
                <div className="wss__ph-mq-track">
                  <MarqueeItems />
                  <MarqueeItems />
                </div>
              </div>

              {/* Store header */}
              <div className="wss__ph-storeheader">
                <span className="wss__ph-storename">MODO</span>
                <ShoppingBag size={17} color="#fff" strokeWidth={1.5} />
              </div>

              {/* Product image */}
              <div className="wss__ph-prodimg">
                <img src="/showcase/modo-tshirt.png" alt="Футболка Oversized Graphic" loading="lazy" />
              </div>

              {/* Badges */}
              <div className="wss__ph-badges">
                <div className="wss__ph-stock">
                  <span className="wss__ph-stock-dot" />
                  <span>Залишилось 2 шт</span>
                </div>
                <div className="wss__ph-viewers">
                  <Eye size={10} color="#888" strokeWidth={2} />
                  <span>8 дивляться зараз</span>
                </div>
              </div>

              {/* Product info */}
              <div className="wss__ph-pinfo">
                <div className="wss__ph-brand-row">
                  <span className="wss__ph-brand">MODO STUDIO</span>
                  <span className="wss__ph-rating">★ 4.8</span>
                </div>
                <div className="wss__ph-ptitle">Футболка Oversized Graphic</div>
                <div className="wss__ph-pricerow">
                  <span className="wss__ph-price">1 190 грн</span>
                  <span className="wss__ph-price-old">1 490 грн</span>
                </div>
                <div className="wss__ph-sizes">
                  <span className="wss__ph-sz wss__ph-sz--active">M</span>
                  <span className="wss__ph-sz">S</span>
                  <span className="wss__ph-sz">L</span>
                  <span className="wss__ph-sz">XL</span>
                </div>
                <div
                  key={phase >= 1 ? 'hovered' : 'idle'}
                  className={`wss__ph-buybtn${phase === 1 ? ' wss__ph-buybtn--hover' : ''}`}
                >
                  Купити
                </div>
              </div>

              {/* Trust row */}
              <div className="wss__ph-trust">
                {trustItems.map(({ icon: Icon }, index) => (
                  <div key={index} className="wss__ph-trust-card" aria-hidden="true">
                    <div className="wss__ph-trust-icon">
                      <Icon size={13} strokeWidth={2.2} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cursor */}
            <div key={phase} className={`wss__ph-cursor wss__ph-cursor--p${phase}`}>
              <svg width="26" height="32" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2 L4 24 L12 19 L20 24 Z"
                  fill="white"
                  stroke="#111111"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  transform="rotate(-30 12 15)"
                />
              </svg>
            </div>

            {/* Dim overlay */}
            <div
              className="wss__ph-dim"
              style={{ opacity: sheetOpen ? 1 : 0, pointerEvents: sheetOpen ? 'auto' : 'none' }}
            />

            {/* Bottom sheet */}
            <div
              className="wss__ph-sheet"
              style={{ transform: sheetOpen ? 'translateY(0)' : 'translateY(100%)' }}
            >
              <div className="wss__ph-shhandle" />
              <div className="wss__ph-shhead">
                <span className="wss__ph-shtitle">Часто беруть разом</span>
                <X size={15} color="#bbb" strokeWidth={2} />
              </div>
              <div className="wss__ph-shdivider" />

              <div className="wss__ph-shitems">
                {/* Item 1 */}
                <div className="wss__ph-shitem">
                  <img className="wss__ph-shimg" src="/showcase/modo-socks.png" alt="Носки" loading="lazy" />
                  <div className="wss__ph-shtxt">
                    <div className="wss__ph-shname">Носки Cotton White Pack</div>
                    <div className="wss__ph-shprice">149 грн</div>
                  </div>
                  <button
                    key={itemAdded ? 'done' : 'add'}
                    className={`wss__ph-shadd${phase === 2 ? ' wss__ph-shadd--hover' : ''}${itemAdded ? ' wss__ph-shadd--done' : ''}`}
                  >
                    {itemAdded
                      ? <Check size={14} color="#fff" strokeWidth={2.5} />
                      : <Plus size={14} color="#fff" strokeWidth={2.5} />}
                  </button>
                </div>

                <div className="wss__ph-shdivider" />

                {/* Item 2 */}
                <div className="wss__ph-shitem">
                  <img className="wss__ph-shimg" src="/showcase/modo-cap.png" alt="Кепка" loading="lazy" />
                  <div className="wss__ph-shtxt">
                    <div className="wss__ph-shname">Кепка Five Panel Black</div>
                    <div className="wss__ph-shprice">490 грн</div>
                  </div>
                  <button className="wss__ph-shadd">
                    <Plus size={14} color="#fff" strokeWidth={2.5} />
                  </button>
                </div>

                <div className="wss__ph-shdivider" />

                {/* Item 3 */}
                <div className="wss__ph-shitem">
                  <img className="wss__ph-shimg" src="/showcase/modo-shorts.png" alt="Шорти" loading="lazy" />
                  <div className="wss__ph-shtxt">
                    <div className="wss__ph-shname">Шорти Cargo Flow Beige</div>
                    <div className="wss__ph-shprice">890 грн</div>
                  </div>
                  <button className="wss__ph-shadd">
                    <Plus size={14} color="#fff" strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              <div className="wss__ph-shcta">
                <div className="wss__ph-shctabtn">Оформити замовлення</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function WidgetsShowcase() {
  return (
    <section className="wss">
      <div className="wss__header">
        <p className="wss__eyebrow">Демонстрація</p>
        <h2 className="wss__title">
          <span className="wss__title-accent">Віджети</span> в дії
        </h2>
        <p className="wss__subtitle">
          Реальні магазини. Живі інтерактивні приклади.
        </p>
      </div>

      <SlideModo />
    </section>
  )
}
