import { useEffect, useRef, useState } from 'react'
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

type PortfolioKind = 'case' | 'site'

interface PortfolioItem {
  key: string
  kind: PortfolioKind
  store: string
  storeUrl: string
  owner: string
  description: string | null
  color: string
  rating: number | null
  resultMetric: string | null
  resultPeriod: string | null
  plan: string | null
  widgets: CaseWidget[]
}

function apiCaseToItem(c: ApiCase): PortfolioItem {
  return {
    key: `case-${c.id}`,
    kind: 'case',
    store: c.store,
    storeUrl: c.store_url,
    owner: c.owner ?? c.store,
    description: c.description,
    color: c.color ?? '#6366f1',
    rating: c.review_rating,
    resultMetric: c.result_metric,
    resultPeriod: c.result_period,
    plan: c.plan,
    widgets: c.widgets,
  }
}


function useSitesPerPage() {
  const [perPage, setPerPage] = useState(() =>
    window.matchMedia('(min-width: 768px)').matches ? 10 : 5
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e: MediaQueryListEvent) => setPerPage(e.matches ? 10 : 5)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return perPage
}

function getPaginationItems(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)

  const pages = new Set<number>([0, total - 1])
  for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) {
    pages.add(i)
  }

  const sorted = Array.from(pages).sort((a, b) => a - b)
  const result: (number | '...')[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...')
    result.push(sorted[i])
  }
  return result
}

export function CasesPage() {
  const [apiCases, setApiCases] = useState<ApiCase[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const gridRef = useRef<HTMLDivElement>(null)
  const perPage = useSitesPerPage()

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(0) }, [perPage])

  const allItems: PortfolioItem[] = apiCases.map(apiCaseToItem)

  const totalPages = Math.ceil(allItems.length / perPage)
  const visibleItems = allItems.slice(page * perPage, (page + 1) * perPage)
  const paginationItems = getPaginationItems(page, totalPages)

  const goToPage = (p: number) => {
    setPage(p)
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    get<CasesResponse>('/cases')
      .then((res) => setApiCases(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="cases-page">
      <SeoHead
        title={`Кейси магазинів на Хорошоп — ${BRAND_NAME_UPPER}`}
        description={`Реальні результати магазинів на Хорошоп з віджетами Widgetis: вища конверсія, більший середній чек, менше відмов. Кейси з конкретними цифрами — як маркетингові віджети збільшили продажі.`}
        keywords="кейси Хорошоп, кейси Horoshop, результати впровадження віджетів Хорошоп, кейси інтернет-магазинів Хорошоп, збільшення конверсії Хорошоп, середній чек Хорошоп"
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
          <div className="cases-page__subtitle cases-page__proof">
            <div className="cases-page__proof-stars" aria-label="Середня оцінка 4.8">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} strokeWidth={0} fill="currentColor" />
              ))}
              <span>4.8</span>
            </div>
            <div className="cases-page__proof-div" aria-hidden="true" />
            <span className="cases-page__proof-trust">100+ клієнтів нам довіряють</span>
          </div>
        </div>
      </section>

      <section className="cases-page__content">
        <div className="cases-page__container">
          <div className="cases-page__grid" ref={gridRef}>
            {loading && Array.from({ length: perPage }).map((_, i) => (
              <div key={i} className="case-card case-card--skeleton" aria-hidden="true" />
            ))}
            {!loading && visibleItems.map((item, i) => (
              <div
                key={item.key}
                className="case-card"
                style={{ animationDelay: `${i * 60}ms`, ['--case-color' as string]: item.color } as React.CSSProperties}
              >
                <div className="case-card__browser">
                  <div className="case-card__dots" aria-hidden="true"><span /><span /><span /></div>
                  <div className="case-card__url">{item.store}</div>
                  <ExternalLink size={13} strokeWidth={2} className="case-card__browser-ext" aria-hidden="true" />
                </div>

                <div className="case-card__body">
                  <header className="case-card__head">
                    <div className="case-card__avatar" aria-hidden="true">{item.owner.charAt(0)}</div>
                    <div className="case-card__meta">
                      <strong className="case-card__name">{item.owner}</strong>
                      <span className="case-card__desc">{item.description}</span>
                    </div>
                  </header>

                  {item.kind === 'case' && item.resultMetric && (
                    <div className="case-card__metric">
                      <TrendingUp size={16} strokeWidth={2.25} />
                      <div className="case-card__metric-body">
                        <strong>{item.resultMetric}</strong>
                        <span>{item.resultPeriod}</span>
                      </div>
                    </div>
                  )}

                  {item.kind === 'case' && item.plan && PLAN_ICONS[item.plan as PlanSlug] && (() => {
                    const PlanIcon = PLAN_ICONS[item.plan as PlanSlug]
                    const planColor = PLAN_COLORS[item.plan as PlanSlug]
                    const planName = item.plan.charAt(0).toUpperCase() + item.plan.slice(1)
                    return (
                      <div className="case-card__plan" style={{ '--plan-color': planColor } as React.CSSProperties}>
                        <PlanIcon size={11} strokeWidth={2.25} />
                        <span>{planName}</span>
                        <span className="case-card__plan-widgets">{item.widgets.length} з {item.plan === 'basic' ? 4 : item.plan === 'pro' ? 8 : 17} віджетів</span>
                      </div>
                    )
                  })()}


                  {item.rating !== null && (
                    <div className="case-card__rating">
                      <div className="case-card__stars" aria-label={`${item.rating} з 5`}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} size={12} strokeWidth={0} fill={j < item.rating! ? '#f5b400' : 'var(--text-ghost)'} />
                        ))}
                      </div>
                      <span className="case-card__rating-value">{Number(item.rating).toFixed(1)}</span>
                    </div>
                  )}

                  {item.kind === 'case' && item.widgets.length > 0 && (
                    <div className="case-card__widgets">
                      {item.widgets.map((w) => {
                        const entry = WIDGET_TAG_ICONS[w.name]
                        const IconComp = entry?.icon
                        const inner = (
                          <>{IconComp && <IconComp size={10} strokeWidth={2} color={entry.color} className="case-card__widget-tag-icon" />}{w.name}</>
                        )
                        return w.slug
                          ? <Link key={w.name} to={`/widgets/${w.slug}`} className="case-card__widget-tag case-card__widget-tag--link">{inner}</Link>
                          : <span key={w.name} className="case-card__widget-tag">{inner}</span>
                      })}
                    </div>
                  )}

                  <a href={isSafeUrl(item.storeUrl) ? item.storeUrl : '#'} target="_blank" rel="noopener noreferrer" className="case-card__link">
                    <span>Перейти на сайт</span>
                    <ExternalLink size={14} strokeWidth={2.25} />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {!loading && totalPages > 1 && (
            <div className="cases-page__pagination-wrap">
              <div className="cases-page__pagination">
                <button className="cases-page__pag-btn" onClick={() => goToPage(Math.max(0, page - 1))} disabled={page === 0} aria-label="Попередня сторінка">
                  <ArrowLeft size={14} strokeWidth={2.5} />
                </button>
                {paginationItems.map((item, idx) =>
                  item === '...'
                    ? <span key={`dots-${idx}`} className="cases-page__pag-dots">...</span>
                    : <button key={item} className={`cases-page__pag-num${item === page ? ' cases-page__pag-num--active' : ''}`} onClick={() => goToPage(item)} aria-label={`Сторінка ${item + 1}`} aria-current={item === page ? 'page' : undefined}>{item + 1}</button>
                )}
                <button className="cases-page__pag-btn" onClick={() => goToPage(Math.min(totalPages - 1, page + 1))} disabled={page === totalPages - 1} aria-label="Наступна сторінка">
                  <ArrowLeft size={14} strokeWidth={2.5} style={{ transform: 'rotate(180deg)' }} />
                </button>
              </div>
            </div>
          )}

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
