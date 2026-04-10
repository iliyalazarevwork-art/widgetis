import { useState, useEffect } from 'react'
import { Eye, ShoppingCart, Leaf, Gift, Star, Sparkles, Flame, Zap, Truck, Briefcase, PartyPopper, Timer } from 'lucide-react'
import NP_LOGO from '../assets/nova-poshta-logo'
import { useVisible } from '../hooks/useVisible'
import './WidgetsShowcase.css'


const MONTHS_UK = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня']
function getTomorrow() {
  const d = new Date(); d.setDate(d.getDate() + 1)
  return `${d.getDate()} ${MONTHS_UK[d.getMonth()]}`
}

// ─── Shared: browser chrome ───────────────────────────────────────────────────

function BrowserChrome({ url }: { url: string }) {
  return (
    <div className="wss__browser">
      <div className="wss__dots"><span /><span /><span /></div>
      <div className="wss__url">{url}</div>
    </div>
  )
}

// ─── Slide 1: Ptashkin Sad ────────────────────────────────────────────────────

const PTASHKIN_PRICE = 1195
const PTASHKIN_THRESHOLD = 3000
const PTASHKIN_STEPS = [PTASHKIN_PRICE, PTASHKIN_PRICE * 2, PTASHKIN_PRICE * 3]

function SlidePtashkin() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [stepIdx, setStepIdx] = useState(0)
  const cart = PTASHKIN_STEPS[stepIdx]
  const achieved = cart >= PTASHKIN_THRESHOLD

  useEffect(() => {
    if (!active) return
    const delay = achieved ? 2800 : 1600
    const t = setTimeout(() => {
      setStepIdx((i) => (i + 1) % PTASHKIN_STEPS.length)
    }, delay)
    return () => clearTimeout(t)
  }, [stepIdx, achieved, active])

  const cartCount = stepIdx + 1

  return (
    <div className="wss__card wss__card--ptashkin" ref={ref}>
      <BrowserChrome url="ptashkinsad.com" />
      <div className="wss__marquee wss__marquee--ptashkin">
        <div className="wss__marquee-track">
          <span><Leaf size={11} strokeWidth={2.25} /> Безкоштовна доставка від 3000 грн</span>
          <span><Gift size={11} strokeWidth={2.25} /> -10% при першій покупці</span>
          <span><Star size={11} strokeWidth={2.25} /> 52 відгуки на Pure крем</span>
          <span><Leaf size={11} strokeWidth={2.25} /> Безкоштовна доставка від 3000 грн</span>
        </div>
      </div>
      <div className="wss__body">
        <div className="wss__store-header wss__store-header--ptashkin">
          <span className="wss__store-logo wss__store-logo--ptashkin">ptashkin sad</span>
          <div className="wss__cart-indicator">
            <ShoppingCart size={15} strokeWidth={1.5} />
            <span key={cartCount} className="wss__cart-count">{cartCount}</span>
          </div>
        </div>
        <div className="wss__product">
          <div className="wss__product-img wss__product-img--ptashkin">
            <img src="/showcase/ptashkin-pure@220.webp" alt="Pure крем" className="wss__product-photo" loading="lazy" decoding="async" width="220" height="220" />
          </div>
          <div className="wss__product-info">
            <p className="wss__product-title wss__product-title--ptashkin">Крем-бустер Pure</p>
            <span className="wss__product-variant">35 ml</span>
            <div className="wss__prices">
              <span className="wss__price wss__price--ptashkin">1 195 грн</span>
            </div>
            <div className="wss__dd">
              <img src={NP_LOGO} className="wss__dd-logo" alt="Нова Пошта" loading="lazy" decoding="async" width="40" height="40" />
              <span className="wss__dd-text--ptashkin">Завтра, <strong>{getTomorrow()}</strong></span>
            </div>
            <button
              key={stepIdx}
              className="wss__btn wss__btn--ptashkin wss__btn--pulsed"
            >
              Купити
            </button>
          </div>
        </div>
        <CartGoalWidget cart={cart} threshold={PTASHKIN_THRESHOLD} achieved={achieved} />
      </div>
    </div>
  )
}

function CartGoalWidget({
  cart,
  threshold,
  achieved,
}: {
  cart: number
  threshold: number
  achieved: boolean
}) {
  const remaining = Math.max(0, threshold - cart)
  const progressPct = Math.min(100, (cart / threshold) * 100)

  return (
    <div className={`wss__goal ${achieved ? 'wss__goal--achieved' : 'wss__goal--ptashkin'}`}>
      <span className="wss__goal-emoji">
        {achieved
          ? <PartyPopper size={22} strokeWidth={2.25} />
          : <Gift size={22} strokeWidth={2.25} />}
      </span>
      <div className="wss__goal-content">
        {achieved ? (
          <span>
            <strong>У вас безкоштовна доставка!</strong>
          </span>
        ) : (
          <span>
            До безкоштовної доставки залишилось <strong>{remaining} грн</strong>
          </span>
        )}
        <div className="wss__goal-bar">
          <div
            className={`wss__goal-fill ${achieved ? 'wss__goal-fill--achieved' : 'wss__goal-fill--ptashkin'}`}
            style={{ transform: `scaleX(${progressPct / 100})` }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Slide 2: Beni Home ───────────────────────────────────────────────────────

function SlideBeniHome() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [count, setCount] = useState(12)
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setCount(c => Math.max(6, c + (Math.random() > 0.5 ? 1 : -1))), 2200)
    return () => clearInterval(t)
  }, [active])
  return (
    <div className="wss__card wss__card--beni" ref={ref}>
      <BrowserChrome url="benihome.com.ua" />
      <div className="wss__marquee wss__marquee--beni">
        <div className="wss__marquee-track">
          <span><Gift size={11} strokeWidth={2.25} /> -30% на сатинову колекцію</span>
          <span><Truck size={11} strokeWidth={2.25} /> Безкоштовна доставка від 3000 грн</span>
          <span><Sparkles size={11} strokeWidth={2.25} /> Новинки Весна 2026</span>
          <span><Gift size={11} strokeWidth={2.25} /> -30% на сатинову колекцію</span>
        </div>
      </div>
      <div className="wss__body">
        <div className="wss__store-header wss__store-header--beni">
          <span className="wss__store-logo wss__store-logo--beni">Beni Home</span>
          <ShoppingCart size={15} strokeWidth={1.5} />
        </div>
        <div className="wss__product">
          <div className="wss__product-img wss__product-img--beni">
            <img src="/showcase/beni-satin@220.webp" alt="Постільна білизна" className="wss__product-photo" loading="lazy" decoding="async" width="220" height="330" />
            <span className="wss__badge-discount">-30%</span>
          </div>
          <div className="wss__product-info">
            <p className="wss__product-title wss__product-title--beni">Постільна білизна Сатин</p>
            <span className="wss__product-variant">Полуторний · Ivory</span>
            <div className="wss__prices">
              <span className="wss__price wss__price--beni">4 340 грн</span>
              <span className="wss__price-old">6 200 грн</span>
            </div>
            <div className="wss__viewers-inline">
              <span className="wss__viewers-dot" />
              <Eye size={10} strokeWidth={2} />
              <span><strong>{count}</strong> дивляться зараз</span>
            </div>
            <button className="wss__btn wss__btn--beni">Замовити</button>
          </div>
        </div>
      </div>
      <div className="wss__video-widget">
        <div className="wss__video-label">
          <span className="wss__video-label-dot" />
          ВІДЕО ТОВАРУ
        </div>
        <div className="wss__video-circle wss__video-circle--beni">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="Демонстрація товару BENI — постільна білизна"
          >
            <source src="/showcase/beni-video.webm" type="video/webm" />
            <source src="/showcase/beni-video.mp4" type="video/mp4" />
            <track kind="captions" src="/showcase/beni-video.vtt" srcLang="uk" label="Без субтитрів" default />
          </video>
          <div className="wss__video-pulse" />
        </div>
      </div>
    </div>
  )
}

// ─── Slide 3: Ballistic ───────────────────────────────────────────────────────

function SlideBallistic() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [seconds, setSeconds] = useState(4 * 3600 + 27 * 60 + 13)
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setSeconds(s => s > 0 ? s - 1 : 0), 1000)
    return () => clearInterval(t)
  }, [active])
  const hh = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <div className="wss__card wss__card--ballistic" ref={ref}>
      <BrowserChrome url="ballistic.com.ua" />
      <div className="wss__marquee wss__marquee--ballistic">
        <div className="wss__marquee-track">
          <span><Flame size={11} strokeWidth={2.25} /> Дропшипінг без клопотів</span>
          <span><Zap size={11} strokeWidth={2.25} /> Доставка по всій Україні</span>
          <span><Briefcase size={11} strokeWidth={2.25} /> Опт і роздріб — вигідно</span>
          <span><Flame size={11} strokeWidth={2.25} /> Дропшипінг без клопотів</span>
        </div>
      </div>
      <div className="wss__body">
        <div className="wss__store-header wss__store-header--ballistic">
          <span className="wss__store-logo wss__store-logo--ballistic">BALLISTIC</span>
          <ShoppingCart size={15} strokeWidth={2} />
        </div>
        <div className="wss__product">
          <div className="wss__product-img wss__product-img--ballistic">
            <img src="/showcase/ballistic-jacket@220.webp" alt="Куртка ECWCS" className="wss__product-photo" loading="lazy" decoding="async" width="220" height="220" />
          </div>
          <div className="wss__product-info">
            <p className="wss__product-title wss__product-title--ballistic">Куртка ECWCS L5 Soft Shell</p>
            <span className="wss__product-variant">Medium Regular · ACU</span>
            <div className="wss__prices">
              <span className="wss__price wss__price--ballistic">5 175 грн</span>
              <span className="wss__hot-inline"><Flame size={10} strokeWidth={2.5} /> 10 купили</span>
            </div>
            <div className="wss__stock wss__stock--ballistic">
              <span className="wss__stock-dot" />
              Залишилось <strong>2 шт</strong>
            </div>
            <button className="wss__btn wss__btn--ballistic">Купити</button>
          </div>
        </div>
        <div className="wss__countdown">
          <span className="wss__countdown-label"><Timer size={11} strokeWidth={2.5} /> Замов сьогодні — отримай завтра</span>
          <div className="wss__countdown-timer">
            <span className="wss__countdown-cell">{hh}</span>
            <span className="wss__countdown-sep">:</span>
            <span className="wss__countdown-cell">{mm}</span>
            <span className="wss__countdown-sep">:</span>
            <span className="wss__countdown-cell">{ss}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Packages config ──────────────────────────────────────────────────────────

const PACKAGES = [
  {
    id: 'basic',
    tier: 'BASIC',
    label: 'Доставка та кошик',
    sub: 'Бігуча стрічка · Дата доставки · Ціль кошика',
    component: SlidePtashkin,
  },
  {
    id: 'pro',
    tier: 'PRO',
    label: 'Відео та перегляди',
    sub: 'Бігуча стрічка · Відео-прев\'ю · Лічильник переглядів',
    component: SlideBeniHome,
  },
  {
    id: 'max',
    tier: 'MAX',
    label: 'Терміновість та дефіцит',
    sub: 'Бігуча стрічка · Таймер · Дефіцит товару',
    component: SlideBallistic,
  },
]

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

      <div className="wss__list">
        {PACKAGES.map((pkg) => {
          const Comp = pkg.component
          return (
            <div key={pkg.id} className="wss__item">
              <div className="wss__item-meta">
                <span className={`wss__tier wss__tier--${pkg.tier.toLowerCase()}`}>{pkg.tier}</span>
                <h3 className="wss__item-label">{pkg.label}</h3>
                <p className="wss__item-sub">{pkg.sub}</p>
              </div>
              <div className="wss__item-card">
                <Comp />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
