import { useEffect, useState } from 'react'
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Repeat2,
  Wand2,
  Globe,
  Receipt,
  Users,
  Settings,
  MessageSquareWarning,
  LogOut,
  X,
  ExternalLink,
} from 'lucide-react'
import { HamburgerIcon } from '../../components/HamburgerIcon'
import { BRAND_EMAIL, BRAND_NAME } from '../../constants/brand'
import './admin.css'

const NAV = [
  { to: '/admin', label: 'Дашборд', icon: LayoutDashboard, end: true },
  { to: '/admin/subscriptions', label: 'Підписки', icon: Repeat2 },
  { to: '/admin/configurator', label: 'Конфігуратор', icon: Wand2 },
  { to: '/admin/orders', label: 'Замовлення', icon: Receipt },
  { to: '/admin/users', label: 'Користувачі', icon: Users },
  { to: '/admin/sites', label: 'Сайти', icon: Globe },
  { to: '/admin/manager-requests', label: 'Manager Requests', icon: MessageSquareWarning },
  { to: '/admin/settings', label: 'Налаштування', icon: Settings },
]

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isMobileCanvasPage =
    location.pathname === '/admin' ||
    location.pathname.startsWith('/admin/configurator') ||
    location.pathname.startsWith('/admin/subscriptions') ||
    location.pathname.startsWith('/admin/widgets') ||
    location.pathname.startsWith('/admin/users') ||
    location.pathname.startsWith('/admin/orders') ||
    location.pathname.startsWith('/admin/sites') ||
    location.pathname.startsWith('/admin/settings') ||
    location.pathname.startsWith('/admin/manager-requests')

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="admin">
      {/* Sidebar */}
      <aside className={`admin__sidebar ${mobileOpen ? 'admin__sidebar--open' : ''}`}>
        <div className="admin__sidebar-top">
          <Link to="/admin" className="admin__brand" onClick={() => setMobileOpen(false)}>
            <svg
              className="admin__brand-mark"
              viewBox="0 0 120 100"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M 14 14 L 42 86 L 60 46 L 78 86 L 106 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="22"
                strokeLinejoin="miter"
                strokeLinecap="round"
              />
            </svg>
            <span className="admin__brand-text">
              {BRAND_NAME}
              <small>Admin</small>
            </span>
          </Link>
          <button
            className="admin__sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Закрити меню"
            type="button"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <nav className="admin__nav">
          {NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `admin__nav-link ${isActive ? 'admin__nav-link--active' : ''}`
                }
              >
                <Icon size={17} strokeWidth={2} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="admin__sidebar-bottom">
          <Link to="/" className="admin__ext-link">
            <ExternalLink size={14} strokeWidth={2} />
            <span>Сайт</span>
          </Link>
          <button className="admin__logout" type="button">
            <LogOut size={14} strokeWidth={2} />
            <span>Вийти</span>
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="admin__overlay"
          onClick={() => setMobileOpen(false)}
          role="presentation"
        />
      )}

      {/* Main area */}
      <div className="admin__main">
        <header className={`admin__topbar ${isMobileCanvasPage ? 'admin__topbar--mobile-hidden' : ''}`}>
          <button
            className="admin__burger"
            onClick={() => setMobileOpen(true)}
            aria-label="Відкрити меню"
            type="button"
          >
            <HamburgerIcon size={20} />
          </button>
          <div className="admin__user">
            <div className="admin__avatar" aria-hidden="true">
              И
            </div>
            <div className="admin__user-info">
              <strong>Ілля Л.</strong>
              <span>{BRAND_EMAIL}</span>
            </div>
          </div>
        </header>
        <main className={`admin__content ${isMobileCanvasPage ? 'admin__content--mobile-canvas' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
