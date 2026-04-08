import { NavLink } from 'react-router-dom'
import {
  X, LayoutDashboard, Globe, Wand2, Receipt, Settings, LogOut, ExternalLink,
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
  { to: '/cabinet/sites/configure', icon: Wand2, label: 'Конфігуратор' },
  { to: '/cabinet/sites', icon: Globe, label: 'Сайти' },
  { to: '/cabinet/payments', icon: Receipt, label: 'Замовлення' },
  { to: '/cabinet/settings', icon: Settings, label: 'Налаштування' },
]

export default function Sidebar({ open, onClose }: Props) {
  const { logout } = useAuth()

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
              <div className="sidebar__brand">
                <div className="sidebar__brand-mark">W</div>
                <div className="sidebar__brand-copy">
                  <span className="sidebar__brand-name">WIDGETIS</span>
                  <span className="sidebar__brand-role">КАБІНЕТ</span>
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

            <div className="sidebar__bottom">
              <a href="/" className="sidebar__bottom-btn" onClick={onClose}>
                <ExternalLink size={14} />
                <span>Сайт</span>
              </a>
              <button className="sidebar__bottom-btn" onClick={handleLogout}>
                <LogOut size={14} />
                <span>Вийти</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
