import React, { useState, useEffect } from 'react'
import { Eye, Gift, Flame, PartyPopper, Truck, Coins, HelpCircle, Tag, Star, ShoppingBag, Ticket, Snowflake } from 'lucide-react'
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
}>(({ icon, iconClass, children }, ref) => (
  <div className="wpr__popup" ref={ref}>
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
        {[1,2,3,4].map(i => (
          <div key={i} className={`wpr__photo wpr__photo--${i} ${visible >= i ? 'wpr__photo--in' : ''}`} />
        ))}
        <span className="wpr__photos-more">+43</span>
      </div>
      <p className="wpr__review-quote">"Якість відмінна, фото відповідає" — <strong>Марія К.</strong></p>
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
    <Popup ref={ref} icon={<Eye size={20} strokeWidth={2} />} iconClass="wpr__icon--blue">
      <p><strong key={count} className="wpr__num-pop">{count} людей</strong> дивляться зараз</p>
      <span className="wpr__sub wpr__sub--live"><span className="wpr__dot" />В прямому ефірі</span>
    </Popup>
  )
}

export function PreviewStock() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const [stock, setStock] = useState(4)

  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setStock(s => s > 1 ? s - 1 : 5), 2500)
    return () => clearInterval(t)
  }, [active])

  return (
    <Popup ref={ref} icon={<Flame size={20} strokeWidth={2} />} iconClass="wpr__icon--orange">
      <p>Залишилось <strong key={stock}>{stock} шт</strong> на складі</p>
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
    <Popup ref={ref} icon={<Truck size={20} strokeWidth={2} />} iconClass="wpr__icon--green">
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
    <Popup ref={ref} icon={<Coins size={20} strokeWidth={2} />} iconClass="wpr__icon--purple">
      <p>Ваш кешбек: <strong className="wpr__cashback-num">{amount}&nbsp;грн</strong></p>
      <span className="wpr__sub">Нараховується автоматично</span>
    </Popup>
  )
}

export function PreviewMarquee() {
  return (
    <div className="wpr__marquee-wrap">
      <div className="wpr__marquee-track">
        <span><Flame size={11} strokeWidth={2.25} /> Розпродаж до -50%</span>
        <span><Truck size={11} strokeWidth={2.25} /> Безкоштовна доставка від 500 грн</span>
        <span><Star size={11} strokeWidth={2.25} /> Нова колекція вже в наявності</span>
        <span><Gift size={11} strokeWidth={2.25} /> Подарунок при замовленні від 1000 грн</span>
        <span><Flame size={11} strokeWidth={2.25} /> Розпродаж до -50%</span>
        <span><Truck size={11} strokeWidth={2.25} /> Безкоштовна доставка від 500 грн</span>
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
    <Popup ref={ref} icon={<ShoppingBag size={20} strokeWidth={2} />} iconClass="wpr__icon--orange">
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
    <Popup ref={ref} icon={<Star size={20} strokeWidth={2} />} iconClass="wpr__icon--amber">
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
    <Popup ref={ref} icon={<Flame size={20} strokeWidth={2} />} iconClass="wpr__icon--rose">
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
    <Popup ref={ref} icon={<Ticket size={20} strokeWidth={2} />} iconClass="wpr__icon--purple">
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
    <div className="wpr__opo" ref={ref}>
      <div className={`wpr__opo-badge ${on ? 'wpr__opo-badge--on' : ''}`}>1+1</div>
      <div className="wpr__text">
        <p><strong>Акція: 1+1=3</strong></p>
        <span className="wpr__sub">Третій товар у подарунок</span>
      </div>
    </div>
  )
}

export function PreviewProgressiveDiscount() {
  const { ref, active } = useVisible<HTMLDivElement>()
  const STEPS = [{ qty: 2, pct: 5 }, { qty: 3, pct: 10 }, { qty: 5, pct: 15 }]
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setStep(s => (s + 1) % STEPS.length), 1800)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const cur = STEPS[step]
  return (
    <Popup ref={ref} icon={<Tag size={20} strokeWidth={2} />} iconClass="wpr__icon--green">
      <p key={step} className="wpr__fade wpr__fade--in">
        Від <strong>{cur.qty} шт</strong> — знижка <strong style={{ color: '#22c55e' }}>{cur.pct}%</strong>
      </p>
      <span className="wpr__sub">Більше купуєш — більше економиш</span>
    </Popup>
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

// ─── Map: widget id → preview component ──────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export const PREVIEW_MAP: Record<string, React.FC> = {
  'photo-reviews':        PreviewPhotoReviews,
  'live-viewers':         PreviewViewers,
  'purchase-counter':     PreviewPurchaseCounter,
  'free-delivery':        PreviewCartGoal,
  'delivery-date':        PreviewDelivery,
  'cashback':             PreviewCashback,
  'marquee':              PreviewMarquee,
  'stock-counter':        PreviewStock,
  'recent-purchase':      PreviewRecentPurchase,
  'countdown':            PreviewCountdown,
  'bonus':                PreviewBonus,
  'one-plus-one':         PreviewOnePlusOne,
  'progressive-discount': PreviewProgressiveDiscount,
  'spin-wheel':           PreviewSpinWheel,
  'quiz':                 PreviewQuiz,
  'snow':                 PreviewSnow,
}
