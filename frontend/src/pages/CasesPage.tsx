import { useEffect, useState } from 'react'
import { SeoHead } from '../components/SeoHead'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Camera,
  Coins,
  Disc3,
  ExternalLink,
  Eye,
  Gift,
  Hourglass,
  Megaphone,
  Package,
  Puzzle,
  ShoppingCart,
  Star,
  TrendingUp,
  Truck,
  type LucideIcon,
} from 'lucide-react'
import { BRAND_NAME_UPPER } from '../constants/brand'
import { get } from '../api/client'
import { PLAN_ICONS, PLAN_COLORS, type PlanSlug } from '../data/plans'
import './CasesPage.css'

const WIDGET_TAG_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  'Бігуча стрічка': { icon: Megaphone, color: '#7C3AED' },
  'Дата доставки': { icon: Package, color: '#059669' },
  'Ціль кошика': { icon: ShoppingCart, color: '#EA580C' },
  "Відео-прев'ю": { icon: Camera, color: '#6366F1' },
  'Хто зараз дивиться': { icon: Eye, color: '#EC4899' },
  'Таймер': { icon: Hourglass, color: '#8B5CF6' },
  'Дефіцит товару': { icon: Bell, color: '#14B8A6' },
  'Лічильник покупок': { icon: ShoppingCart, color: '#EA580C' },
  'Фотовідгуки': { icon: Camera, color: '#6366F1' },
  'Колесо фортуни': { icon: Disc3, color: '#F97316' },
  'Безкоштовна доставка': { icon: Truck, color: '#16A34A' },
  'Хтось щойно купив': { icon: Bell, color: '#14B8A6' },
  'Прогресивна знижка': { icon: BarChart3, color: '#22C55E' },
  'Квіз-рекомендатор': { icon: Puzzle, color: '#3B82F6' },
  'Кешбек': { icon: Coins, color: '#F59E0B' },
  'Акція 1+1=3': { icon: Gift, color: '#F43F5E' },
}

interface CaseWidget {
  name: string
  slug: string | null
}

interface ApiCase {
  id: number
  store: string
  store_url: string
  store_logo_url: string | null
  owner: string | null
  description: string | null
  review_text: string | null
  review_rating: number | null
  result_metric: string | null
  result_period: string | null
  color: string | null
  plan: string | null
  widgets: CaseWidget[]
}

interface CasesResponse {
  data: ApiCase[]
}

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export function CasesPage() {
  const [cases, setCases] = useState<ApiCase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    get<CasesResponse>('/cases')
      .then((res) => setCases(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="cases-page">
      <SeoHead
        title={`Кейси магазинів на Horoshop — ${BRAND_NAME_UPPER} | +24% конверсії`}
        description={`Реальні результати магазинів на Horoshop: +18% середній чек, +24% конверсія, −31% відмов. Кейси з конкретними цифрами — як маркетингові віджети збільшили продажі.`}
        keywords="результати впровадження віджетів Хорошоп, кейси інтернет-магазинів Хорошоп, збільшення конверсії Хорошоп, середній чек Хорошоп, horoshop магазин кейси"
        path="/cases"
      />

      <section className="cases-page__hero">
        <div className="cases-page__hero-bg" aria-hidden="true">
          <div className="cases-page__hero-glow cases-page__hero-glow--1" />
          <div className="cases-page__hero-glow cases-page__hero-glow--2" />
        </div>
        <div className="cases-page__hero-content page-hero-stack">
          <Link to="/" className="cases-page__back page-back-link">
            <ArrowLeft size={16} strokeWidth={2.25} />
            На головну
          </Link>
          <p className="cases-page__eyebrow page-eyebrow">Кейси</p>
          <h1 className="cases-page__title">
            Реальні магазини, <br />
            <span className="cases-page__title-accent">реальні цифри</span>
          </h1>
          <p className="cases-page__subtitle">
            {!loading && cases.length > 0
              ? `${cases.length} українських магазинів вже використовують віджети. Ось що вийшло.`
              : 'Українські магазини вже використовують віджети. Ось що вийшло.'}
          </p>
        </div>
      </section>

      <section className="cases-page__content">
        <div className="cases-page__container">
          <div className="cases-page__grid">
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="case-card case-card--skeleton" aria-hidden="true" />
            ))}
            {!loading && cases.map((c, i) => (
              <div
                key={c.id}
                className="case-card"
                style={
                  {
                    animationDelay: `${i * 60}ms`,
                    ['--case-color' as string]: c.color ?? '#6366f1',
                  } as React.CSSProperties
                }
              >
                {/* Browser chrome */}
                <div className="case-card__browser">
                  <div className="case-card__dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="case-card__url">{c.store}</div>
                  <ExternalLink
                    size={13}
                    strokeWidth={2}
                    className="case-card__browser-ext"
                    aria-hidden="true"
                  />
                </div>

                {/* Body */}
                <div className="case-card__body">
                  <header className="case-card__head">
                    <div className="case-card__avatar" aria-hidden="true">
                      {(c.owner ?? c.store).charAt(0)}
                    </div>
                    <div className="case-card__meta">
                      <strong className="case-card__name">{c.owner ?? c.store}</strong>
                      <span className="case-card__desc">{c.description}</span>
                    </div>
                  </header>

                  {c.result_metric && (
                    <div className="case-card__metric">
                      <TrendingUp size={16} strokeWidth={2.25} />
                      <div className="case-card__metric-body">
                        <strong>{c.result_metric}</strong>
                        <span>{c.result_period}</span>
                      </div>
                    </div>
                  )}

                  {c.plan && PLAN_ICONS[c.plan as PlanSlug] && (() => {
                    const PlanIcon = PLAN_ICONS[c.plan as PlanSlug]
                    const planColor = PLAN_COLORS[c.plan as PlanSlug]
                    const planName = c.plan.charAt(0).toUpperCase() + c.plan.slice(1)
                    return (
                      <div className="case-card__plan" style={{ '--plan-color': planColor } as React.CSSProperties}>
                        <PlanIcon size={11} strokeWidth={2.25} />
                        <span>{planName}</span>
                        <span className="case-card__plan-widgets">{c.widgets.length} з {c.plan === 'basic' ? 4 : c.plan === 'pro' ? 8 : 17} віджетів</span>
                      </div>
                    )
                  })()}

                  {c.review_rating && (
                    <div className="case-card__rating">
                      <div className="case-card__stars" aria-label={`${c.review_rating} з 5`}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star
                            key={j}
                            size={12}
                            strokeWidth={0}
                            fill={j < (c.review_rating ?? 0) ? '#f5b400' : 'var(--text-ghost)'}
                          />
                        ))}
                      </div>
                      <span className="case-card__rating-value">{Number(c.review_rating).toFixed(1)}</span>
                    </div>
                  )}

                  {c.widgets.length > 0 && (
                    <div className="case-card__widgets">
                      {c.widgets.map((w) => {
                        const entry = WIDGET_TAG_ICONS[w.name]
                        const IconComp = entry?.icon
                        const inner = (
                          <>
                            {IconComp && (
                              <IconComp
                                size={10}
                                strokeWidth={2}
                                color={entry.color}
                                className="case-card__widget-tag-icon"
                              />
                            )}
                            {w.name}
                          </>
                        )
                        return w.slug ? (
                          <Link
                            key={w.name}
                            to={`/widgets/${w.slug}`}
                            className="case-card__widget-tag case-card__widget-tag--link"
                          >
                            {inner}
                          </Link>
                        ) : (
                          <span key={w.name} className="case-card__widget-tag">
                            {inner}
                          </span>
                        )
                      })}
                    </div>
                  )}

                  <a
                    href={isSafeUrl(c.store_url) ? c.store_url : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="case-card__link"
                  >
                    <span>Перейти на сайт</span>
                    <ExternalLink size={14} strokeWidth={2.25} />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="cases-page__cta">
            <h3 className="cases-page__cta-title">Хочеш такі ж результати?</h3>
            <p className="cases-page__cta-sub">
              Обери віджети в каталозі — встановлюється за 3 хвилини
            </p>
            <Link to="/widgets" className="cases-page__cta-btn">
              До каталогу
              <ArrowLeft size={14} strokeWidth={2.5} style={{ transform: 'rotate(180deg)' }} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
