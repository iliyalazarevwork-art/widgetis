import { useEffect, useRef, useState } from 'react'
import { SeoHead } from '../components/SeoHead'
import { Link } from 'react-router-dom'
import {
  ShoppingCart,
  Eye,
  Flame,
  Gift,
  Truck,
  Timer,
  PartyPopper,
  Bell,
  X as XIcon,
  Share2,
  ArrowRight,
  Heart,
  Star,
  Search,
  Lock,
} from 'lucide-react'
import { toast } from 'sonner'
import { BRAND_NAME_UPPER } from '../constants/brand'
import './DemoPage.css'

const MONTHS_UK = [
  'січня',
  'лютого',
  'березня',
  'квітня',
  'травня',
  'червня',
  'липня',
  'серпня',
  'вересня',
  'жовтня',
  'листопада',
  'грудня',
]

function getTomorrowText() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getDate()} ${MONTHS_UK[d.getMonth()]}`
}

const SOCIAL_PURCHASES = [
  { name: 'Олена з Києва', product: 'Крем-бустер Pure', ago: '2 хв тому' },
  { name: 'Микола зі Львова', product: 'Сироватка Glow', ago: '5 хв тому' },
  { name: 'Катерина з Одеси', product: 'Крем-бустер Pure', ago: '8 хв тому' },
  { name: 'Андрій з Дніпра', product: 'Тонік Fresh', ago: '12 хв тому' },
  { name: 'Марія з Харкова', product: 'Крем-бустер Pure', ago: '15 хв тому' },
]

const PRICE = 1195
const CART_GOAL = 3000

function normalizeUrl(raw: string): string {
  const s = raw.trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  return 'https://' + s
}

export function DemoPage() {
  // Your-site demo
  const [siteInput, setSiteInput] = useState(() => localStorage.getItem('wty_demo_url') ?? '')
  const [demoUrl, setDemoUrl] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  function openSiteDemo(e: React.FormEvent) {
    e.preventDefault()
    const url = normalizeUrl(siteInput)
    if (!url) return
    localStorage.setItem('wty_demo_url', siteInput)
    setDemoUrl(url)
  }

  function closeSiteDemo() {
    setDemoUrl(null)
  }

  // Live viewers widget
  const [viewers, setViewers] = useState(12)
  useEffect(() => {
    const t = setInterval(() => {
      setViewers((v) => Math.max(6, Math.min(24, v + (Math.random() > 0.5 ? 1 : -1))))
    }, 2400)
    return () => clearInterval(t)
  }, [])

  // Countdown widget
  const [seconds, setSeconds] = useState(4 * 3600 + 27 * 60 + 13)
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [])
  const hh = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  // Cart goal widget — simulates adding items
  const [cart, setCart] = useState(PRICE)
  const [cartCount, setCartCount] = useState(1)
  useEffect(() => {
    const t = setInterval(() => {
      setCart((c) => {
        const next = c + PRICE
        if (next > PRICE * 4) return PRICE
        return next
      })
      setCartCount((n) => {
        const next = n + 1
        if (next > 4) return 1
        return next
      })
    }, 3400)
    return () => clearInterval(t)
  }, [])
  const achievedShipping = cart >= CART_GOAL
  const remaining = Math.max(0, CART_GOAL - cart)
  const progressPct = Math.min(100, (cart / CART_GOAL) * 100)

  // Purchase counter widget
  const [purchasedToday, setPurchasedToday] = useState(23)
  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() > 0.6) setPurchasedToday((p) => p + 1)
    }, 5200)
    return () => clearInterval(t)
  }, [])

  // Social proof popup
  const [popupIdx, setPopupIdx] = useState(0)
  const [popupVisible, setPopupVisible] = useState(true)
  useEffect(() => {
    const t = setInterval(() => {
      setPopupVisible(false)
      setTimeout(() => {
        setPopupIdx((i) => (i + 1) % SOCIAL_PURCHASES.length)
        setPopupVisible(true)
      }, 400)
    }, 5500)
    return () => clearInterval(t)
  }, [])

  function handleShare() {
    const url = window.location.origin + '/demo'
    navigator.clipboard
      ?.writeText(url)
      .then(() => toast.success('Посилання скопійовано'))
      .catch(() => toast.error('Не вдалося скопіювати'))
  }

  return (
    <div className="demo-page">
      <SeoHead
        title={`Демо віджетів для Horoshop — ${BRAND_NAME_UPPER} | Спробуй на своєму сайті`}
        description={`Побач як виглядають маркетингові віджети на твоєму Horoshop-магазині. Безкоштовне живе демо за 10 секунд — без реєстрації та оплати.`}
        keywords="демо віджетів Хорошоп, перевірити плагін Хорошоп, тест маркетингових інструментів Хорошоп, horoshop demo widgets"
        path="/demo"
      />

      {/* ── Your-site hero ── */}
      <section className="demo-hero">
        <div className="demo-hero__card">
          <span className="demo-hero__badge">
            <Eye size={13} strokeWidth={2.25} />
            Безкоштовне демо
          </span>
          <h2 className="demo-hero__title">
            Віджети на <span className="demo-hero__title-accent">вашому</span> сайті
          </h2>
          <p className="demo-hero__sub">
            Введіть адресу магазину — побачите віджети в дії за 10 секунд
          </p>
          <form className="demo-hero__form" onSubmit={openSiteDemo}>
            <input
              className="demo-hero__input"
              type="text"
              placeholder="myshop.horoshop.ua"
              value={siteInput}
              onChange={(e) => setSiteInput(e.target.value)}
              autoComplete="url"
              spellCheck={false}
            />
            <button className="demo-hero__btn" type="submit">
              Спробувати →
            </button>
          </form>
          <p className="demo-hero__note">
            <Lock size={11} strokeWidth={2.25} />
            7 днів безкоштовно · без автосписання
          </p>
        </div>
      </section>

      {/* ── Intro ── */}
      <section className="demo-intro">
        <div className="demo-intro__container">
          <p className="demo-intro__eyebrow">Живе демо</p>
          <h1 className="demo-intro__title">
            8 віджетів <span className="demo-intro__title-accent">одночасно</span>
          </h1>
          <p className="demo-intro__sub">
            Нижче — справжній мок-магазин. Віджети працюють у реальному часі: лічильники, таймери,
            прогрес до безкоштовної доставки, повідомлення про покупки.
          </p>
          <div className="demo-intro__actions">
            <button className="demo-intro__share" onClick={handleShare} type="button">
              <Share2 size={14} strokeWidth={2.25} />
              Скопіювати посилання
            </button>
            <Link to="/widgets" className="demo-intro__to-catalog">
              Всі віджети
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Mock shop ── */}
      <section className="demo-shop-wrap">
        <div className="demo-shop-frame">
          {/* Browser chrome */}
          <div className="demo-shop__browser">
            <div className="demo-shop__browser-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="demo-shop__browser-url">
              <span className="demo-shop__browser-lock" aria-hidden="true">
                🔒
              </span>
              <span>ptashkinsad.com/crem-booster-pure</span>
            </div>
          </div>

          {/* Marquee widget — running text */}
          <div className="demo-shop__marquee" aria-label="Бігуча стрічка">
            <div className="demo-shop__marquee-track">
              <span>
                <Truck size={12} strokeWidth={2.25} /> Безкоштовна доставка від 3000 грн
              </span>
              <span>
                <Gift size={12} strokeWidth={2.25} /> −10% при першій покупці
              </span>
              <span>
                <Flame size={12} strokeWidth={2.25} /> Літня колекція — знижки до 30%
              </span>
              <span>
                <Truck size={12} strokeWidth={2.25} /> Безкоштовна доставка від 3000 грн
              </span>
              <span>
                <Gift size={12} strokeWidth={2.25} /> −10% при першій покупці
              </span>
            </div>
          </div>

          {/* Shop header */}
          <header className="demo-shop__header">
            <a className="demo-shop__logo" href="#" onClick={(e) => e.preventDefault()}>
              ptashkin sad
            </a>
            <nav className="demo-shop__nav">
              <a href="#" onClick={(e) => e.preventDefault()}>Новинки</a>
              <a href="#" onClick={(e) => e.preventDefault()}>Обличчя</a>
              <a href="#" onClick={(e) => e.preventDefault()}>Тіло</a>
              <a href="#" onClick={(e) => e.preventDefault()}>Бренди</a>
            </nav>
            <div className="demo-shop__header-actions">
              <button className="demo-shop__icon-btn" aria-label="Пошук" type="button">
                <Search size={17} strokeWidth={2} />
              </button>
              <button className="demo-shop__icon-btn" aria-label="Кошик" type="button">
                <ShoppingCart size={17} strokeWidth={2} />
                <span className="demo-shop__cart-badge" key={cartCount}>{cartCount}</span>
              </button>
            </div>
          </header>

          {/* Product page */}
          <div className="demo-shop__product">
            <div className="demo-shop__product-img">
              <img src="/showcase/ptashkin-pure.webp" alt="Крем-бустер Pure" loading="lazy" decoding="async" width="600" height="600" />
              <button className="demo-shop__fav" aria-label="В обране" type="button">
                <Heart size={16} strokeWidth={2} />
              </button>
            </div>

            <div className="demo-shop__product-info">
              <div className="demo-shop__breadcrumb">Головна / Обличчя / Креми</div>

              <h2 className="demo-shop__product-title">Крем-бустер Pure — активне живлення</h2>
              <div className="demo-shop__product-variant">35 ml · Для сухої шкіри</div>

              <div className="demo-shop__product-reviews">
                <div className="demo-shop__stars" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      strokeWidth={0}
                      fill={i < 5 ? '#f5b400' : 'var(--text-ghost)'}
                    />
                  ))}
                </div>
                <span>4.9</span>
                <span className="demo-shop__reviews-count">· 52 відгуки</span>
              </div>

              {/* Live viewers + purchase counter — inline social proof */}
              <div className="demo-shop__inline-widgets">
                <span className="demo-widget demo-widget--viewers" data-widget="Хто зараз дивиться">
                  <span className="demo-widget__dot" />
                  <Eye size={12} strokeWidth={2.25} />
                  <strong key={viewers}>{viewers}</strong> дивляться зараз
                </span>
                <span className="demo-widget demo-widget--purchases" data-widget="Лічильник покупок">
                  <Flame size={12} strokeWidth={2.25} />
                  <strong>{purchasedToday}</strong> купили сьогодні
                </span>
              </div>

              <div className="demo-shop__price-row">
                <span className="demo-shop__price">{PRICE.toLocaleString('uk-UA')} грн</span>
                <span className="demo-shop__price-old">1 495 грн</span>
                <span className="demo-shop__discount">−20%</span>
              </div>

              {/* Delivery date widget */}
              <div className="demo-widget demo-widget--delivery" data-widget="Дата доставки">
                <Truck size={14} strokeWidth={2} />
                <span>
                  Отримаєш <strong>завтра, {getTomorrowText()}</strong>
                  <br />
                  <small>Замов протягом 2 год</small>
                </span>
              </div>

              {/* Stock scarcity widget */}
              <div className="demo-widget demo-widget--stock" data-widget="Дефіцит товару">
                <span className="demo-widget__dot demo-widget__dot--warning" />
                Залишилось <strong>2 шт</strong> на складі
              </div>

              {/* Countdown widget */}
              <div className="demo-widget demo-widget--countdown" data-widget="Зворотний відлік">
                <Timer size={13} strokeWidth={2.5} />
                <span>До кінця акції:</span>
                <div className="demo-widget__timer">
                  <span>{hh}</span>
                  <em>:</em>
                  <span>{mm}</span>
                  <em>:</em>
                  <span>{ss}</span>
                </div>
              </div>

              <button className="demo-shop__buy-btn" type="button">
                Додати в кошик
              </button>

              {/* Cart goal widget */}
              <div
                className={`demo-widget demo-widget--goal ${achievedShipping ? 'demo-widget--goal-done' : ''}`}
                data-widget="Ціль кошика"
              >
                <div className="demo-widget__goal-text">
                  {achievedShipping ? (
                    <>
                      <PartyPopper size={15} strokeWidth={2.25} />
                      <span>
                        <strong>У тебе безкоштовна доставка!</strong>
                      </span>
                    </>
                  ) : (
                    <>
                      <Gift size={15} strokeWidth={2.25} />
                      <span>
                        До безкоштовної доставки залишилось <strong>{remaining} грн</strong>
                      </span>
                    </>
                  )}
                </div>
                <div className="demo-widget__goal-bar">
                  <div
                    className="demo-widget__goal-fill"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent purchase popup — Хтось щойно купив */}
        {popupVisible && (
          <div
            className="demo-shop__popup"
            data-widget="Хтось щойно купив"
            key={popupIdx}
          >
            <div className="demo-shop__popup-icon" aria-hidden="true">
              <Bell size={16} strokeWidth={2.25} />
            </div>
            <div className="demo-shop__popup-body">
              <p>
                <strong>{SOCIAL_PURCHASES[popupIdx].name}</strong> щойно купила
              </p>
              <p className="demo-shop__popup-product">
                «{SOCIAL_PURCHASES[popupIdx].product}» · {SOCIAL_PURCHASES[popupIdx].ago}
              </p>
            </div>
            <button
              className="demo-shop__popup-close"
              onClick={() => setPopupVisible(false)}
              aria-label="Закрити"
              type="button"
            >
              <XIcon size={12} strokeWidth={2.25} />
            </button>
          </div>
        )}
      </section>

      {/* ── CTA ── */}
      <section className="demo-cta">
        <div className="demo-cta__container">
          <h2 className="demo-cta__title">Хочеш такі самі віджети у твоєму магазині?</h2>
          <p className="demo-cta__sub">
            Обери окремий віджет або готовий пакет. Встановлення за 3 хвилини.
          </p>
          <div className="demo-cta__actions">
            <Link to="/widgets" className="demo-cta__btn">
              Всі віджети
              <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
            <Link to="/cases" className="demo-cta__btn demo-cta__btn--ghost">
              Дивитися кейси
            </Link>
          </div>
        </div>
      </section>
      {/* ── Site-preview modal ── */}
      {demoUrl && (
        <div className="demo-site-modal" onClick={(e) => { if (e.target === e.currentTarget) closeSiteDemo() }}>
          <div className="demo-site-modal__window">
            <div className="demo-site-modal__chrome">
              <div className="demo-site-modal__dots" aria-hidden="true">
                <span /><span /><span />
              </div>
              <div className="demo-site-modal__url">
                <span className="demo-site-modal__lock" aria-hidden="true">
                  <Lock size={11} strokeWidth={2.25} />
                </span>
                <span className="demo-site-modal__url-text">{demoUrl.replace(/^https?:\/\//, '')}</span>
              </div>
              <button
                className="demo-site-modal__close"
                onClick={closeSiteDemo}
                aria-label="Закрити"
                type="button"
              >
                <XIcon size={15} strokeWidth={2.25} />
              </button>
            </div>
            <iframe
              ref={iframeRef}
              className="demo-site-modal__iframe"
              src={demoUrl}
              title="Ваш сайт"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        </div>
      )}
    </div>
  )
}
