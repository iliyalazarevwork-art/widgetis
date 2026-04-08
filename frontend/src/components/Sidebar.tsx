import { NavLink } from 'react-router-dom'
import {
  X, LayoutDashboard, Globe, Wand2, CreditCard, Package,
  Receipt, Bell, Settings, HelpCircle, User, Monitor, LogOut,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import './sidebar.css'

interface Props {
  open: boolean
  onClose: () => void
}

const navItems = [
  { to: '/cabinet', icon: LayoutDashboard, label: 'Дашборд', end: true },
  { to: '/cabinet/sites', icon: Globe, label: 'Мої сайти' },
  { to: '/cabinet/sites/configure', icon: Wand2, label: 'Конфігуратор' },
  { to: '/cabinet/plan', icon: CreditCard, label: 'Мій план' },
  { to: '/cabinet/widgets', icon: Package, label: 'Мої віджети' },
  { to: '/cabinet/payments', icon: Receipt, label: 'Історія платежів' },
  { to: '/cabinet/notifications', icon: Bell, label: 'Сповіщення' },
  { to: '/cabinet/demo', icon: Monitor, label: 'Демо-сесія' },
  { to: '/cabinet/support', icon: HelpCircle, label: 'Підтримка' },
  { to: '/cabinet/profile', icon: User, label: 'Профіль' },
  { to: '/cabinet/settings', icon: Settings, label: 'Налаштування' },
]

export default function Sidebar({ open, onClose }: Props) {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    onClose()
    await logout()
    window.location.href = '/login'
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="sidebar__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            className="sidebar"
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="sidebar__header">
              <div className="sidebar__user">
                <div className="sidebar__avatar">
                  {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="sidebar__user-info">
                  <span className="sidebar__user-name">{user?.name || 'Користувач'}</span>
                  <span className="sidebar__user-email">{user?.email}</span>
                </div>
              </div>
              <button className="sidebar__close" onClick={onClose} aria-label="Закрити">
                <X size={18} />
              </button>
            </div>

            <nav className="sidebar__nav">
              {navItems.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                  }
                  onClick={onClose}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            <button className="sidebar__logout" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Вийти</span>
            </button>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
