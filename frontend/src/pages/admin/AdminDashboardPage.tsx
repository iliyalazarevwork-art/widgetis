import { useEffect, useMemo, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  TrendingUp,
  Package,
  Globe,
  Receipt,
  ArrowUpRight,
  Wand2,
  ArrowRight,
  X,
  LayoutDashboard,
  Repeat2,
  Users,
} from 'lucide-react'
import { get } from '../../api/client'
import { HamburgerIcon } from '../../components/HamburgerIcon'
import type { AdminDashboardData } from '../../types'
import './dashboard.css'

type StatCard = {
  label: string
  value: string
  delta: string
  period: string
  icon: typeof Receipt
  color: 'blue' | 'green' | 'purple' | 'orange'
}

type UiOrder = {
  id: string
  email: string
  amount: number
  currency: string
  date: string
  fresh: boolean
}

const BOTTOM_NAV = [
  { to: '/admin', label: 'Дашборд', icon: LayoutDashboard, end: true },
  { to: '/admin/subscriptions', label: 'Підписки', icon: Repeat2 },
  { to: '/admin/orders', label: 'Замовлення', icon: Receipt },
  { to: '/admin/users', label: 'Юзери', icon: Users },
  { to: '/admin/sites', label: 'Сайти', icon: Globe },
]

const MENU_LINKS = [
  { to: '/admin', label: 'Дашборд', end: true },
  { to: '/admin/subscriptions', label: 'Підписки' },
  { to: '/admin/orders', label: 'Замовлення' },
  { to: '/admin/users', label: 'Користувачі' },
  { to: '/admin/sites', label: 'Сайти' },
  { to: '/admin/settings', label: 'Налаштування' },
]

export function AdminDashboardPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    get<{ data: AdminDashboardData }>('/admin/dashboard')
      .then((res) => {
        setData(res.data)
        setError(null)
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Не вдалося завантажити дані')
      })
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo<StatCard[]>(() => {
    if (!data) return []

    return [
      {
        label: 'Замовлень',
        value: formatInt(data.kpi.orders_count),
        delta: formatPercentDelta(data.kpi.orders_growth_pct),
        period: 'за місяць',
        icon: Receipt,
        color: 'blue',
      },
      {
        label: 'Активні сайти',
        value: formatInt(data.kpi.active_sites),
        delta: formatAbsoluteDelta(data.kpi.active_sites_new_week),
        period: 'нові за тиждень',
        icon: Globe,
        color: 'green',
      },
      {
        label: 'Встановлено',
        value: formatInt(data.kpi.installed_widgets_count),
        delta: formatAbsoluteDelta(data.kpi.installed_widgets_new_week),
        period: 'за тиждень',
        icon: Package,
        color: 'purple',
      },
      {
        label: 'Виручка',
        value: formatMoney(data.kpi.revenue),
        delta: formatPercentDelta(data.kpi.revenue_growth_pct),
        period: 'за місяць',
        icon: TrendingUp,
        color: 'orange',
      },
    ]
  }, [data])

  const recentOrders = useMemo<UiOrder[]>(() => {
    if (!data) return []

    return data.recent_orders.map((order) => ({
      id: order.order_number ?? `#${order.id}`,
      email: order.customer_email || '—',
      amount: order.amount,
      currency: order.currency || 'UAH',
      date: formatTimeAgo(order.created_at),
      fresh: isFresh(order.created_at),
    }))
  }, [data])

  return (
    <div className="dash-m">
      {menuOpen && (
        <>
          <button
            className="mobile-menu__overlay"
            onClick={() => setMenuOpen(false)}
            aria-label="Закрити меню"
            type="button"
          />
          <div className="mobile-menu">
            <div className="mobile-menu__head">
              <strong>Widgetis Admin</strong>
              <button type="button" onClick={() => setMenuOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <nav className="mobile-menu__nav">
              {MENU_LINKS.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setMenuOpen(false)}>
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </>
      )}

      <header className="dash-m__topbar">
        <button
          className="dash-m__burger"
          type="button"
          aria-label="Меню"
          onClick={() => setMenuOpen(true)}
        >
          <HamburgerIcon size={18} />
        </button>
        <div className="dash-m__topbar-center">
          <strong>Дашборд</strong>
          <span>Widgetis Admin</span>
        </div>
        <div className="dash-m__avatar">ІЛ</div>
      </header>

      <main className="dash-m__body">
        {loading ? (
          <div className="dash-m__state">Завантаження…</div>
        ) : error || !data ? (
          <div className="dash-m__state dash-m__state--error">{error || 'Не вдалося завантажити дані'}</div>
        ) : (
          <>
            <div className="dash-m__stats">
              {stats.map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.label} className={`dash-m__stat dash-m__stat--${s.color}`}>
                    <div className="dash-m__stat-head">
                      <span className="dash-m__stat-icon">
                        <Icon size={16} strokeWidth={2} />
                      </span>
                      <span className="dash-m__stat-delta">
                        <ArrowUpRight size={10} strokeWidth={2.5} />
                        {s.delta}
                      </span>
                    </div>
                    <strong className="dash-m__stat-value">{s.value}</strong>
                    <span className="dash-m__stat-label">{s.label}</span>
                    <span className="dash-m__stat-period">{s.period}</span>
                  </div>
                )
              })}
            </div>

            <div className="dash-m__cards">
              <div className="dash-m__card">
                <div className="dash-m__card-head">
                  <span className="dash-m__card-title">Останні замовлення</span>
                  <Link to="/admin/orders" className="dash-m__card-link">
                    Усі <ArrowRight size={12} strokeWidth={2.5} />
                  </Link>
                </div>
                <div className="dash-m__divider" />
                {recentOrders.length === 0 ? (
                  <div className="dash-m__empty">Замовлень поки немає</div>
                ) : (
                  recentOrders.map((o, i) => (
                    <div key={`${o.id}-${i}`}>
                      <div className="dash-m__order-row">
                        <code className="dash-m__order-id">{o.id}</code>
                        <span className="dash-m__order-email">{o.email}</span>
                        <strong className="dash-m__order-amount">
                          {formatOrderMoney(o.amount, o.currency)}
                        </strong>
                        <span className={`dash-m__order-date${o.fresh ? ' dash-m__order-date--fresh' : ''}`}>
                          {o.date}
                        </span>
                      </div>
                      {i < recentOrders.length - 1 && <div className="dash-m__divider" />}
                    </div>
                  ))
                )}
              </div>

              <div className="dash-m__card">
                <span className="dash-m__card-title dash-m__card-title--mb">Швидкі дії</span>
                <Link to="/admin/configurator" className="dash-m__action">
                  <span className="dash-m__action-icon">
                    <Wand2 size={16} strokeWidth={2} />
                  </span>
                  <div className="dash-m__action-body">
                    <strong>Налаштувати віджет</strong>
                    <span>Змінити кольори, тексти, швидкість</span>
                  </div>
                  <ArrowRight size={14} strokeWidth={2.5} className="dash-m__action-arrow" />
                </Link>
                <Link to="/admin/sites" className="dash-m__action">
                  <span className="dash-m__action-icon">
                    <Globe size={16} strokeWidth={2} />
                  </span>
                  <div className="dash-m__action-body">
                    <strong>Додати сайт</strong>
                    <span>Встановити віджети на новий магазин</span>
                  </div>
                  <ArrowRight size={14} strokeWidth={2.5} className="dash-m__action-arrow" />
                </Link>
                <Link to="/admin/users" className="dash-m__action">
                  <span className="dash-m__action-icon">
                    <Users size={16} strokeWidth={2} />
                  </span>
                  <div className="dash-m__action-body">
                    <strong>Всі клієнти</strong>
                    <span>Список підписників і активність</span>
                  </div>
                  <ArrowRight size={14} strokeWidth={2.5} className="dash-m__action-arrow" />
                </Link>
              </div>
            </div>
          </>
        )}
      </main>

      <nav className="dash-m__bottomnav">
        {BOTTOM_NAV.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `dash-m__tab${isActive ? ' dash-m__tab--active' : ''}`
              }
            >
              <Icon size={20} strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}

function formatInt(value: number): string {
  return value.toLocaleString('uk-UA')
}

function formatMoney(value: number): string {
  return `${Math.round(value).toLocaleString('uk-UA')}₴`
}

function formatOrderMoney(value: number, currency: string): string {
  const symbol = currency.toUpperCase() === 'UAH' ? 'грн' : currency.toUpperCase()
  return `${Math.round(value).toLocaleString('uk-UA')} ${symbol}`
}

function formatPercentDelta(value: number | null): string {
  if (value === null) return '—'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toLocaleString('uk-UA')}%`
}

function formatAbsoluteDelta(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toLocaleString('uk-UA')}`
}

function formatTimeAgo(input: string): string {
  const now = Date.now()
  const ts = new Date(input).getTime()

  if (Number.isNaN(ts)) return '—'

  const mins = Math.floor((now - ts) / 60000)

  if (mins < 1) return 'щойно'
  if (mins < 60) return `${mins} хв тому`

  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} год тому`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} дні тому`

  const months = Math.floor(days / 30)
  return `${months} міс тому`
}

function isFresh(input: string): boolean {
  const ts = new Date(input).getTime()
  if (Number.isNaN(ts)) return false

  return Date.now() - ts <= 60 * 60 * 1000
}
