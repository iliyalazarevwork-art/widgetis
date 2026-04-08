import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Star,
  BadgeCheck,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Layers,
  Users,
} from 'lucide-react'
import { widgets, tagLabels, type Tag } from '../data/widgets'
import { Testimonials } from '../components/Testimonials'
import { PREVIEW_MAP } from '../components/WidgetPreviews'
import './WidgetsPage.css'

// ─── Cases data per widget ──────────────────────────────────────────────────

const WIDGET_CASES: Record<string, { store: string; storeUrl: string; metric: string; color: string }[]> = {
  marquee:              [
    { store: 'ptashkinsad.com', storeUrl: 'https://ptashkinsad.com', metric: '+18% середній чек', color: '#10b981' },
    { store: 'benihome.com.ua', storeUrl: 'https://benihome.com.ua', metric: '+24% конверсія',    color: '#f59e0b' },
    { store: 'ballistic.com.ua',storeUrl: 'https://ballistic.com.ua',metric: '−31% відмов',       color: '#ef4444' },
  ],
  'delivery-date':      [
    { store: 'ptashkinsad.com', storeUrl: 'https://ptashkinsad.com', metric: '+18% середній чек', color: '#10b981' },
    { store: 'brewco.kyiv.ua',  storeUrl: 'https://brewco.kyiv.ua',  metric: '+28% повторних',    color: '#ec4899' },
  ],
  'purchase-counter':   [
    { store: 'kyivfit.store',   storeUrl: 'https://kyivfit.store',   metric: '+42% email-база',   color: '#3b82f6' },
  ],
  'free-delivery':      [
    { store: 'homedetail.ua',   storeUrl: 'https://homedetail.ua',   metric: '+15% середній чек', color: '#8b5cf6' },
  ],
  'live-viewers':       [
    { store: 'benihome.com.ua', storeUrl: 'https://benihome.com.ua', metric: '+24% конверсія',    color: '#f59e0b' },
  ],
  cashback:             [
    { store: 'brewco.kyiv.ua',  storeUrl: 'https://brewco.kyiv.ua',  metric: '+28% повторних',    color: '#ec4899' },
  ],
  countdown:            [
    { store: 'ballistic.com.ua',storeUrl: 'https://ballistic.com.ua',metric: '−31% відмов',       color: '#ef4444' },
  ],
  'photo-reviews':      [
    { store: 'kyivfit.store',   storeUrl: 'https://kyivfit.store',   metric: '+42% email-база',   color: '#3b82f6' },
  ],
  'recent-purchase':    [
    { store: 'homedetail.ua',   storeUrl: 'https://homedetail.ua',   metric: '+15% середній чек', color: '#8b5cf6' },
  ],
  'spin-wheel':         [
    { store: 'kyivfit.store',   storeUrl: 'https://kyivfit.store',   metric: '+42% email-база',   color: '#3b82f6' },
  ],
  quiz:                 [
    { store: 'brewco.kyiv.ua',  storeUrl: 'https://brewco.kyiv.ua',  metric: '+28% повторних',    color: '#ec4899' },
  ],
  'progressive-discount': [
    { store: 'homedetail.ua',   storeUrl: 'https://homedetail.ua',   metric: '+15% середній чек', color: '#8b5cf6' },
  ],
}

// ─── Tag accent colors ──────────────────────────────────────────────────────

const TAG_ACCENT: Record<Tag, string> = {
  conversion:     '#10b981',
  trust:          '#3b82f6',
  'social-proof': '#f59e0b',
  visual:         '#8b5cf6',
  'avg-order':    '#10b981',
  urgency:        '#ef4444',
  loyalty:        '#3b82f6',
  engagement:     '#ec4899',
}

// ─── Widget preview mockup ──────────────────────────────────────────────────

function WidgetMockup({ id }: { id: string }) {
  const Preview = PREVIEW_MAP[id]
  return Preview ? <Preview /> : null
}

// ─── Widget card ─────────────────────────────────────────────────────────────

function WidgetCard({ widget, index = 0 }: { widget: typeof widgets[0]; index?: number }) {
  const accent = TAG_ACCENT[widget.tag]
  const usedIn = WIDGET_CASES[widget.id] ?? []
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.08 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <article
      ref={ref}
      role="button"
      tabIndex={0}
      className={`wc ${visible ? 'wc--visible' : ''}`}
      style={{ '--wc-accent': accent, transitionDelay: visible ? `${index * 0.06}s` : '0s' } as React.CSSProperties}
      onClick={() => navigate(`/widgets/${widget.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/widgets/${widget.id}`) }}
    >
      <div className="wc__body">
        <div className="wc__badges">
          <span className="wc__tag" style={{ color: accent, background: `${accent}18` }}>
            {tagLabels[widget.tag]}
          </span>
          {widget.isNew && <span className="wc__new">NEW</span>}
          {widget.isPopular && (
            <span className="wc__popular">
              <Sparkles size={10} strokeWidth={2.5} />
              Хіт
            </span>
          )}
        </div>

        <h3 className="wc__title">{widget.title}</h3>

        <div className="wc__preview">
          <WidgetMockup id={widget.id} />
        </div>

        <p className="wc__desc">{widget.description}</p>

        {usedIn.length > 0 && (
          <div className="wc__used">
            <span className="wc__used-label">Використовується в</span>
            <div className="wc__used-list">
              {usedIn.map((c) => (
                <span key={c.store} className="wc__used-store">
                  <BadgeCheck size={11} strokeWidth={2.5} />
                  <span>{c.store}</span>
                  <strong>{c.metric}</strong>
                </span>
              ))}
            </div>
          </div>
        )}

        <span className="wc__cta" aria-hidden="true">
          Детальніше
          <ArrowRight size={14} strokeWidth={2.25} />
        </span>
      </div>
    </article>
  )
}

// ─── Featured cases ──────────────────────────────────────────────────────────

const FEATURED_CASES = [
  {
    store: 'ballistic.com.ua',
    storeUrl: 'https://ballistic.com.ua',
    owner: 'Ballistic',
    category: 'Тактичний одяг',
    quote: 'Таймер і "залишилось 2 шт" реально створюють терміновість. Імпульсні покупки виросли, показник відмов впав.',
    metrics: [{ label: 'відмов', value: '−31%' }, { label: 'конверсія', value: '+18%' }],
    widgets: ['Зворотний відлік', 'Бігуча стрічка'],
    color: '#ef4444',
    rating: 5,
  },
  {
    store: 'kyivfit.store',
    storeUrl: 'https://kyivfit.store',
    owner: 'KyivFit',
    category: 'Спорт та фітнес',
    quote: 'Колесо фортуни на виході з сайту збирає email-и в 3 рази краще, ніж попап зі знижкою. І покупці повертаються.',
    metrics: [{ label: 'email-база', value: '+42%' }, { label: 'повторні', value: '+22%' }],
    widgets: ['Колесо фортуни', 'Фотовідгуки', 'Лічильник покупок'],
    color: '#3b82f6',
    rating: 4,
  },
  {
    store: 'homedetail.ua',
    storeUrl: 'https://homedetail.ua',
    owner: 'HomeDetail',
    category: 'Декор та меблі',
    quote: 'Прогресивна шкала знижок мотивує додати ще товар. Замовлення на 2500 грн перетворилися на 3500 — без агресивних акцій.',
    metrics: [{ label: 'середній чек', value: '+15%' }, { label: 'LTV', value: '+19%' }],
    widgets: ['Прогресивна знижка', 'Безкоштовна доставка'],
    color: '#8b5cf6',
    rating: 5,
  },
]

// ─── Page ────────────────────────────────────────────────────────────────────

const ALL_TAGS: (Tag | 'all')[] = ['all', 'conversion', 'trust', 'social-proof', 'avg-order', 'urgency', 'loyalty', 'engagement', 'visual']
const TAG_LABELS_WITH_ALL: Record<string, string> = { all: 'Всі', ...tagLabels }

export function WidgetsPage() {
  const [activeTag, setActiveTag] = useState<Tag | 'all'>('all')

  const filtered = activeTag === 'all' ? widgets : widgets.filter((w) => w.tag === activeTag)

  return (
    <div className="wp">
      <Helmet>
        <title>Всі віджети — Widgetis | Готові рішення для e-commerce</title>
        <meta
          name="description"
          content="15 готових віджетів для інтернет-магазинів. Підвищуйте конверсію, середній чек і лояльність клієнтів без програміста."
        />
      </Helmet>

      {/* ── Hero ── */}
      <section className="wp__hero">
        <div className="wp__hero-bg" aria-hidden="true">
          <div className="wp__hero-glow wp__hero-glow--left" />
          <div className="wp__hero-glow wp__hero-glow--right" />
          <div className="wp__hero-grid" />
        </div>
        <div className="wp__hero-inner">
          <p className="wp__hero-eyebrow">
            <Sparkles size={12} strokeWidth={2.5} />
            15 готових віджетів
          </p>
          <h1 className="wp__hero-title">
            Інструменти, що<br />
            <span className="wp__hero-accent">продають самі</span>
          </h1>
          <p className="wp__hero-sub">
            Кожен віджет — перевірений результат у реальних магазинах.<br />
            Встановлення за 2 хвилини, вплив — з першого дня.
          </p>

          <div className="wp__hero-stats">
            <div className="wp__stat">
              <strong>15</strong>
              <span>готових віджетів</span>
            </div>
            <div className="wp__stat-div" />
            <div className="wp__stat">
              <strong>120+</strong>
              <span>магазинів</span>
            </div>
            <div className="wp__stat-div" />
            <div className="wp__stat">
              <strong>+18%</strong>
              <span>конверсія в середньому</span>
            </div>
            <div className="wp__stat-div" />
            <div className="wp__stat">
              <strong>2 хв</strong>
              <span>встановлення</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tag filter ── */}
      <div className="wp__filters">
        <div className="wp__filters-inner">
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`wp__filter-btn ${activeTag === tag ? 'wp__filter-btn--active' : ''}`}
              onClick={() => setActiveTag(tag)}
            >
              {TAG_LABELS_WITH_ALL[tag]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Widget grid ── */}
      <section className="wp__grid-section">
        <div className="wp__container">
          <div className="wp__grid">
            {filtered.map((w, i) => (
              <WidgetCard key={w.id} widget={w} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Cases ── */}
      <section className="wp__cases">
        <div className="wp__container">
          <header className="wp__section-head">
            <p className="wp__eyebrow">
              <TrendingUp size={12} strokeWidth={2.5} />
              Реальні результати
            </p>
            <h2 className="wp__section-title">Магазини, що вже ростуть</h2>
            <p className="wp__section-sub">Конкретні цифри від реальних клієнтів</p>
          </header>

          <div className="wp__cases-grid">
            {FEATURED_CASES.map((c) => (
              <article key={c.store} className="wcase" style={{ '--wcase-color': c.color } as React.CSSProperties}>
                <div className="wcase__top">
                  <div className="wcase__avatar" style={{ background: `${c.color}22`, color: c.color }}>
                    {c.owner.charAt(0)}
                  </div>
                  <div className="wcase__meta">
                    <strong className="wcase__owner">{c.owner}</strong>
                    <span className="wcase__category">{c.category}</span>
                  </div>
                  <div className="wcase__stars">
                    {Array.from({ length: c.rating }).map((_, i) => (
                      <Star key={i} size={12} fill="#fbbf24" strokeWidth={0} />
                    ))}
                  </div>
                </div>

                <div className="wcase__metrics">
                  {c.metrics.map((m, i) => (
                    <div key={i} className="wcase__metric">
                      <strong style={{ color: '#10b981' }}>{m.value}</strong>
                      <span>{m.label}</span>
                    </div>
                  ))}
                </div>

                <blockquote className="wcase__quote">«{c.quote}»</blockquote>

                <div className="wcase__footer">
                  <div className="wcase__widgets">
                    <Layers size={11} strokeWidth={2.5} />
                    {c.widgets.join(' · ')}
                  </div>
                  <a
                    href={c.storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wcase__link"
                  >
                    {c.store}
                    <ExternalLink size={11} strokeWidth={2} />
                  </a>
                </div>
              </article>
            ))}
          </div>

          <div className="wp__cases-more">
            <Link to="/cases" className="wp__cases-more-link">
              Всі кейси
              <ArrowRight size={14} strokeWidth={2.25} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <Testimonials />

      {/* ── Pricing CTA ── */}
      <section className="wp__cta">
        <div className="wp__container">
          <div className="wp__cta-card">
            <div className="wp__cta-glow" aria-hidden="true" />
            <p className="wp__cta-eyebrow">
              <Users size={12} strokeWidth={2.5} />
              Приєднуйтесь до 120+ магазинів
            </p>
            <h2 className="wp__cta-title">Готові почати?</h2>
            <p className="wp__cta-sub">
              Оберіть план та отримайте доступ до всіх потрібних віджетів.<br />
              14 днів гарантія повернення коштів.
            </p>
            <div className="wp__cta-plans">
              {[
                { name: 'Basic', price: '799', period: '/міс', desc: '4 віджети · 1 сайт', id: 'basic' },
                { name: 'Pro',   price: '1 599', period: '/міс', desc: '8 віджетів · 3 сайти', id: 'pro', popular: true },
                { name: 'Max',   price: '2 899', period: '/міс', desc: '17 віджетів · 5 сайтів', id: 'max' },
              ].map((p) => (
                <Link
                  key={p.id}
                  to={`/pricing?plan=${p.id}`}
                  className={`wp__cta-plan ${p.popular ? 'wp__cta-plan--popular' : ''}`}
                >
                  {p.popular && <span className="wp__cta-plan-badge">Популярний</span>}
                  <strong className="wp__cta-plan-name">{p.name}</strong>
                  <div className="wp__cta-plan-price">
                    <span>{p.price}</span>
                    <small>₴{p.period}</small>
                  </div>
                  <span className="wp__cta-plan-desc">{p.desc}</span>
                  <span className="wp__cta-plan-arrow">
                    <ArrowRight size={14} strokeWidth={2.25} />
                  </span>
                </Link>
              ))}
            </div>
            <Link to="/pricing#compare-plans" className="wp__cta-compare">
              Порівняти всі плани
              <ArrowRight size={13} strokeWidth={2.25} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
