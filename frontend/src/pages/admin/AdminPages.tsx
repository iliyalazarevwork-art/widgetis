import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import { uk } from 'date-fns/locale'
import 'react-datepicker/dist/react-datepicker.css'
import {
  ArrowRight,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  CircleAlert,
  ExternalLink,
  Globe,
  Mail,
  Banknote,
  Phone,
  Repeat2,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  UserPlus,
  Wand2,
  X,
} from 'lucide-react'
import { get } from '../../api/client'
import { SocialIcon } from '../../components/SocialIcon'
import { useSettings } from '../../context/SettingsContext'
import { BRAND_EMAIL, BRAND_NAME } from '../../constants/brand'
import type { PaginatedResponse } from '../../types'
import { AdminConfiguratorPage } from './AdminConfiguratorPage'
import { AdminScreenLayout } from './AdminScreenLayout'
import './pages.css'

const ORDER_FILTERS = [
  { label: 'Всі', value: undefined },
  { label: 'Оплачено', value: 'paid' },
  { label: 'Очікує', value: 'pending' },
  { label: 'Завершено', value: 'completed' },
  { label: 'Скасовано', value: 'cancelled' },
  { label: 'Повернено', value: 'refunded' },
] as const

const SORT_FIELDS = [
  { label: 'Дата', value: 'created_at' },
  { label: 'Сума', value: 'amount' },
] as const

const PLAN_FILTERS = [
  { label: 'Усі плани', value: undefined },
  { label: 'Basic', value: 'basic' },
  { label: 'Pro', value: 'pro' },
  { label: 'Max', value: 'max' },
] as const


const REQUESTS = [
  { id: 'R-0018', name: 'shop@northwear.ua', type: 'Інтеграція', risk: 'Високий', note: 'Сайт не відповідає > 12 годин' },
  { id: 'R-0019', name: 'support@novahub.ua', type: 'Оплата', risk: 'Середній', note: 'Потрібно перевірити реквізити' },
  { id: 'R-0020', name: 'hello@greenline.store', type: 'Віджет', risk: 'Низький', note: 'Запит на новий шаблон' },
]

const CONTENT_BLOCKS = [
  { id: 'hero', title: 'Hero Section', status: 'active', updated: '10 хв тому' },
  { id: 'features', title: 'Features Block', status: 'active', updated: '2 год тому' },
  { id: 'pricing', title: 'Pricing Table', status: 'draft', updated: '1 день тому' },
  { id: 'faq', title: 'FAQ Block', status: 'active', updated: '3 дні тому' },
]


function getSiteActions(_siteId: string) {
  return [
    { title: 'Перейти до замовлень', to: '/admin/orders', icon: ArrowRight },
    { title: 'Всі підписки', to: '/admin/subscriptions', icon: Repeat2 },
  ]
}

const ADMIN_MENU_LINKS = [
  { to: '/admin/settings', label: 'Налаштування', icon: Settings },
  { to: '/admin/finance', label: 'Фінанси', icon: Banknote },
  { to: '/admin/manager-requests', label: 'Manager Requests', icon: UserPlus },
]

const MESSENGER_META: Record<string, { name: string; color: string }> = {
  telegram:  { name: 'Telegram',  color: '#26A5E4' },
  viber:     { name: 'Viber',     color: '#7360F2' },
  whatsapp:  { name: 'WhatsApp',  color: '#25D366' },
}


type OrderFilterLabel = (typeof ORDER_FILTERS)[number]['label']

type AdminOrder = {
  id: number
  order_number: string | null
  customer_email: string | null
  plan: string | null
  amount: number
  currency: string | null
  status: string | null
  billing_period: string | null
  created_at: string
}

type AdminSubscription = {
  id: number
  user_email: string | null
  plan: string | null
  status: string | null
  billing_period: string | null
  is_trial: boolean
  created_at: string
}

type AdminSubscriptionStats = {
  active: number
  trial: number
  cancelled: number
  risk: number
}

const SUBSCRIPTION_FILTERS = [
  { label: 'Усі', value: undefined },
  { label: 'Active', value: 'active' },
  { label: 'Trial', value: 'trial' },
  { label: 'Cancelled', value: 'cancelled' },
] as const

type SubscriptionFilterLabel = (typeof SUBSCRIPTION_FILTERS)[number]['label']

function formatMoney(value: number, currency: string | null = 'UAH') {
  if (!currency || currency.toUpperCase() === 'UAH') {
    return `${value.toLocaleString('uk-UA')} грн`
  }

  return `${value.toLocaleString('uk-UA')} ${currency.toUpperCase()}`
}

function orderStatusLabel(value: string | null): string {
  switch (value) {
    case 'paid': return 'Оплачено'
    case 'pending': return 'Очікує'
    case 'completed': return 'Завершено'
    case 'cancelled': return 'Скасовано'
    case 'refunded': return 'Повернено'
    default: return value || 'Невідомо'
  }
}

function formatOrderAge(raw: string): string {
  const createdAt = new Date(raw)
  const diffMs = Date.now() - createdAt.getTime()
  const minutes = Math.max(1, Math.floor(diffMs / 60000))

  if (minutes < 60) {
    return `${minutes} хв тому`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} год тому`
  }

  const days = Math.floor(hours / 24)
  if (days < 30) {
    return `${days} дн тому`
  }

  const months = Math.floor(days / 30)
  return `${months} міс тому`
}

function formatOrderMeta(order: AdminOrder): string {
  const plan = order.plan ? order.plan.charAt(0).toUpperCase() + order.plan.slice(1) : 'План'
  return `${plan} · ${formatOrderAge(order.created_at)}`
}

function badgeClass(value: string) {
  if (value === 'Підключено' || value === 'Оплачено' || value === 'Активний' || value === 'Опубліковано' || value === 'paid' || value === 'completed') {
    return 'adminx-badge adminx-badge--ok'
  }
  if (value === 'Проблема' || value === 'Високий' || value === 'Ризик' || value === 'cancelled' || value === 'refunded') {
    return 'adminx-badge adminx-badge--danger'
  }
  if (value === 'Очікує' || value === 'Середній' || value === 'Чернетка' || value === 'Потребує ревʼю' || value === 'pending') {
    return 'adminx-badge adminx-badge--warn'
  }
  return 'adminx-badge adminx-badge--info'
}

function subscriptionStatusLabel(value: string | null): string {
  switch (value) {
    case 'active': return 'Active'
    case 'trial': return 'Trial'
    case 'past_due': return 'Past due'
    case 'cancelled': return 'Cancelled'
    case 'expired': return 'Expired'
    default: return value || 'Unknown'
  }
}

function subscriptionStatusClass(value: string | null): string {
  if (value === 'active') return 'subs-mobile__status subs-mobile__status--ok'
  if (value === 'trial' || value === 'past_due') return 'subs-mobile__status subs-mobile__status--warn'
  if (value === 'cancelled' || value === 'expired') return 'subs-mobile__status subs-mobile__status--danger'
  return 'subs-mobile__status'
}

function subscriptionStatusDotClass(value: string | null): string {
  if (value === 'active') return 'subs-mobile__dot subs-mobile__dot--ok'
  if (value === 'trial' || value === 'past_due') return 'subs-mobile__dot subs-mobile__dot--warn'
  if (value === 'cancelled' || value === 'expired') return 'subs-mobile__dot subs-mobile__dot--danger'
  return 'subs-mobile__dot'
}

function subscriptionRiskClass(value: string | null): string {
  if (value === 'trial' || value === 'past_due') return 'subs-mobile__risk'
  if (value === 'cancelled' || value === 'expired') return 'subs-mobile__risk subs-mobile__risk--danger'
  return ''
}

function billingPeriodLabel(value: string | null): string {
  if (value === 'yearly') return 'річний'
  return 'місячний'
}

function formatSubscriptionDate(raw: string): string {
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function MobileMenuDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useSettings()

  if (!open) return null

  const phoneHref = settings.phone ? `tel:${settings.phone.replace(/\s+/g, '')}` : ''
  const messengers = Object.entries(settings.messengers ?? {})
    .filter(([, url]) => url)
    .map(([id, url]) => ({
      id,
      name: MESSENGER_META[id]?.name ?? id,
      url,
      color: MESSENGER_META[id]?.color ?? '#888',
    }))

  return (
    <>
      <button className="mobile-menu__overlay" type="button" aria-label="Закрити меню" onClick={onClose} />
      <aside className="mobile-menu">
        <div className="mobile-menu__head">
          <strong>Widgetis Admin</strong>
          <button type="button" onClick={onClose} aria-label="Закрити">
            <X size={16} strokeWidth={2.25} />
          </button>
        </div>

        <nav className="mobile-menu__nav">
          {ADMIN_MENU_LINKS.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.to} to={item.to} onClick={onClose}>
                <Icon size={16} strokeWidth={2} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mobile-menu__divider" />

        <a
          className="mobile-menu__site-link"
          href="https://widgetis.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink size={14} strokeWidth={2} />
          widgetis.com
        </a>

        {messengers.length > 0 && (
          <div className="mobile-menu__contacts">
            <span className="mobile-menu__contacts-label">НАПИШІТЬ НАМ</span>
            <div className="mobile-menu__contacts-grid">
              {messengers.map((m) => (
                <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer" className="mobile-menu__messenger">
                  <SocialIcon id={m.id} size={18} />
                  <span>{m.name}</span>
                </a>
              ))}
            </div>
            {settings.phone && (
              <a href={phoneHref} className="mobile-menu__phone">
                <Phone size={14} strokeWidth={2} />
                {settings.phone}
              </a>
            )}
          </div>
        )}
      </aside>
    </>
  )
}


function getPageTokens(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 5) {
    return Array.from({ length: total }, (_, idx) => idx + 1)
  }
  if (current <= 3) {
    return [1, 2, 3, 'ellipsis', total]
  }
  if (current >= total - 2) {
    return [1, 'ellipsis', total - 2, total - 1, total]
  }
  return [1, 'ellipsis', current, current + 1, 'ellipsis', total]
}

export function AdminOrdersPage() {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderFilterLabel>('Всі')
  const [planFilter, setPlanFilter] = useState<string | undefined>(undefined)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null])
  const [startDate, endDate] = dateRange
  const [amountMin, setAmountMin] = useState(0)
  const [amountMax, setAmountMax] = useState(50000)
  const AMOUNT_LIMIT = 50000
  const [page, setPage] = useState(1)
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const statusValue = useMemo(
    () => ORDER_FILTERS.find((item) => item.label === statusFilter)?.value,
    [statusFilter],
  )

  const dateFromStr = startDate ? startDate.toISOString().slice(0, 10) : undefined
  const dateToStr = endDate ? endDate.toISOString().slice(0, 10) : undefined

  const amountChanged = amountMin > 0 || amountMax < AMOUNT_LIMIT

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (planFilter) count++
    if (startDate || endDate) count++
    if (amountChanged) count++
    if (sortBy !== 'created_at' || sortDir !== 'desc') count++
    return count
  }, [planFilter, startDate, endDate, amountChanged, sortBy, sortDir])

  useEffect(() => {
    setLoading(true)
    setError(null)

    get<PaginatedResponse<AdminOrder>>('/admin/orders', {
      page,
      per_page: 5,
      status: statusValue,
      q: query.trim() || undefined,
      plan: planFilter,
      date_from: dateFromStr,
      date_to: dateToStr,
      amount_min: amountMin > 0 ? amountMin : undefined,
      amount_max: amountMax < AMOUNT_LIMIT ? amountMax : undefined,
      sort_by: sortBy,
      sort_dir: sortDir,
    })
      .then((res) => {
        setOrders(res.data)
        setTotalPages(Math.max(1, res.meta?.last_page ?? 1))
        setTotalOrders(res.meta?.total ?? 0)
      })
      .catch((e) => {
        setOrders([])
        setError(e instanceof Error ? e.message : 'Не вдалося завантажити замовлення')
        setTotalPages(1)
        setTotalOrders(0)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [page, query, statusValue, planFilter, dateFromStr, dateToStr, amountMin, amountMax, sortBy, sortDir])

  useEffect(() => {
    setPage(1)
  }, [query, statusFilter, planFilter, dateFromStr, dateToStr, amountMin, amountMax, sortBy, sortDir])

  const resetFilters = useCallback(() => {
    setPlanFilter(undefined)
    setSortBy('created_at')
    setSortDir('desc')
    setDateRange([null, null])
    setAmountMin(0)
    setAmountMax(AMOUNT_LIMIT)
  }, [])

  const pagination = getPageTokens(page, totalPages)

  return (
    <AdminScreenLayout mode="dashboard" title="Замовлення" subtitle={`${totalOrders} всього`}>
      <section className="orders-mobile__search-wrap">
        <div className="orders-mobile__search">
          <Search size={16} strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
            }}
            placeholder="Пошук за ID, email або сумою..."
          />
        </div>
        <button
          type="button"
          className={`orders-mobile__filter ${activeFilterCount > 0 ? 'orders-mobile__filter--active' : ''}`}
          aria-label="Фільтри"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <SlidersHorizontal size={16} strokeWidth={2} />
          {activeFilterCount > 0 && <span className="orders-mobile__filter-badge">{activeFilterCount}</span>}
        </button>

        {filtersOpen && (
          <>
          <div className="orders-mobile__filter-backdrop" onClick={() => setFiltersOpen(false)} />
          <div className="orders-mobile__filter-panel">
          <div className="orders-mobile__filter-header">
            <h3>Фільтри та сортування</h3>
            <div className="orders-mobile__filter-actions">
              {activeFilterCount > 0 && (
                <button type="button" className="orders-mobile__filter-reset" onClick={resetFilters}>
                  <RotateCcw size={14} strokeWidth={2} />
                  Скинути
                </button>
              )}
              <button type="button" className="orders-mobile__filter-close" onClick={() => setFiltersOpen(false)}>
                <X size={16} strokeWidth={2} />
              </button>
            </div>
          </div>

          <div className="orders-mobile__filter-group">
            <label className="orders-mobile__filter-label">
              <ArrowUpDown size={14} strokeWidth={2} />
              Сортування
            </label>
            <div className="orders-mobile__sort-options">
              {SORT_FIELDS.map((field) => {
                const isActive = sortBy === field.value
                const DirIcon = isActive && sortDir === 'asc' ? ArrowUp : ArrowDown
                return (
                  <button
                    key={field.value}
                    type="button"
                    className={`orders-mobile__sort-btn ${isActive ? 'orders-mobile__sort-btn--active' : ''}`}
                    onClick={() => {
                      if (isActive) {
                        setSortDir(sortDir === 'desc' ? 'asc' : 'desc')
                      } else {
                        setSortBy(field.value)
                        setSortDir('desc')
                      }
                    }}
                  >
                    {field.label}
                    <DirIcon size={12} strokeWidth={2.5} />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="orders-mobile__filter-group">
            <label className="orders-mobile__filter-label">
              <Calendar size={14} strokeWidth={2} />
              Період
            </label>
            <div className="orders-mobile__datepicker-wrap">
              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setDateRange(update as [Date | null, Date | null])}
                locale={uk}
                dateFormat="dd.MM.yyyy"
                placeholderText="Оберіть період"
                isClearable
                className="orders-mobile__datepicker-input"
                calendarClassName="orders-mobile__calendar"
              />
            </div>
          </div>

          <div className="orders-mobile__filter-group">
            <label className="orders-mobile__filter-label">
              <Banknote size={14} strokeWidth={2} />
              Сума
            </label>
            <div className="orders-mobile__amount-slider">
              <div className="orders-mobile__amount-track">
                <div
                  className="orders-mobile__amount-fill"
                  style={{
                    left: `${(amountMin / AMOUNT_LIMIT) * 100}%`,
                    right: `${100 - (amountMax / AMOUNT_LIMIT) * 100}%`,
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={AMOUNT_LIMIT}
                  step={100}
                  value={amountMin}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (v <= amountMax - 100) setAmountMin(v)
                  }}
                  className="orders-mobile__range orders-mobile__range--min"
                />
                <input
                  type="range"
                  min={0}
                  max={AMOUNT_LIMIT}
                  step={100}
                  value={amountMax}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (v >= amountMin + 100) setAmountMax(v)
                  }}
                  className="orders-mobile__range orders-mobile__range--max"
                />
              </div>
              <div className="orders-mobile__amount-labels">
                <span>{amountMin.toLocaleString('uk-UA')} ₴</span>
                <span>{amountMax >= AMOUNT_LIMIT ? '50 000+ ₴' : `${amountMax.toLocaleString('uk-UA')} ₴`}</span>
              </div>
            </div>
          </div>

          <div className="orders-mobile__filter-group">
            <label className="orders-mobile__filter-label">План</label>
            <div className="orders-mobile__plan-options">
              {PLAN_FILTERS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  className={`orders-mobile__plan-btn ${planFilter === opt.value ? 'orders-mobile__plan-btn--active' : ''} ${opt.value ? `orders-mobile__plan-btn--${opt.value}` : ''}`}
                  onClick={() => setPlanFilter(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        </>
        )}
      </section>

      <section className="orders-mobile__segments">
        {ORDER_FILTERS.map((item) => (
          <button
            key={item.label}
            type="button"
            className={statusFilter === item.label ? 'orders-mobile__seg orders-mobile__seg--active' : 'orders-mobile__seg'}
            onClick={() => {
              setStatusFilter(item.label)
            }}
          >
            {item.label}
          </button>
        ))}
      </section>

      <section className="orders-mobile__list">
        {orders.map((order) => (
          <article key={order.id} className="orders-mobile__row">
            <div className="orders-mobile__row-left">
              <strong>{order.order_number || `#${order.id}`}</strong>
              <span>{order.customer_email || '—'}</span>
              <small>{formatOrderMeta(order)}</small>
            </div>
            <div className="orders-mobile__row-right">
              <span className={badgeClass(order.status || '')}>{orderStatusLabel(order.status)}</span>
              <b>{formatMoney(order.amount, order.currency)}</b>
            </div>
          </article>
        ))}
        {loading ? <p className="orders-mobile__empty">Завантаження…</p> : null}
        {!loading && error ? <p className="orders-mobile__empty">Помилка: {error}</p> : null}
        {!loading && !error && orders.length === 0 ? <p className="orders-mobile__empty">Нічого не знайдено.</p> : null}
      </section>

      <section className="orders-mobile__pagination">
        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
        {pagination.map((token, idx) => token === 'ellipsis' ? (
          <button key={`ellipsis-${idx}`} type="button" disabled className="orders-mobile__page-ellipsis">
            ...
          </button>
        ) : (
          <button
            key={token}
            type="button"
            className={page === token ? 'orders-mobile__page-active' : ''}
            onClick={() => setPage(token)}
          >
            {token}
          </button>
        ))}
        <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button>
      </section>

    </AdminScreenLayout>
  )
}

export function AdminSubscriptionsPage() {
  const [statusFilter, setStatusFilter] = useState<SubscriptionFilterLabel>('Усі')
  const [page, setPage] = useState(1)
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalSubscriptions, setTotalSubscriptions] = useState(0)
  const [stats, setStats] = useState<AdminSubscriptionStats>({ active: 0, trial: 0, cancelled: 0, risk: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const statusValue = useMemo(
    () => SUBSCRIPTION_FILTERS.find((item) => item.label === statusFilter)?.value,
    [statusFilter],
  )

  useEffect(() => {
    setLoading(true)
    setError(null)

    get<PaginatedResponse<AdminSubscription> & { stats?: AdminSubscriptionStats }>('/admin/subscriptions', {
      page,
      per_page: 4,
      status: statusValue,
    })
      .then((res) => {
        setSubscriptions(res.data)
        setTotalPages(Math.max(1, res.meta?.last_page ?? 1))
        setTotalSubscriptions(res.meta?.total ?? 0)
        setStats(res.stats ?? { active: 0, trial: 0, cancelled: 0, risk: 0 })
      })
      .catch((e) => {
        setSubscriptions([])
        setError(e instanceof Error ? e.message : 'Не вдалося завантажити підписки')
        setTotalPages(1)
        setTotalSubscriptions(0)
        setStats({ active: 0, trial: 0, cancelled: 0, risk: 0 })
      })
      .finally(() => setLoading(false))
  }, [page, statusValue])

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  const pagination = getPageTokens(page, totalPages)
  const trialRiskCount = subscriptions.filter((s) => s.status === 'trial' || s.status === 'past_due').length

  return (
    <AdminScreenLayout mode="dashboard" title="Підписки">
      <section className="subs-mobile__stats">
        <article className="subs-mobile__stat">
          <strong>{stats.active}</strong>
          <span>Активних</span>
        </article>
        <article className="subs-mobile__stat subs-mobile__stat--blue">
          <strong>{stats.trial}</strong>
          <span>Trial</span>
        </article>
        <article className="subs-mobile__stat subs-mobile__stat--orange">
          <strong>{stats.cancelled}</strong>
          <span>Скасовані</span>
        </article>
      </section>

      <section className="subs-mobile__segments">
        {SUBSCRIPTION_FILTERS.map((item) => (
          <button
            key={item.label}
            type="button"
            className={statusFilter === item.label ? 'subs-mobile__seg subs-mobile__seg--active' : 'subs-mobile__seg'}
            onClick={() => {
              setStatusFilter(item.label)
            }}
          >
            {item.label}
          </button>
        ))}
      </section>

      {stats.risk > 0 && (
        <section className="subs-mobile__risk-banner">
          <div className="subs-mobile__risk-left">
            <span className="subs-mobile__dot subs-mobile__dot--warn" />
            <span>{stats.risk} підписок у зоні ризику відтоку</span>
          </div>
          <span className="subs-mobile__risk-link">Пріоритезувати</span>
        </section>
      )}

      <section className="subs-mobile__list">
        {subscriptions.map((subscription) => {
          const plan = planLabel(subscription.plan)
          const stateLabel = subscriptionStatusLabel(subscription.status)
          const riskClass = subscriptionRiskClass(subscription.status)
          const planClass = `subs-mobile__plan subs-mobile__plan--${(subscription.plan || 'free').toLowerCase()}`

          return (
            <article key={subscription.id} className={`subs-mobile__row ${riskClass}`}>
              <div className="subs-mobile__row-top">
                <strong>{(subscription.user_email || 'Клієнт').split('@')[0]}</strong>
                <div className="subs-mobile__row-top-badges">
                  {subscription.status !== 'active' && (subscription.status === 'trial' || subscription.status === 'past_due') ? (
                    <span className="subs-mobile__risk-badge">ризик</span>
                  ) : null}
                  <span className={planClass}>{plan}</span>
                </div>
              </div>

              <div className="subs-mobile__row-mid">
                <span>{subscription.user_email || '—'}</span>
                <span>·</span>
                <span>{plan} · {billingPeriodLabel(subscription.billing_period)}</span>
              </div>

              <div className="subs-mobile__row-bottom">
                <span className={subscriptionStatusDotClass(subscription.status)} />
                <span className={subscriptionStatusClass(subscription.status)}>
                  {stateLabel} · з {formatSubscriptionDate(subscription.created_at)}
                </span>
              </div>
            </article>
          )
        })}

        {loading ? <p className="orders-mobile__empty">Завантаження…</p> : null}
        {!loading && error ? <p className="orders-mobile__empty">Помилка: {error}</p> : null}
        {!loading && !error && subscriptions.length === 0 ? <p className="orders-mobile__empty">Нічого не знайдено.</p> : null}
      </section>

      {!loading && !error && subscriptions.length > 0 ? (
        <section className="subs-mobile__meta-line">
          <span>Всього: {totalSubscriptions}</span>
          {trialRiskCount > 0 ? <span>Trial/Past due: {trialRiskCount}</span> : null}
        </section>
      ) : null}

      <section className="orders-mobile__pagination">
        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
        {pagination.map((token, idx) => token === 'ellipsis' ? (
          <button key={`ellipsis-${idx}`} type="button" disabled className="orders-mobile__page-ellipsis">
            ...
          </button>
        ) : (
          <button
            key={token}
            type="button"
            className={page === token ? 'orders-mobile__page-active' : ''}
            onClick={() => setPage(token)}
          >
            {token}
          </button>
        ))}
        <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button>
      </section>

    </AdminScreenLayout>
  )
}

type UserSegmentLabel = 'Активні' | 'Ризик' | 'Нові'
type UserSegmentApiValue = 'active' | 'risk' | 'new'

type AdminUser = {
  id: number
  name: string | null
  email: string
  plan: string | null
  subscription_status: string | null
  sites_count: number
  primary_domain: string | null
  created_at: string
}

type AdminUserStats = {
  total: number
  this_month: number
  pro_count: number
}

const USER_SEGMENTS: Array<{ label: UserSegmentLabel; value: UserSegmentApiValue; tone: 'green' | 'yellow' | 'blue' }> = [
  { label: 'Активні', value: 'active', tone: 'green' },
  { label: 'Ризик', value: 'risk', tone: 'yellow' },
  { label: 'Нові', value: 'new', tone: 'blue' },
]

function userPlanLabel(value: string | null): string {
  if (!value) return 'Free'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function userTimeLabel(raw: string): string {
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return '—'

  const diffMs = Date.now() - date.getTime()
  if (diffMs < 60000) return 'щойно'

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) return `${minutes} хв`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} год`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} дн`

  const months = Math.floor(days / 30)
  return `${months} міс`
}

function userInitials(name: string | null, email: string): string {
  const source = name?.trim() || email.split('@')[0] || 'U'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

export function AdminUsersPage() {
  const [query, setQuery] = useState('')
  const [segment, setSegment] = useState<UserSegmentLabel>('Активні')
  const [page, setPage] = useState(1)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminUserStats>({ total: 0, this_month: 0, pro_count: 0 })
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const segmentValue = useMemo(
    () => USER_SEGMENTS.find((item) => item.label === segment)?.value,
    [segment],
  )

  useEffect(() => {
    setLoading(true)
    setError(null)

    get<PaginatedResponse<AdminUser> & { stats?: AdminUserStats }>('/admin/users', {
      page,
      per_page: 6,
      search: query.trim() || undefined,
      segment: segmentValue,
    })
      .then((res) => {
        setUsers(res.data)
        setStats(res.stats ?? { total: 0, this_month: 0, pro_count: 0 })
        setTotalPages(Math.max(1, res.meta?.last_page ?? 1))
      })
      .catch((e) => {
        setUsers([])
        setStats({ total: 0, this_month: 0, pro_count: 0 })
        setTotalPages(1)
        setError(e instanceof Error ? e.message : 'Не вдалося завантажити користувачів')
      })
      .finally(() => setLoading(false))
  }, [page, query, segmentValue])

  const pagination = getPageTokens(page, totalPages)

  return (
    <AdminScreenLayout mode="dashboard" title="Юзери">
      <section className="users-mobile__stats">
        <article className="users-mobile__stat">
          <strong>{stats.total}</strong>
          <span>Всього</span>
        </article>
        <article className="users-mobile__stat users-mobile__stat--green">
          <strong>{stats.this_month}</strong>
          <span>Цього місяця</span>
        </article>
        <article className="users-mobile__stat users-mobile__stat--blue">
          <strong>{stats.pro_count}</strong>
          <span>Pro</span>
        </article>
      </section>

      <section className="users-mobile__search-wrap">
        <div className="users-mobile__search">
          <Search size={16} strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => {
              setPage(1)
              setQuery(e.target.value)
            }}
            placeholder="Пошук користувача..."
          />
        </div>
        <button type="button" className="users-mobile__filter" aria-label="Фільтри">
          <SlidersHorizontal size={16} strokeWidth={2} />
        </button>
      </section>

      <section className="users-mobile__segments">
        {USER_SEGMENTS.map((item) => (
          <button
            key={item.label}
            type="button"
            className={segment === item.label
              ? `users-mobile__seg users-mobile__seg--${item.tone} users-mobile__seg--active`
              : `users-mobile__seg users-mobile__seg--${item.tone}`}
            onClick={() => {
              setPage(1)
              setSegment(item.label)
            }}
          >
            {item.label}
          </button>
        ))}
      </section>

      <section className="users-mobile__list">
        {users.map((user) => {
          const avatarTone = user.plan === 'pro' ? 'pro' : user.plan === 'basic' ? 'basic' : user.subscription_status === 'past_due' ? 'risk' : 'neutral'
          const displayName = user.name?.trim() || user.email.split('@')[0]
          const secondaryLine = user.primary_domain
            ? `${user.primary_domain}${user.sites_count > 0 ? ` · ${user.sites_count} сайт` : ''}`
            : (user.sites_count > 0 ? `${user.sites_count} сайт` : 'Без сайтів')

          return (
            <article key={user.id} className="users-mobile__row">
              <div className={`users-mobile__avatar users-mobile__avatar--${avatarTone}`}>{userInitials(user.name, user.email)}</div>
              <div className="users-mobile__body">
                <strong>{displayName}</strong>
                <span>{secondaryLine}</span>
              </div>
              <div className="users-mobile__meta">
                <span className={badgeClass(userPlanLabel(user.plan))}>{userPlanLabel(user.plan)}</span>
                <small>{userTimeLabel(user.created_at)}</small>
              </div>
            </article>
          )
        })}

        {loading ? <p className="orders-mobile__empty">Завантаження…</p> : null}
        {!loading && error ? <p className="orders-mobile__empty">Помилка: {error}</p> : null}
        {!loading && !error && users.length === 0 ? <p className="orders-mobile__empty">Нічого не знайдено.</p> : null}
      </section>

      <section className="orders-mobile__pagination">
        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
        {pagination.map((token, idx) => token === 'ellipsis' ? (
          <button key={`ellipsis-${idx}`} type="button" disabled className="orders-mobile__page-ellipsis">
            ...
          </button>
        ) : (
          <button
            key={token}
            type="button"
            className={page === token ? 'orders-mobile__page-active' : ''}
            onClick={() => setPage(token)}
          >
            {token}
          </button>
        ))}
        <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button>
      </section>

    </AdminScreenLayout>
  )
}

type AdminSite = {
  id: number
  name: string | null
  domain: string
  url: string | null
  platform: string | null
  status: string | null
  script_installed: boolean
  widgets_count: number
  connected_at: string | null
  created_at: string
  deployed_script_url: string | null
  user: { id: number; email: string; name: string | null } | null
  plan: string | null
}

type AdminSiteStats = { total: number; active: number; pending: number }

const SITE_STATUS_FILTERS = [
  { label: 'Всі', value: undefined },
  { label: 'Активний', value: 'active' },
  { label: 'Очікує', value: 'pending' },
] as const

type SiteFilterLabel = (typeof SITE_STATUS_FILTERS)[number]['label']

function siteStatusLabel(value: string | null): string {
  switch (value) {
    case 'active': return 'Активний'
    case 'pending': return 'Очікує'
    case 'deactivated': return 'Деактивовано'
    default: return value || 'Невідомо'
  }
}

function planLabel(slug: string | null): string {
  if (!slug) return 'Free'
  return slug.charAt(0).toUpperCase() + slug.slice(1)
}

export function AdminSitesPage() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<SiteFilterLabel>('Всі')
  const [page, setPage] = useState(1)
  const [sites, setSites] = useState<AdminSite[]>([])
  const [stats, setStats] = useState<AdminSiteStats>({ total: 0, active: 0, pending: 0 })
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const statusValue = useMemo(
    () => SITE_STATUS_FILTERS.find((f) => f.label === statusFilter)?.value,
    [statusFilter],
  )

  useEffect(() => {
    setLoading(true)
    setError(null)

    get<{ stats: AdminSiteStats; data: AdminSite[]; meta: { last_page: number; total: number } }>('/admin/sites', {
      page,
      per_page: 10,
      status: statusValue,
      search: query.trim() || undefined,
    })
      .then((res) => {
        setSites(res.data)
        setStats(res.stats ?? { total: res.meta?.total ?? 0, active: 0, pending: 0 })
        setTotalPages(Math.max(1, res.meta?.last_page ?? 1))
      })
      .catch((e) => {
        setSites([])
        setError(e instanceof Error ? e.message : 'Не вдалося завантажити сайти')
        setTotalPages(1)
      })
      .finally(() => setLoading(false))
  }, [page, query, statusValue])

  useEffect(() => {
    setPage(1)
  }, [query, statusFilter])

  const pagination = getPageTokens(page, totalPages)

  return (
    <AdminScreenLayout mode="dashboard" title="Сайти" subtitle={`${stats.total} всього · ${stats.active} активних`}>
      <section className="sites-mobile__stats">
        <article className="users-mobile__stat">
          <strong>{stats.total}</strong>
          <span>Всього</span>
        </article>
        <article className="users-mobile__stat users-mobile__stat--green">
          <strong>{stats.active}</strong>
          <span>Активних</span>
        </article>
        <article className="users-mobile__stat">
          <strong style={{ color: '#f59e0b' }}>{stats.pending}</strong>
          <span>Очікують</span>
        </article>
      </section>

      <section className="orders-mobile__search-wrap">
        <div className="orders-mobile__search">
          <Search size={16} strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => {
              setPage(1)
              setQuery(e.target.value)
            }}
            placeholder="Пошук за сайтом або клієнтом..."
          />
        </div>
      </section>

      <section className="orders-mobile__segments">
        {SITE_STATUS_FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            className={statusFilter === f.label ? 'orders-mobile__seg orders-mobile__seg--active' : 'orders-mobile__seg'}
            onClick={() => {
              setPage(1)
              setStatusFilter(f.label)
            }}
          >
            {f.label}
          </button>
        ))}
      </section>

      <section className="sites-mobile__head-row">
        <span>Статус</span>
        <span>Інтеграції</span>
        <span>Дії</span>
      </section>

      <section className="sites-mobile__list">
        {sites.map((site, idx) => (
          <Link key={site.id} to={`/admin/sites/${site.domain}`} className="sites-mobile__row" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <div className={`sites-mobile__logo sites-mobile__logo--${(idx % 3) + 1}`}>
              <Globe size={16} strokeWidth={2} />
            </div>
            <div className="sites-mobile__body">
              <strong>{site.domain}</strong>
              <span>{site.user?.email || '—'}</span>
            </div>
            <div className="sites-mobile__meta">
              <span className={badgeClass(planLabel(site.plan))}>{planLabel(site.plan)}</span>
              <span className={site.status === 'active' ? 'adminx-badge adminx-badge--ok' : 'adminx-badge adminx-badge--warn'}>
                {siteStatusLabel(site.status)}
              </span>
            </div>
          </Link>
        ))}
        {loading ? <p className="orders-mobile__empty">Завантаження…</p> : null}
        {!loading && error ? <p className="orders-mobile__empty">Помилка: {error}</p> : null}
        {!loading && !error && sites.length === 0 ? <p className="orders-mobile__empty">Нічого не знайдено.</p> : null}
      </section>

      <section className="orders-mobile__pagination">
        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
        {pagination.map((token, idx) => token === 'ellipsis' ? (
          <button key={`ellipsis-${idx}`} type="button" disabled className="orders-mobile__page-ellipsis">
            ...
          </button>
        ) : (
          <button
            key={token}
            type="button"
            className={page === token ? 'orders-mobile__page-active' : ''}
            onClick={() => setPage(token)}
          >
            {token}
          </button>
        ))}
        <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button>
      </section>

    </AdminScreenLayout>
  )
}

function useSiteByDomain(domain: string | undefined) {
  const [site, setSite] = useState<AdminSite | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!domain) return
    setLoading(true)
    get<{ data: AdminSite[]; meta: { total: number } }>('/admin/sites', { search: domain, per_page: 1 })
      .then((res) => setSite(res.data[0] ?? null))
      .catch(() => setSite(null))
      .finally(() => setLoading(false))
  }, [domain])

  return { site, loading }
}

export function AdminSiteDetailPage() {
  const { domain } = useParams<{ domain: string }>()
  const { site, loading } = useSiteByDomain(domain)
  const siteActions = getSiteActions(domain ?? '')

  return (
    <AdminScreenLayout
      mode="subpage"
      title={loading ? 'Завантаження...' : (site?.domain ?? domain ?? 'Сайт')}
    >
      {loading && <p className="orders-mobile__empty">Завантаження...</p>}

      {!loading && site && (
        <>
          <div className="mobile-plain__content" style={{ paddingTop: 0 }}>
            <Link
              to={`/admin/sites/${site.domain}/configure`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '14px 20px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#fff',
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 15,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              }}
            >
              <Wand2 size={17} strokeWidth={2} />
              Конфігуратор
            </Link>
          </div>

          <div className="adminx-grid2 mobile-plain__content">
            <section className="admin-card adminx-section">
              <h2 className="admin-card__title">Статус сайту</h2>
              <div className="adminx-status-grid">
                <div>
                  <span className="adminx-muted">Підключення</span>
                  <p>
                    <span className={site.status === 'active' ? 'adminx-badge adminx-badge--ok' : 'adminx-badge adminx-badge--warn'}>
                      {siteStatusLabel(site.status)}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="adminx-muted">Скрипт</span>
                  <p>{site.script_installed ? 'Встановлено' : 'Не встановлено'}</p>
                </div>
                <div>
                  <span className="adminx-muted">Віджетів</span>
                  <p>{site.widgets_count}</p>
                </div>
                <div>
                  <span className="adminx-muted">Домен</span>
                  <p>{site.domain}</p>
                </div>
              </div>
            </section>

            <section className="admin-card adminx-section">
              <h2 className="admin-card__title">Контакти</h2>
              <div className="adminx-icon-lines">
                <div><Mail size={14} strokeWidth={2} /> {site.user?.email ?? `support@${site.domain}`}</div>
                <div><Globe size={14} strokeWidth={2} /> {site.url ?? `https://${site.domain}`}</div>
                {site.platform && <div><Settings size={14} strokeWidth={2} /> {site.platform}</div>}
              </div>
            </section>
          </div>

          <section className="admin-card adminx-section mobile-plain__content">
            <h2 className="admin-card__title">Швидкі дії</h2>
            <div className="adminx-action-grid">
              {siteActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link key={action.title} to={action.to} className="adminx-action">
                    <span className="adminx-action-icon"><Icon size={15} strokeWidth={2.25} /></span>
                    <span>{action.title}</span>
                    <ArrowRight size={13} strokeWidth={2.5} />
                  </Link>
                )
              })}
            </div>
          </section>
        </>
      )}

      {!loading && !site && (
        <p className="orders-mobile__empty">Сайт не знайдено.</p>
      )}
    </AdminScreenLayout>
  )
}

export function AdminSiteConfiguratorPage() {
  const { domain } = useParams<{ domain: string }>()
  const { site, loading } = useSiteByDomain(domain)

  if (loading) {
    return (
      <div className="cfg-m">
        <div className="cfg-m__loader">Завантаження сайту...</div>
      </div>
    )
  }

  if (!site) {
    return (
      <div className="cfg-m">
        <div className="cfg-m__loader" style={{ color: '#f87171' }}>Сайт не знайдено</div>
      </div>
    )
  }

  return <AdminConfiguratorPage siteContext={{ id: site.id, domain: site.domain, deployedScriptUrl: site.deployed_script_url }} />
}

export function AdminSettingsPage() {
  return (
    <AdminScreenLayout mode="dashboard" title="Налаштування" subtitle="Профіль та безпека">
      <div className="adminx-settings-grid mobile-plain__content">
        <section className="admin-card adminx-section">
          <h2 className="admin-card__title">Профіль</h2>
          <div className="adminx-form-list">
            <div><span>Імʼя</span><strong>Ілля Л.</strong></div>
            <div><span>Email</span><strong>{BRAND_EMAIL}</strong></div>
            <div><span>Компанія</span><strong>{BRAND_NAME}</strong></div>
          </div>
          <button type="button" className="adminx-ghost-btn">Редагувати</button>
        </section>

        <section className="admin-card adminx-section">
          <h2 className="admin-card__title">Безпека</h2>
          <div className="adminx-icon-lines">
            <div><ShieldCheck size={14} strokeWidth={2} /> Двофакторна автентифікація: увімкнено</div>
            <div><CircleAlert size={14} strokeWidth={2} /> Останній вхід: сьогодні о 12:20</div>
          </div>
          <button type="button" className="adminx-ghost-btn">Змінити пароль</button>
        </section>

        <section className="admin-card adminx-section">
          <h2 className="admin-card__title">Білінг</h2>
          <div className="adminx-icon-lines">
            <div><Star size={14} strokeWidth={2} /> Тариф: Pro (2 499 грн / міс)</div>
            <div><ExternalLink size={14} strokeWidth={2} /> Наступне списання: 16 квітня</div>
          </div>
          <button type="button" className="adminx-primary-btn adminx-primary-btn--small">Керувати підпискою</button>
        </section>
      </div>

    </AdminScreenLayout>
  )
}

export function AdminManagerRequestsPage() {
  return (
    <AdminScreenLayout mode="dashboard" title="Manager Requests" subtitle="Черга заявок">
      <section className="adminx-list mobile-plain__content">
        {REQUESTS.map((request) => (
          <article key={request.id} className="admin-card adminx-request-row">
            <div className="adminx-user-main">
              <strong>{request.id}</strong>
              <span>{request.name}</span>
            </div>
            <div className="adminx-user-meta">
              <span className="adminx-badge adminx-badge--info">{request.type}</span>
              <span className={badgeClass(request.risk)}>{request.risk}</span>
            </div>
            <p>{request.note}</p>
            <div className="adminx-row-actions">
              <button type="button" className="adminx-ghost-btn">Взяти в роботу</button>
              <button type="button" className="adminx-ghost-btn">Деталі</button>
            </div>
          </article>
        ))}
      </section>

    </AdminScreenLayout>
  )
}

export function AdminLandingContentPage() {
  return (
    <AdminScreenLayout mode="dashboard" title="Landing Content" subtitle="Керування блоками">
      <section className="adminx-list mobile-plain__content">
        {CONTENT_BLOCKS.map((block) => (
          <article key={block.id} className="admin-card adminx-content-row">
            <div className="adminx-user-main">
              <strong>{block.title}</strong>
              <span>ID: {block.id}</span>
            </div>
            <div className="adminx-user-meta">
              <span className={badgeClass(block.status)}>{block.status}</span>
              <span className="adminx-muted">{block.updated}</span>
            </div>
            <div className="adminx-row-actions">
              <button type="button" className="adminx-ghost-btn">Редагувати</button>
              <button type="button" className="adminx-ghost-btn">Превʼю</button>
            </div>
          </article>
        ))}
      </section>
    </AdminScreenLayout>
  )
}
