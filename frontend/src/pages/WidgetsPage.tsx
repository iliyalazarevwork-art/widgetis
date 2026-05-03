import { useState, useEffect, useRef } from 'react'
import { SeoHead } from '../components/SeoHead'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Star,
  Sparkles,
  TrendingUp,
  Users,
  Sprout,
  Zap,
  Crown,
  ChevronRight,
} from 'lucide-react'
import { availableWidgetTags, widgets, tagLabels, type Tag } from '../data/widgets'
import { get } from '../api/client'
import { PREVIEW_MAP, PreviewOnePlusOneCard } from '../components/WidgetPreviews'
import './WidgetsPage.css'

// ─── Cases data per widget ──────────────────────────────────────────────────

const WIDGET_CASES: Record<string, { store: string; metric: string; color: string }[]> = {
  'promo-line':         [
    { store: 'ptashkinsad.com', metric: '+18% середній чек', color: '#22C55E' },
    { store: 'benihome.com.ua', metric: '+24% конверсія',    color: '#22C55E' },
    { store: 'ballistic.com.ua',metric: '−31% відмов',       color: '#3B82F6' },
  ],
  'delivery-date':      [
    { store: 'modnakasta.ua', metric: '−40% питань до чату', color: '#22C55E' },
  ],
  'buyer-count':        [
    { store: 'kyivfit.store', metric: '+42% email-база', color: '#22C55E' },
  ],
  'cart-goal':          [
    { store: 'homedetail.ua', metric: '+15% середній чек', color: '#22C55E' },
  ],
  'stock-left':         [
    { store: 'ballistic.com.ua', metric: '−31% відмов', color: '#3B82F6' },
  ],
  'photo-video-reviews':[
    { store: 'kyivfit.store', metric: '+42% email-база', color: '#22C55E' },
  ],
  'spin-the-wheel':     [
    { store: 'kyivfit.store', metric: '+42% email-база', color: '#22C55E' },
  ],
  'progressive-discount': [
    { store: 'homedetail.ua', metric: '+15% середній чек', color: '#22C55E' },
  ],
  'last-chance-popup':  [
    { store: 'stylehub.com.ua', metric: '+33% конверсія', color: '#22C55E' },
  ],
  'one-plus-one':       [
    { store: 'benihome.com.ua', metric: '+24% середній чек', color: '#22C55E' },
  ],
}

// ─── Tag accent colors ──────────────────────────────────────────────────────

const TAG_ACCENT: Record<Tag, string> = {
  conversion:     '#10B981',
  trust:          '#3B82F6',
  'social-proof': '#F59E0B',
  visual:         '#8B5CF6',
  'avg-order':    '#10B981',
  urgency:        '#EF4444',
  loyalty:        '#3B82F6',
  engagement:     '#EC4899',
}

// ─── Widget preview mockup ──────────────────────────────────────────────────

function WidgetMockup({ id }: { id: string }) {
  const Preview = id === 'one-plus-one' ? PreviewOnePlusOneCard : PREVIEW_MAP[id]
  if (!Preview) return null
  return (
    <div className="wc__preview">
      <Preview />
    </div>
  )
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
          {(widget.isNew || widget.isPopular) && (
            <span className="wc__markers">
              {widget.isNew && (
                <span className="wc__new">
                  <Star size={10} strokeWidth={2.5} />
                  Новинка
                </span>
              )}
              {widget.isPopular && (
                <span className="wc__popular">
                  <Sparkles size={10} strokeWidth={2.5} />
                  Хіт
                </span>
              )}
            </span>
          )}
        </div>

        <h3 className="wc__title">{widget.title}</h3>

        <WidgetMockup id={widget.id} />

        {usedIn.length > 0 && (
          <div className="wc__used">
            <span className="wc__used-label">Використовується в</span>
            <div className="wc__used-list">
              {usedIn.slice(0, 2).map((c) => (
                <span key={c.store} className="wc__used-store">
                  <span className="wc__used-bullet" aria-hidden="true" />
                  <span className="wc__used-domain">{c.store}</span>
                  <strong style={{ color: c.color }}>{c.metric}</strong>
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
    owner: 'Ballistic',
    metrics: [{ label: 'відмов', value: '−31%' }, { label: 'конверсія', value: '+18%' }],
    color: '#ef4444',
    rating: 5,
  },
  {
    store: 'ptashkinsad.com',
    owner: 'Ptashkinsad',
    metrics: [{ label: 'середній чек', value: '+18%' }, { label: 'конверсія', value: '+24%' }],
    color: '#10b981',
    rating: 5,
  },
  {
    store: 'benihome.com.ua',
    owner: 'Benihome',
    metrics: [{ label: 'відмов', value: '−40%' }, { label: 'повторних покупок', value: '+31%' }],
    color: '#3b82f6',
    rating: 5,
  },
]

// ─── Page ────────────────────────────────────────────────────────────────────

const ALL_TAGS: (Tag | 'all')[] = ['all', ...availableWidgetTags]
const TAG_LABELS_WITH_ALL: Record<string, string> = { all: 'Всі', ...tagLabels }

interface TagApiItem { slug: string; count: number }

export function WidgetsPage() {
  const [activeTag, setActiveTag] = useState<Tag | 'all'>('all')
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    get<{ data: TagApiItem[] }>('/tags')
      .then(res => {
        const counts: Record<string, number> = {}
        for (const t of res.data) counts[t.slug] = t.count
        setTagCounts(counts)
      })
      .catch(() => {})
  }, [])

  const totalCount = Object.values(tagCounts).reduce((s, n) => s + n, 0)

  const filtered = activeTag === 'all' ? widgets : widgets.filter((w) => w.tag === activeTag)

  return (
    <div className="wp">
      <SeoHead
        title="Віджети для Хорошоп — 21 готовий інструмент | Widgetis"
        description="21 маркетинговий віджет для Хорошоп: бігуча стрічка, дата доставки, фотовідгуки, колесо фортуни, прогресивна знижка, SMS-верифікація та інші. Збільшують конверсію та середній чек — встановлення без програміста."
        keywords="віджети Хорошоп, плагіни для Хорошоп, віджети Horoshop, плагіни Horoshop, таймер зворотного відліку Хорошоп, бігуча стрічка Хорошоп, фотовідгуки Хорошоп, конверсія інтернет-магазину Хорошоп"
        path="/widgets"
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Маркетингові віджети для Хорошоп — Widgetis',
            description: '21 готовий маркетинговий віджет для магазинів на платформі Хорошоп.',
            inLanguage: 'uk-UA',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Головна', item: 'https://widgetis.com/' },
              { '@type': 'ListItem', position: 2, name: 'Віджети', item: 'https://widgetis.com/widgets' },
            ],
          },
        ]}
      />

      {/* ── Hero ── */}
      <section className="wp__hero">
        <div className="wp__hero-badge">
          <span className="wp__hero-badge-dot" aria-hidden="true" />
          КАТАЛОГ ВІДЖЕТІВ
        </div>
        <h1 className="wp__hero-title">
          Інструменти,<br />що продають
        </h1>
        <p className="wp__hero-sub">
          Підключіть один раз — і магазин<br />
          починає конвертувати краще.
        </p>
      </section>

      {/* ── Tag filter ── */}
      <div className="wp__filters">
        <div className="wp__filters-inner">
          {ALL_TAGS.map((tag) => {
            const count = tag === 'all' ? totalCount : (tagCounts[tag] ?? 0)
            return (
              <button
                key={tag}
                type="button"
                className={`wp__filter-btn ${activeTag === tag ? 'wp__filter-btn--active' : ''}`}
                onClick={() => setActiveTag(tag)}
              >
                {TAG_LABELS_WITH_ALL[tag]}
                {count > 0 && (
                  <span className="wp__filter-count">{count}</span>
                )}
              </button>
            )
          })}
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
            <h2 className="wp__section-title">Магазини,<br />що вже ростуть</h2>
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
                    <span className="wcase__category">{c.store}</span>
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
                      <strong>{m.value}</strong>
                      <span>{m.label}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing CTA ── */}
      <section className="wp__cta">
        <div className="wp__cta-inner">
          <div className="wp__cta-badge">
            <Users size={13} strokeWidth={2.5} />
            ПРИЄДНУЙТЕСЬ ДО 120+ МАГАЗИНІВ
          </div>
          <h2 className="wp__cta-title">Готові почати?</h2>
          <p className="wp__cta-sub">
            Оберіть план та отримайте доступ до всіх потрібних віджетів. 14 днів гарантія повернення коштів.
          </p>

          <div className="wp__cta-plans">
            {([
              { id: 'basic', name: 'Basic', Icon: Sprout, color: '#10b981', desc: '4 віджети · 1 сайт', price: '799', popular: false },
              { id: 'pro',   name: 'Pro',   Icon: Zap,    color: '#3B82F6', desc: '8 віджетів · 3 сайти', price: '1 599', popular: true },
              { id: 'max',   name: 'Max',   Icon: Crown,  color: '#A855F7', desc: '17 віджетів · 5 сайтів', price: '2 899', popular: false },
            ] as const).map((p) => (
              <Link
                key={p.id}
                to={`/pricing?plan=${p.id}`}
                className={`wp__cta-plan-row ${p.popular ? 'wp__cta-plan-row--popular' : ''}`}
                style={{ '--plan-color': p.color } as React.CSSProperties}
              >
                <div className="wp__cta-plan-left">
                  <div className="wp__cta-plan-ico">
                    <p.Icon size={15} strokeWidth={2} />
                  </div>
                  <div className="wp__cta-plan-info">
                    <div className="wp__cta-plan-name-row">
                      <strong className="wp__cta-plan-name">{p.name}</strong>
                      {p.popular && <span className="wp__cta-plan-popular">Популярний</span>}
                    </div>
                    <span className="wp__cta-plan-desc">{p.desc}</span>
                  </div>
                </div>
                <div className="wp__cta-plan-right">
                  <div className="wp__cta-plan-price">
                    <span>{p.price}</span>
                    <small>₴/міс</small>
                  </div>
                  <ChevronRight size={14} strokeWidth={2} className="wp__cta-plan-chevron" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
