import { type ReactNode, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { ArrowLeft, Banknote, Globe, LayoutDashboard, Menu, Receipt, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { MobileMenuDrawer } from './AdminPages'
import './admin-screen-layout.css'

// ─── Bottom nav tabs (from Pencil design node HTE7v) ───────────────────────

const BOTTOM_TABS = [
  { to: '/admin', label: 'Дашборд', icon: LayoutDashboard, end: true, dim: false },
  { to: '/admin/orders', label: 'Замовлення', icon: Receipt, end: false, dim: false },
  { to: '/admin/users', label: 'Юзери', icon: Users, end: false, dim: false },
  { to: '/admin/sites', label: 'Сайти', icon: Globe, end: false, dim: false },
  { to: '/admin/subscriptions', label: 'Підписки', icon: Banknote, end: false, dim: false },
]

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

// ─── Props ─────────────────────────────────────────────────────────────────

type DashboardMode = {
  /** Main bottom-nav section. Shows: [burger] | [Title + Subtitle] | [Avatar] */
  mode: 'dashboard'
  title: string
  subtitle?: string
  children: ReactNode
}

type SubpageMode = {
  /** Detail / drill-down page. Shows: [←] | [Title] | [action btn OR spacer] */
  mode: 'subpage'
  title: string
  /** Optional right-side action button. Use <button className="adm-screen__action-btn"> */
  actionButton?: ReactNode
  children: ReactNode
}

type Props = DashboardMode | SubpageMode

// ─── Component ─────────────────────────────────────────────────────────────

export function AdminScreenLayout(props: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const initials = getInitials(user?.name ?? null, user?.email ?? '')

  return (
    <div className="adm-screen">

      {/* Hamburger drawer — dashboard mode only */}
      {props.mode === 'dashboard' && (
        <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      )}

      {/* ── Sticky topbar ─────────────────────────────────────────────── */}
      <header className="adm-screen__topbar">
        {props.mode === 'dashboard' ? (
          <>
            {/* Left: burger menu */}
            <button
              className="adm-screen__icon-btn"
              type="button"
              aria-label="Меню"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={18} strokeWidth={2} />
            </button>

            {/* Center: title + subtitle */}
            <div className="adm-screen__title-stack">
              <strong>{props.title}</strong>
              {props.subtitle && <span>{props.subtitle}</span>}
            </div>

            {/* Right: user avatar with initials */}
            <div className="adm-screen__avatar">
              {initials}
            </div>
          </>
        ) : (
          <>
            {/* Left: back button — navigate(-1) via React Router */}
            <button
              className="adm-screen__icon-btn"
              type="button"
              aria-label="Назад"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={18} strokeWidth={2} />
            </button>

            {/* Center: page title */}
            <h1 className="adm-screen__page-title">{props.title}</h1>

            {/* Right: action button OR invisible spacer (keeps title centered) */}
            {props.actionButton != null ? (
              props.actionButton
            ) : (
              <div className="adm-screen__icon-btn adm-screen__icon-btn--ghost" aria-hidden="true" />
            )}
          </>
        )}
      </header>

      {/* ── Scrollable content ────────────────────────────────────────── */}
      <main className="adm-screen__body">
        {props.children}
      </main>

      {/* ── Fixed bottom tab navigation ───────────────────────────────── */}
      <nav className="adm-screen__bottomnav">
        {BOTTOM_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              ['adm-screen__tab', isActive ? 'adm-screen__tab--active' : '', tab.dim ? 'adm-screen__tab--dim' : '']
                .filter(Boolean)
                .join(' ')
            }
          >
            <tab.icon size={20} strokeWidth={2} />
            {tab.label && <span>{tab.label}</span>}
          </NavLink>
        ))}
      </nav>

    </div>
  )
}
