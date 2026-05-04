import { useState } from 'react'
import { SeoHead } from '../components/SeoHead'
import { Link } from 'react-router-dom'
import {
  Star,
  TrendingUp,
  Users,
  Sprout,
  Zap,
  Crown,
  ChevronRight,
} from 'lucide-react'
import { useWidgets, useWidgetTags } from '../hooks/useWidgets'
import type { TagSlug } from '../data/widgetTags'
import { FeaturedWidgetCard as WidgetCard } from '../components/FeaturedWidgetCard'
import './WidgetsPage.css'

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

export function WidgetsPage() {
  const [activeTag, setActiveTag] = useState<TagSlug | 'all'>('all')
  const { widgets, loading: widgetsLoading } = useWidgets()
  const { tags } = useWidgetTags()

  const tagCounts: Record<string, number> = {}
  for (const t of tags) tagCounts[t.slug] = t.count
  const totalCount = Object.values(tagCounts).reduce((s, n) => s + n, 0)

  const allTags: (TagSlug | 'all')[] = ['all', ...tags.map((t) => t.slug as TagSlug)]
  const tagLabelsMap: Record<string, string> = { all: 'Всі' }
  for (const t of tags) tagLabelsMap[t.slug] = t.name

  const filtered =
    activeTag === 'all' ? widgets : widgets.filter((w) => w.tag?.slug === activeTag)

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
          ...(widgets.length > 0
            ? [{
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                name: 'Каталог віджетів Widgetis',
                numberOfItems: widgets.length,
                itemListElement: widgets.map((w, i) => ({
                  '@type': 'ListItem',
                  position: i + 1,
                  url: `https://widgetis.com/widgets/${w.slug}`,
                  name: w.name,
                })),
              }]
            : []),
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
          {allTags.map((tag) => {
            const count = tag === 'all' ? totalCount : (tagCounts[tag] ?? 0)
            return (
              <button
                key={tag}
                type="button"
                className={`wp__filter-btn ${activeTag === tag ? 'wp__filter-btn--active' : ''}`}
                onClick={() => setActiveTag(tag)}
              >
                {tagLabelsMap[tag] ?? tag}
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
          {widgetsLoading ? (
            <div className="wp__grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="wc wc--skeleton" />
              ))}
            </div>
          ) : (
            <div className="wp__grid">
              {filtered.map((w, i) => (
                <WidgetCard key={w.slug} widget={w} index={i} />
              ))}
            </div>
          )}
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
