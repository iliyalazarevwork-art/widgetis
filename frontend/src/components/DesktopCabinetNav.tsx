import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Globe, Wand2, Receipt, Settings, Headset, LogOut, ExternalLink, UserRound,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { BRAND_NAME } from '../constants/brand'
import './desktop-cabinet-nav.css'

const navItems = [
  { to: '/cabinet', icon: LayoutDashboard, label: 'Дашборд', end: true },
  { to: '/cabinet/sites/configure', icon: Wand2, label: 'Конфігуратор', end: true },
  { to: '/cabinet/sites', icon: Globe, label: 'Сайти', end: true },
  { to: '/cabinet/payments', icon: Receipt, label: 'Платежі', end: false },
  { to: '/cabinet/settings', icon: Settings, label: 'Налаштування', end: false },
  { to: '/cabinet/support', icon: Headset, label: 'Допомога', end: false },
]

export default function DesktopCabinetNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.split('@')[0].slice(0, 2).toUpperCase() || '?'

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return (
    <aside className="desktop-cabinet-nav" aria-label="Навігація кабінету">
      <div className="desktop-cabinet-nav__brand">
        <div className="desktop-cabinet-nav__brand-mark">W</div>
        <div className="desktop-cabinet-nav__brand-copy">
          <span className="desktop-cabinet-nav__brand-name">{BRAND_NAME}</span>
          <span className="desktop-cabinet-nav__brand-role">КАБІНЕТ</span>
        </div>
      </div>

      <button
        type="button"
        className="desktop-cabinet-nav__user"
        onClick={() => navigate('/cabinet/profile')}
        aria-label="Профіль"
      >
        <span className="desktop-cabinet-nav__avatar">{initials}</span>
        <span className="desktop-cabinet-nav__user-info">
          <span className="desktop-cabinet-nav__user-name">
            {user?.name || 'Профіль'}
          </span>
          {user?.email && (
            <span className="desktop-cabinet-nav__user-email">{user.email}</span>
          )}
        </span>
        <UserRound size={16} className="desktop-cabinet-nav__user-icon" />
      </button>

      <nav className="desktop-cabinet-nav__nav">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `desktop-cabinet-nav__link ${isActive ? 'desktop-cabinet-nav__link--active' : ''}`
            }
          >
            <Icon size={18} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="desktop-cabinet-nav__bottom">
        <a href="/" className="desktop-cabinet-nav__bottom-btn">
          <ExternalLink size={14} />
          <span>Сайт</span>
        </a>
        <button
          type="button"
          className="desktop-cabinet-nav__bottom-btn desktop-cabinet-nav__bottom-btn--logout"
          onClick={handleLogout}
        >
          <LogOut size={14} />
          <span>Вийти</span>
        </button>
      </div>
    </aside>
  )
}
