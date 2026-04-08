import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  TrendingUp,
  Package,
  Globe,
  Receipt,
  ArrowUpRight,
  Wand2,
  ArrowRight,
  Menu,
  X,
  LayoutDashboard,
  Users,
} from 'lucide-react'
import './dashboard.css'

const STATS = [
  {
    label: 'Замовлень',
    value: '248',
    delta: '+12%',
    period: 'за місяць',
    icon: Receipt,
    color: 'blue',
  },
  {
    label: 'Активні сайти',
    value: '186',
    delta: '+8',
    period: 'нові за тиждень',
    icon: Globe,
    color: 'green',
  },
  {
    label: 'Встановлено',
    value: '612',
    delta: '+42',
    period: 'за тиждень',
    icon: Package,
    color: 'purple',
  },
  {
    label: 'Виручка',
    value: '248 400₴',
    delta: '+18%',
    period: 'за місяць',
    icon: TrendingUp,
    color: 'orange',
  },
]

const RECENT_ORDERS = [
  { id: 'W-MF3K9A', email: 'oleksii@store.ua', amount: 999, date: 'щойно', fresh: true },
  { id: 'W-MF3J2B', email: 'kate@beauty.com.ua', amount: 699, date: '2 год тому', fresh: false },
  { id: 'W-MF3I8C', email: 'shop@ballistic.ua', amount: 1599, date: '2 дні тому', fresh: false },
  { id: 'W-MF3G4E', email: 'info@homedetail.ua', amount: 3000, date: '1 міс тому', fresh: false },
]

const BOTTOM_NAV = [
  { to: '/admin', label: 'Дашборд', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Замовлення', icon: Receipt },
  { to: '/admin/users', label: 'Юзери', icon: Users },
  { to: '/admin/sites', label: 'Сайти', icon: Globe },
  { to: '/admin/configurator', label: 'Конфіг', icon: Wand2 },
]

const MENU_LINKS = [
  { to: '/admin', label: 'Дашборд', end: true },
  { to: '/admin/orders', label: 'Замовлення' },
  { to: '/admin/users', label: 'Користувачі' },
  { to: '/admin/sites', label: 'Сайти' },
  { to: '/admin/settings', label: 'Налаштування' },
]

export function AdminDashboardPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="dash-m">
      {/* Drawer */}
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

      {/* Topbar */}
      <header className="dash-m__topbar">
        <button
          className="dash-m__burger"
          type="button"
          aria-label="Меню"
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={18} strokeWidth={2} />
        </button>
        <div className="dash-m__topbar-center">
          <strong>Дашборд</strong>
          <span>Widgetis Admin</span>
        </div>
        <div className="dash-m__avatar">ІЛ</div>
      </header>

      {/* Scrollable body */}
      <main className="dash-m__body">
        {/* Stats 2×2 */}
        <div className="dash-m__stats">
          {STATS.map((s) => {
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

        {/* Cards */}
        <div className="dash-m__cards">
          {/* Recent orders */}
          <div className="dash-m__card">
            <div className="dash-m__card-head">
              <span className="dash-m__card-title">Останні замовлення</span>
              <Link to="/admin/orders" className="dash-m__card-link">
                Усі <ArrowRight size={12} strokeWidth={2.5} />
              </Link>
            </div>
            <div className="dash-m__divider" />
            {RECENT_ORDERS.map((o, i) => (
              <div key={o.id}>
                <div className="dash-m__order-row">
                  <code className="dash-m__order-id">{o.id}</code>
                  <span className="dash-m__order-email">{o.email}</span>
                  <strong className="dash-m__order-amount">
                    {o.amount.toLocaleString('uk-UA')} грн
                  </strong>
                  <span className={`dash-m__order-date${o.fresh ? ' dash-m__order-date--fresh' : ''}`}>
                    {o.date}
                  </span>
                </div>
                {i < RECENT_ORDERS.length - 1 && <div className="dash-m__divider" />}
              </div>
            ))}
          </div>

          {/* Quick actions */}
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
      </main>

      {/* Bottom nav */}
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
