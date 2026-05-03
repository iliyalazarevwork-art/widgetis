import React, { useState, useEffect } from 'react'
import {
  Eye, Gift, Flame, PartyPopper, Truck, Coins, HelpCircle, Star, ShoppingBag, Ticket, Snowflake,
  ShoppingCart, Shield, RefreshCcw, Headphones, MessageCircle, Send, Phone,
} from 'lucide-react'
import { useVisible } from '../hooks/useVisible'
import './WidgetPreviews.css'

const MONTHS_UK = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня']
function getTomorrow() {
  const d = new Date(); d.setDate(d.getDate() + 1)
  return `${d.getDate()} ${MONTHS_UK[d.getMonth()]}`
}

// ─── Popup wrapper (forwardRef so consumers can attach IntersectionObserver) ──

const Popup = React.forwardRef<HTMLDivElement, {
  icon: React.ReactNode
  iconClass: string
  children: React.ReactNode
  active?: boolean
}>(({ icon, iconClass, children, active }, ref) => (
  <div className={`wpr__popup${active ? ' wpr__popup--visible' : ''}`} ref={ref}>
    <div className={`wpr__icon ${iconClass}`}>{icon}</div>
    <div className="wpr__text">{children}</div>
  </div>
))
Popup.displayName = 'Popup'

// ─── Individual previews ──────────────────────────────────────────────────────

export function PreviewPhotoReviews() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    if (!active) return
    if (visible >= 4) {
      const t = setTimeout(() => setVisible(0), 1800)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setVisible(v => v + 1), 550)
    return () => clearTimeout(t)
  }, [visible, active])

  return (
    <div className="wpr__reviews" ref={ref}>
      <div className="wpr__stars-row">★★★★★ <span>47 відгуків</span></div>
      <div className="wpr__photos-row">
        {[1,2,3,4].map(i => {
          const isVideo = i % 2 === 0
          return (
            <div
              key={i}
              className={`wpr__photo wpr__photo--${i}${visible >= i ? ' wpr__photo--in' : ''}${isVideo ? ' wpr__photo--video' : ''}`}
            >
              {isVideo && <div className="wpr__photo-play" />}
            </div>
          )
        })}
        <span className="wpr__photos-more">+43</span>
      </div>
    </div>
  )
}

export function PreviewViewers() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [count, setCount] = useState(14)

  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setCount(c => Math.max(8, c + (Math.random() > 0.5 ? 1 : -1))), 2000)
    return () => clearInterval(t)
  }, [active])

  return (
    <Popup ref={ref} active={active} icon={<Eye size={20} strokeWidth={2} />} iconClass="wpr__icon--blue">
      <p><strong key={count} className="wpr__num-pop">{count} людей</strong> дивляться зараз</p>
      <span className="wpr__sub wpr__sub--live"><span className="wpr__dot" />В прямому ефірі</span>
    </Popup>
  )
}

export function PreviewStock() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [stock, setStock] = useState(4)
  const stockTone = stock >= 4
    ? 'wpr__stock-count--green'
    : stock >= 2
      ? 'wpr__stock-count--yellow'
      : 'wpr__stock-count--red'

  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setStock(s => s > 1 ? s - 1 : 5), 2500)
    return () => clearInterval(t)
  }, [active])

  return (
    <Popup ref={ref} active={active} icon={<Flame size={20} strokeWidth={2} />} iconClass="wpr__icon--orange">
      <p>Залишилось <strong key={stock} className={`wpr__stock-count ${stockTone}`}>{stock} шт</strong> на складі</p>
      <span className="wpr__sub">Купують активно — може скінчитись</span>
    </Popup>
  )
}

const GOAL_STEPS = [590, 1180, 1770]
const GOAL_THRESHOLD = 1500

export function PreviewCartGoal() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [step, setStep] = useState(0)
  const cart = GOAL_STEPS[step]
  const achieved = cart >= GOAL_THRESHOLD
  const remaining = Math.max(0, GOAL_THRESHOLD - cart)
  const pct = Math.min(100, (cart / GOAL_THRESHOLD) * 100)

  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => setStep(s => (s + 1) % GOAL_STEPS.length), achieved ? 2500 : 1400)
    return () => clearTimeout(t)
  }, [step, achieved, active])

  return (
    <Popup
      ref={ref}
      active={active}
      icon={achieved ? <PartyPopper size={20} strokeWidth={2} /> : <Gift size={20} strokeWidth={2} />}
      iconClass={achieved ? 'wpr__icon--green' : 'wpr__icon--amber'}
    >
      {achieved
        ? <p><strong>Безкоштовна доставка!</strong></p>
        : <p>До безкоштовної доставки: <strong>{remaining} грн</strong></p>
      }
      <div className="wpr__bar">
        <div className="wpr__bar-fill" style={{ transform: `scaleX(${pct / 100})`, background: achieved ? '#22c55e' : '#f59e0b' }} />
      </div>
    </Popup>
  )
}

function getSecondsUntil18() {
  const now = new Date()
  const cutoff = new Date()
  cutoff.setHours(18, 0, 0, 0)
  if (now >= cutoff) cutoff.setDate(cutoff.getDate() + 1)
  return Math.max(0, Math.floor((cutoff.getTime() - now.getTime()) / 1000))
}

export function PreviewDelivery() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [secs, setSecs] = useState(getSecondsUntil18)

  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setSecs(getSecondsUntil18()), 1000)
    return () => clearInterval(t)
  }, [active])

  const hh = String(Math.floor(secs / 3600)).padStart(2, '0')
  const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')

  return (
    <Popup ref={ref} active={active} icon={<Truck size={20} strokeWidth={2} />} iconClass="wpr__icon--green">
      <p>Доставка <strong style={{ color: '#22c55e' }}>завтра, {getTomorrow()}</strong></p>
      <span className="wpr__sub wpr__sub--timer">
        Замов до 18:00 — залишилось <span className="wpr__timer">{hh}:{mm}:{ss}</span>
      </span>
    </Popup>
  )
}

export function PreviewCashback() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [amount, setAmount] = useState(80)
  const target = 245

  useEffect(() => {
    if (!active) return
    if (amount >= target) {
      const t = setTimeout(() => setAmount(80), 2000)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setAmount(a => Math.min(target, a + 14)), 70)
    return () => clearTimeout(t)
  }, [amount, active])

  return (
    <Popup ref={ref} active={active} icon={<Coins size={20} strokeWidth={2} />} iconClass="wpr__icon--purple">
      <p>Ваш кешбек: <strong className="wpr__cashback-num">{amount}&nbsp;грн</strong></p>
      <span className="wpr__sub">Нараховується автоматично</span>
    </Popup>
  )
}

const MARQUEE_MESSAGES = [
  { icon: <Flame size={11} strokeWidth={2.25} />, text: 'Розпродаж до -50%' },
  { icon: <Truck size={11} strokeWidth={2.25} />, text: 'Безкоштовна доставка від 500 грн' },
  { icon: <Star size={11} strokeWidth={2.25} />, text: 'Нова колекція вже в наявності' },
  { icon: <Gift size={11} strokeWidth={2.25} />, text: 'Подарунок при замовленні від 1000 грн' },
  { icon: <Flame size={11} strokeWidth={2.25} />, text: 'Акція тільки сьогодні' },
  { icon: <Truck size={11} strokeWidth={2.25} />, text: 'Відправка в день замовлення' },
]

export function PreviewMarquee() {
  return (
    <div className="wpr__marquee-wrap">
      <div className="wpr__marquee-track">
        {[...MARQUEE_MESSAGES, ...MARQUEE_MESSAGES].map((m, i) => (
          <span key={i}>{m.icon} {m.text}</span>
        ))}
      </div>
    </div>
  )
}

export function PreviewPurchaseCounter() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [count, setCount] = useState(127)

  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setCount(c => c + 1), 3000)
    return () => clearInterval(t)
  }, [active])

  return (
    <Popup ref={ref} active={active} icon={<ShoppingBag size={20} strokeWidth={2} />} iconClass="wpr__icon--orange">
      <p><strong key={count} className="wpr__num-pop">{count} людей</strong> купили цей товар</p>
      <span className="wpr__sub">За останні 24 години</span>
    </Popup>
  )
}

export function PreviewRecentPurchase() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const NAMES = ['Олена з Харкова', 'Дмитро з Києва', 'Марина з Одеси', 'Андрій зі Львова']
  const [idx, setIdx] = useState(0)
  const [show, setShow] = useState(true)

  useEffect(() => {
    if (!active) return
    const cycle = () => {
      setShow(false)
      setTimeout(() => { setIdx(i => (i + 1) % NAMES.length); setShow(true) }, 400)
    }
    const t = setInterval(cycle, 3000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  return (
    <Popup ref={ref} active={active} icon={<Star size={20} strokeWidth={2} />} iconClass="wpr__icon--amber">
      <p className={`wpr__fade ${show ? 'wpr__fade--in' : ''}`}><strong>{NAMES[idx]}</strong> купила це</p>
      <span className="wpr__sub">2 хвилини тому</span>
    </Popup>
  )
}

export function PreviewCountdown() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [secs, setSecs] = useState(9 * 3600 + 47 * 60 + 22)

  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setSecs(s => s > 0 ? s - 1 : 9 * 3600 + 47 * 60 + 22), 1000)
    return () => clearInterval(t)
  }, [active])

  const hh = String(Math.floor(secs / 3600)).padStart(2, '0')
  const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')

  return (
    <Popup ref={ref} active={active} icon={<Flame size={20} strokeWidth={2} />} iconClass="wpr__icon--rose">
      <p>До кінця акції: <strong className="wpr__timer wpr__timer--red">{hh}:{mm}:{ss}</strong></p>
      <span className="wpr__sub">Поспішайте — залишилось мало</span>
    </Popup>
  )
}

export function PreviewBonus() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [pts, setPts] = useState(0)
  const target = 150

  useEffect(() => {
    if (!active) return
    if (pts >= target) {
      const t = setTimeout(() => setPts(0), 2000)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setPts(p => Math.min(target, p + 8)), 60)
    return () => clearTimeout(t)
  }, [pts, active])

  return (
    <Popup ref={ref} active={active} icon={<Ticket size={20} strokeWidth={2} />} iconClass="wpr__icon--purple">
      <p>Бонусів за покупку: <strong className="wpr__cashback-num">{pts}&nbsp;балів</strong></p>
      <span className="wpr__sub">Витрать на наступне замовлення</span>
    </Popup>
  )
}

export function PreviewOnePlusOne() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [on, setOn] = useState(false)

  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setOn(a => !a), 1800)
    return () => clearInterval(t)
  }, [active])

  return (
    <div className={`wpr__opo${active ? ' wpr__opo--visible' : ''}`} ref={ref}>
      <div className={`wpr__opo-badge ${on ? 'wpr__opo-badge--on' : ''}`}>1+1</div>
      <div className="wpr__text">
        <p><strong>Акція: 1+1=3</strong></p>
        <span className="wpr__sub">Третій товар у подарунок</span>
      </div>
    </div>
  )
}

const OPO_CARD_STEPS = [
  { items: 1, badge: '1+1', title: 'Акція: 1+1=3', hint: 'Додайте ще 1 товар', fill: 34 },
  { items: 2, badge: '2/3', title: 'Акція активована', hint: 'До подарунка один крок', fill: 67 },
  { items: 3, badge: 'FREE', title: 'Третій товар у подарунок', hint: 'Подарунок додано в кошик', fill: 100 },
]

export function PreviewOnePlusOneCard() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [step, setStep] = useState(0)
  const current = OPO_CARD_STEPS[step]!

  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => setStep(s => (s + 1) % OPO_CARD_STEPS.length), step === 2 ? 1800 : 1200)
    return () => clearTimeout(t)
  }, [step, active])

  return (
    <div className={`wpr__opo-card${active ? ' wpr__opo-card--visible' : ''}`} ref={ref}>
      <div className="wpr__opo-card__cart" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`wpr__opo-card__item${current.items > i ? ' wpr__opo-card__item--in' : ''}${i === 2 && current.items > i ? ' wpr__opo-card__item--gift' : ''}`}
            style={{ transitionDelay: `${i * 70}ms` }}
          >
            {i === 2 && current.items > i ? <Gift size={13} strokeWidth={2.4} /> : <ShoppingCart size={12} strokeWidth={2.25} />}
          </span>
        ))}
      </div>
      <div className="wpr__opo-card__content">
        <div className="wpr__opo-card__head">
          <span key={current.badge} className={`wpr__opo-card__badge${step === 2 ? ' wpr__opo-card__badge--gift' : ''}`}>
            {current.badge}
          </span>
          <strong key={current.title} className="wpr__opo-card__title">{current.title}</strong>
        </div>
        <span key={current.hint} className="wpr__opo-card__hint">{current.hint}</span>
        <div className="wpr__opo-card__bar">
          <span className="wpr__opo-card__fill" style={{ width: `${current.fill}%` }} />
        </div>
      </div>
    </div>
  )
}

const PD_TIERS  = [{ minItems: 2, percent: 5 }, { minItems: 3, percent: 10 }, { minItems: 5, percent: 15 }]
const PD_COUNTS = [2, 3, 5]
const PD_DELAYS = [1500, 1500, 2200]
const PD_TIER_COLORS = ['#10B981', '#3B82F6', '#A855F7']

function pdPluralUa(n: number) {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'товар'
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'товари'
  return 'товарів'
}

export function PreviewProgressiveDiscount() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => setStep(s => (s + 1) % PD_COUNTS.length), PD_DELAYS[step])
    return () => clearTimeout(t)
  }, [step, active])

  const itemCount = PD_COUNTS[step]!
  const ceiling   = PD_TIERS[PD_TIERS.length - 1]!.minItems
  const pct       = Math.min(100, (itemCount / ceiling) * 100)

  let activeIdx = -1
  for (let i = 0; i < PD_TIERS.length; i++) {
    if (itemCount >= PD_TIERS[i]!.minItems) activeIdx = i
    else break
  }

  const activeTier = activeIdx >= 0 ? PD_TIERS[activeIdx] : null
  const nextTier   = activeIdx + 1 < PD_TIERS.length ? PD_TIERS[activeIdx + 1] : null
  const isTop      = activeTier !== null && activeIdx === PD_TIERS.length - 1
  const accent     = PD_TIER_COLORS[Math.max(0, activeIdx)]!

  return (
    <div
      ref={ref}
      className={`wpr__pd${active ? ' wpr__pd--visible' : ''}`}
      style={{ background: '#0f172a' }}
    >
      <div className="wpr__pd-head">
        <span className="wpr__pd-title">Прогресивна знижка</span>
        {activeTier && (
          <span className="wpr__pd-current" style={{ color: accent, transition: 'color 0.4s ease' }}>
            Знижка {activeTier.percent}%
          </span>
        )}
      </div>

      <div className="wpr__pd-hint">
        {isTop
          ? <span>🎉 Максимальна знижка <b style={{ color: accent }}>{PD_TIERS[PD_TIERS.length - 1]!.percent}%</b> активована!</span>
          : nextTier
            ? <>Додайте ще <b style={{ color: accent }}>{nextTier.minItems - itemCount}</b> {pdPluralUa(nextTier.minItems - itemCount)} — отримаєте <b style={{ color: accent }}>{nextTier.percent}%</b></>
            : <span style={{ color: 'rgba(248,250,252,0.5)' }}>Додайте товари до кошика</span>
        }
      </div>

      <div className="wpr__pd-bar">
        <div className="wpr__pd-fill" style={{ width: `${pct}%`, background: accent, transition: 'width 350ms cubic-bezier(0.22,1,0.36,1), background 0.4s ease' }} />
      </div>

      <div className="wpr__pd-tiers">
        {PD_TIERS.map((tier, i) => (
          <div
            key={tier.minItems}
            className={`wpr__pd-tier${i === activeIdx ? ' wpr__pd-tier--active' : ''}`}
            style={i === activeIdx ? { background: accent, color: '#0a0a0a' } : undefined}
          >
            {tier.minItems}+ → {tier.percent}%
          </div>
        ))}
      </div>
    </div>
  )
}

export function PreviewSpinWheel() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [angle, setAngle] = useState(0)
  const [spinning, setSpinning] = useState(false)

  useEffect(() => {
    if (!active) return
    const spin = () => {
      setSpinning(true)
      setAngle(a => a + 720 + Math.floor(Math.random() * 360))
      setTimeout(() => setSpinning(false), 2000)
    }
    spin()
    const t = setInterval(spin, 3500)
    return () => clearInterval(t)
  }, [active])

  return (
    <div className="wpr__wheel-wrap" ref={ref}>
      <div
        className="wpr__wheel"
        style={{
          transform: `rotate(${angle}deg)`,
          transition: spinning ? 'transform 2s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none',
        }}
      >
        {[0,1,2,3,4,5].map(i => <div key={i} className={`wpr__wheel-seg wpr__wheel-seg--${i}`} />)}
        <div className="wpr__wheel-center"><Gift size={20} strokeWidth={2} /></div>
      </div>
      <span className="wpr__sub" style={{ marginTop: 8, display: 'block', textAlign: 'center' }}>
        Крути — виграй знижку
      </span>
    </div>
  )
}

export function PreviewQuiz() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setSelected(s => s === null ? Math.floor(Math.random() * 3) : null), 2000)
    return () => clearInterval(t)
  }, [active])

  const opts = ['XS / S', 'M / L', 'XL / XXL']
  return (
    <div className="wpr__quiz" ref={ref}>
      <p className="wpr__quiz-q"><HelpCircle size={14} strokeWidth={2} /> Який розмір вам підходить?</p>
      <div className="wpr__quiz-opts">
        {opts.map((o, i) => (
          <span key={o} className={`wpr__quiz-opt ${selected === i ? 'wpr__quiz-opt--sel' : ''}`}>{o}</span>
        ))}
      </div>
    </div>
  )
}

export function PreviewSnow() {
  return (
    <div className="wpr__snow">
      {[...Array(12)].map((_, i) => (
        <span key={i} className="wpr__snowflake" style={{ '--i': i } as React.CSSProperties}>
          <Snowflake size={12} strokeWidth={1.5} />
        </span>
      ))}
      <span className="wpr__sub" style={{ display: 'block', textAlign: 'center', marginTop: 4 }}>
        Святкова атмосфера на сайті
      </span>
    </div>
  )
}

// ─── NEW: previously missing widget previews ──────────────────────────────────

export function PreviewStickyBuyButton() {
  const { ref, active } = useVisible<HTMLDivElement>()

  return (
    <div className={`wpr__sticky${active ? ' wpr__sticky--active' : ''}`} ref={ref}>
      <div className="wpr__sticky-phone" aria-hidden="true">
        <div className="wpr__sticky-scroll">
          <div className="wpr__sticky-photo">
            <ShoppingBag size={18} strokeWidth={1.8} />
          </div>
          <div className="wpr__sticky-content">
            <span className="wpr__sticky-title">Кросівки Nike Air</span>
            <span className="wpr__sticky-price">1 590 грн</span>
            <span className="wpr__sticky-line wpr__sticky-line--wide" />
            <span className="wpr__sticky-line" />
            <span className="wpr__sticky-line wpr__sticky-line--short" />
            <button className="wpr__sticky-original" type="button">Купити</button>
            <span className="wpr__sticky-line wpr__sticky-line--wide" />
            <span className="wpr__sticky-line" />
          </div>
        </div>
        <div className="wpr__sticky-bar">
          <button className="wpr__sticky-btn" type="button">Купити</button>
        </div>
      </div>
    </div>
  )
}

const TRUST_ITEMS = [
  { icon: <Shield size={16} strokeWidth={2} />, label: 'Безпечна оплата', color: '#3b82f6', bg: '#091A35' },
  { icon: <RefreshCcw size={16} strokeWidth={2} />, label: 'Повернення 14 днів', color: '#22c55e', bg: '#0A2D1A' },
  { icon: <Headphones size={16} strokeWidth={2} />, label: 'Підтримка 24/7', color: '#a78bfa', bg: '#1E0D35' },
]

export function PreviewTrustBadges() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [idx, setIdx] = useState(0)
  const [show, setShow] = useState(true)

  useEffect(() => {
    if (!active) return
    const t = setInterval(() => {
      setShow(false)
      setTimeout(() => { setIdx(i => (i + 1) % TRUST_ITEMS.length); setShow(true) }, 280)
    }, 1800)
    return () => clearInterval(t)
  }, [active])

  const b = TRUST_ITEMS[idx]
  return (
    <div ref={ref} className={`wpr__popup${show && active ? ' wpr__popup--visible' : ''}`}>
      <div className="wpr__icon" style={{ background: b.bg, color: b.color }}>{b.icon}</div>
      <div className="wpr__text"><p>{b.label}</p></div>
    </div>
  )
}

const PHONE_FULL = '+38 (050) 123-45-67'

export function PreviewPhoneMask() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [len, setLen] = useState(0)

  useEffect(() => {
    if (!active) return
    if (len >= PHONE_FULL.length) {
      const t = setTimeout(() => setLen(0), 2200)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setLen(l => l + 1), 90)
    return () => clearTimeout(t)
  }, [len, active])

  return (
    <div className="wpr__phone" ref={ref}>
      <div className="wpr__phone-field">
        <span className="wpr__phone-flag">🇺🇦</span>
        <span className="wpr__phone-text">
          {PHONE_FULL.slice(0, len)}
          <span className="wpr__phone-cursor" />
        </span>
      </div>
    </div>
  )
}

const MIN_STEPS = [130, 215, 310, 380, 455, 500, 320]
const MIN_TARGET = 500

export function PreviewMinOrder() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [step, setStep] = useState(0)
  const cart = MIN_STEPS[step]
  const remaining = Math.max(0, MIN_TARGET - cart)
  const pct = Math.min(100, (cart / MIN_TARGET) * 100)
  const achieved = cart >= MIN_TARGET

  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => setStep(s => (s + 1) % MIN_STEPS.length), 1400)
    return () => clearTimeout(t)
  }, [step, active])

  return (
    <Popup ref={ref} active={active} icon={<ShoppingCart size={20} strokeWidth={2} />} iconClass="wpr__icon--amber">
      {achieved
        ? <p><strong>Мінімальне замовлення досягнуто!</strong></p>
        : <p>Ще <strong key={remaining}>{remaining} грн</strong> до мінімуму</p>
      }
      <div className="wpr__bar">
        <div className="wpr__bar-fill" style={{ transform: `scaleX(${pct / 100})`, background: achieved ? '#22c55e' : '#f59e0b' }} />
      </div>
    </Popup>
  )
}

const RECENT_PRODUCTS = [
  { bg: 'linear-gradient(135deg,#f0c8dc,#e8a8c8)', price: '890 грн' },
  { bg: 'linear-gradient(135deg,#c8daf0,#a8c4e8)', price: '1 200 грн' },
  { bg: 'linear-gradient(135deg,#f0e8c0,#e8d898)', price: '540 грн' },
  { bg: 'linear-gradient(135deg,#c8f0dc,#a8e8c4)', price: '1 890 грн' },
]

export function PreviewRecentlyViewed() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [vis, setVis] = useState(0)

  useEffect(() => {
    if (!active) return
    if (vis >= RECENT_PRODUCTS.length) {
      const t = setTimeout(() => setVis(0), 2200)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setVis(v => v + 1), 260)
    return () => clearTimeout(t)
  }, [vis, active])

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', width: '100%' }} ref={ref}>
      {RECENT_PRODUCTS.map((p, i) => (
        <div
          key={i}
          className="wpr__recent-img"
          style={{
            background: p.bg,
            opacity: vis > i ? 1 : 0,
            transform: vis > i ? 'scale(1)' : 'scale(0.75)',
            transition: 'opacity 0.25s ease, transform 0.32s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        />
      ))}
    </div>
  )
}

export function PreviewVideoPreview() {
  const { ref, active } = useVisible<HTMLDivElement>()
  // 0=right-idle, 1=right-grab, 2=left-grab, 3=left-idle, 4=left-grab, 5=right-grab
  const [phase, setPhase] = useState(0)

  const DELAYS = [1400, 220, 650, 1400, 220, 650]

  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => setPhase(p => (p + 1) % 6), DELAYS[phase])
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, active])

  const onLeft  = phase >= 2 && phase <= 4
  const grabbed = phase === 1 || phase === 2 || phase === 4 || phase === 5

  return (
    <div className={`wpr__vscene${active ? ' wpr__vscene--visible' : ''}`} ref={ref}>
      <div className="wpr__vscene-page">
        <div className="wpr__vscene-line" />
        <div className="wpr__vscene-line wpr__vscene-line--s" />
        <div className="wpr__vscene-line" />
      </div>
      <div className={`wpr__vbubble${onLeft ? ' wpr__vbubble--left' : ''}${grabbed ? ' wpr__vbubble--grab' : ''}`}>
        <div className="wpr__vbubble-fill" />
        {!grabbed && <span className="wpr__vbubble-label">▶</span>}
      </div>
    </div>
  )
}

const MESSENGERS = [
  { label: 'WhatsApp', color: '#25D366', bg: '#0a2d15', icon: <MessageCircle size={16} strokeWidth={2} /> },
  { label: 'Telegram', color: '#2AABEE', bg: '#091a2e', icon: <Send size={16} strokeWidth={2} /> },
  { label: 'Дзвінок',  color: '#9ca3af', bg: '#1c1c1c', icon: <Phone size={16} strokeWidth={2} /> },
]

export function PreviewFloatingMessengers() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [vis, setVis] = useState(0)

  useEffect(() => {
    if (!active) return
    if (vis >= MESSENGERS.length) {
      const t = setTimeout(() => setVis(0), 2500)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setVis(v => v + 1), 200)
    return () => clearTimeout(t)
  }, [vis, active])

  return (
    <div ref={ref} style={{ display: 'flex', gap: 20, alignItems: 'center', justifyContent: 'center', width: '100%' }}>
      {MESSENGERS.map((m, i) => (
        <div key={i} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
          opacity: vis > i ? 1 : 0,
          transform: vis > i ? 'scale(1) translateY(0)' : 'scale(0.65) translateY(8px)',
          transition: 'opacity 0.3s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <div className="wpr__messenger-ico" style={{ background: m.bg, color: m.color }}>{m.icon}</div>
          <span style={{ fontSize: 10, color: '#888' }}>{m.label}</span>
        </div>
      ))}
    </div>
  )
}

const CREC_PRODUCTS = [
  { bg: 'linear-gradient(135deg,#f0c8dc,#e8a8c8)', name: 'Сумка шкіряна',    price: '1 890 грн' },
  { bg: 'linear-gradient(135deg,#c8daf0,#a8c4e8)', name: 'Ремінь чоловічий', price: '890 грн'   },
  { bg: 'linear-gradient(135deg,#f0e8c0,#e8d898)', name: 'Гаманець',         price: '540 грн'   },
]

type CursorPos = 'hidden' | 'buy' | 'row0' | 'row1' | 'row2' | 'cta'

const CURSOR_STYLE: Record<CursorPos, React.CSSProperties> = {
  hidden: { opacity: 0,  top: '72%', left: 'calc(50% - 8px)' },
  buy:    { opacity: 1,  top: '72%', left: 'calc(50% - 8px)' },
  row0:   { opacity: 1,  top: '9%',  left: 'calc(100% - 28px)' },
  row1:   { opacity: 1,  top: '33%', left: 'calc(100% - 28px)' },
  row2:   { opacity: 1,  top: '56%', left: 'calc(100% - 28px)' },
  cta:    { opacity: 1,  top: '83%', left: 'calc(50% - 8px)' },
}

export function PreviewCartRecommenderDetail() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [tick, setTick] = useState(0)
  const [open, setOpen] = useState(false)
  const [rowsIn, setRowsIn] = useState(0)
  const [addedCount, setAddedCount] = useState(0)
  const [cursorPos, setCursorPos] = useState<CursorPos>('hidden')
  const [clicking, setClicking] = useState(false)
  const [ctaPressed, setCtaPressed] = useState(false)
  const [buyPressed, setBuyPressed] = useState(false)

  useEffect(() => {
    if (!active) return
    setOpen(false)
    setRowsIn(0)
    setAddedCount(0)
    setCursorPos('hidden')
    setClicking(false)
    setCtaPressed(false)
    setBuyPressed(false)

    const timers: ReturnType<typeof setTimeout>[] = []
    const t = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms))

    t(300,  () => setCursorPos('buy'))
    t(750,  () => { setClicking(true); setBuyPressed(true) })
    t(900,  () => { setClicking(false); setBuyPressed(false); setOpen(true) })
    t(1100, () => setRowsIn(1))
    t(1300, () => setRowsIn(2))
    t(1500, () => { setRowsIn(3); setCursorPos('row0') })
    t(1800, () => setClicking(true))
    t(1950, () => { setClicking(false); setAddedCount(1) })
    t(2150, () => setCursorPos('row1'))
    t(2350, () => setClicking(true))
    t(2500, () => { setClicking(false); setAddedCount(2) })
    t(2700, () => setCursorPos('row2'))
    t(2900, () => setClicking(true))
    t(3050, () => { setClicking(false); setAddedCount(3) })
    t(3250, () => setCursorPos('cta'))
    t(3500, () => { setClicking(true); setCtaPressed(true) })
    t(3650, () => { setClicking(false); setCtaPressed(false) })
    t(3850, () => setCursorPos('hidden'))
    t(4100, () => setOpen(false))
    t(4450, () => { setRowsIn(0); setAddedCount(0) })
    t(4800, () => setTick(n => n + 1))

    return () => timers.forEach(clearTimeout)
  }, [tick, active])

  return (
    <div className="wpr__crec" ref={ref}>
      <div className="wpr__crec-product">
        <div className="wpr__crec-product-img" />
        <div className="wpr__crec-product-info">
          <span className="wpr__crec-product-name">Кросівки Nike Air</span>
          <span className="wpr__crec-product-price">1 590 грн</span>
        </div>
        <div className={`wpr__crec-buy-btn${buyPressed ? ' wpr__crec-buy-btn--press' : ''}`}>Купити</div>
      </div>

      <div className={`wpr__crec-overlay${open ? ' wpr__crec-overlay--on' : ''}`} />

      <div className={`wpr__crec-sheet${open ? ' wpr__crec-sheet--open' : ''}`}>
        <div className="wpr__crec-header">
          <span className="wpr__crec-title">✨ Часто беруть разом</span>
          <span className="wpr__crec-close">✕</span>
        </div>
        <div className="wpr__crec-list">
          {CREC_PRODUCTS.map((p, i) => {
            const done = addedCount > i
            return (
              <div key={i} className={`wpr__crec-row${rowsIn > i ? ' wpr__crec-row--in' : ''}`}>
                <div className="wpr__crec-img" style={{ background: p.bg }} />
                <div className="wpr__crec-info">
                  <span className="wpr__crec-name">{p.name}</span>
                  <span className="wpr__crec-price">{p.price}</span>
                </div>
                <div className={`wpr__crec-add${done ? ' wpr__crec-add--done' : ''}`}>
                  {done && <span className="wpr__crec-add__check">✓</span>}
                </div>
              </div>
            )
          })}
        </div>
        <div className={`wpr__crec-cta${ctaPressed ? ' wpr__crec-cta--press' : ''}`}>Оформити замовлення</div>
      </div>

      <div
        className={`wpr__crec-cursor${clicking ? ' wpr__crec-cursor--click' : ''}`}
        style={CURSOR_STYLE[cursorPos]}
      >
        <svg width="16" height="20" viewBox="0 0 16 20" fill="none" aria-hidden="true">
          <path
            d="M1 1L1 16L5 12L8 18L11 17L8 11L13 11L1 1Z"
            fill="white"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  )
}

export function PreviewCartRecommender() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [idx, setIdx] = useState(0)
  const [show, setShow] = useState(true)

  useEffect(() => {
    if (!active) return
    const t = setInterval(() => {
      setShow(false)
      setTimeout(() => { setIdx(i => (i + 1) % CREC_PRODUCTS.length); setShow(true) }, 320)
    }, 2000)
    return () => clearInterval(t)
  }, [active])

  const p = CREC_PRODUCTS[idx]
  return (
    <div ref={ref} className={`wpr__popup${show && active ? ' wpr__popup--visible' : ''}`}>
      <div className="wpr__icon" style={{ background: p.bg, borderRadius: 10 }} />
      <div className="wpr__text">
        <p><strong>{p.name}</strong></p>
        <span className="wpr__sub">{p.price}</span>
      </div>
      <span style={{ fontSize: 20, color: '#C77A5C', fontWeight: 700, flexShrink: 0 }}>+</span>
    </div>
  )
}

const OTP_DIGITS = ['3', '7', '2', '9']

export function PreviewSmsOtp() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [filled, setFilled] = useState(0)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (!active) return
    if (verified) {
      const t = setTimeout(() => { setFilled(0); setVerified(false) }, 2200)
      return () => clearTimeout(t)
    }
    if (filled >= OTP_DIGITS.length) {
      const t = setTimeout(() => setVerified(true), 500)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setFilled(f => f + 1), 480)
    return () => clearTimeout(t)
  }, [filled, verified, active])

  return (
    <div ref={ref} style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', width: '100%' }}>
      {OTP_DIGITS.map((d, i) => (
        <div
          key={i}
          className={`wpr__otp-box${filled > i ? ' wpr__otp-box--filled' : ''}${verified ? ' wpr__otp-box--ok' : ''}`}
        >
          {filled > i ? d : ''}
        </div>
      ))}
    </div>
  )
}

// ─── Map: widget id → preview component ──────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export const PREVIEW_MAP: Record<string, React.FC> = {
  'promo-line':            PreviewMarquee,
  'delivery-date':         PreviewDelivery,
  'cart-goal':             PreviewCartGoal,
  'buyer-count':           PreviewPurchaseCounter,
  'stock-left':            PreviewStock,
  'photo-video-reviews':   PreviewPhotoReviews,
  'one-plus-one':          PreviewOnePlusOne,
  'progressive-discount':  PreviewProgressiveDiscount,
  'spin-the-wheel':        PreviewSpinWheel,
  'last-chance-popup':     PreviewRecentPurchase,
  'prize-banner':          PreviewBonus,
  'promo-auto-apply':      PreviewCashback,
  'sticky-buy-button':     PreviewStickyBuyButton,
  'trust-badges':          PreviewTrustBadges,
  'phone-mask':            PreviewPhoneMask,
  'minorder-goal':         PreviewMinOrder,
  'recently-viewed':       PreviewRecentlyViewed,
  'video-preview':         PreviewVideoPreview,
  'floating-messengers':   PreviewFloatingMessengers,
  'cart-recommender':      PreviewCartRecommender,
  'sms-otp-checkout':      PreviewSmsOtp,
}

// ─── Detailed previews for widget detail pages ───────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export const DETAIL_PREVIEW_MAP: Record<string, React.FC> = {
  'cart-recommender': PreviewCartRecommenderDetail,
}
