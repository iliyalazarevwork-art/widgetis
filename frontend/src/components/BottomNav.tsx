import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Wand2, Globe, Receipt, Settings } from 'lucide-react'
import './bottomnav.css'

const items = [
  { to: '/cabinet', icon: LayoutDashboard, label: 'Дашборд', end: true },
  { to: '/cabinet/sites/configure', icon: Wand2, label: 'Конфіг', end: false },
  { to: '/cabinet/sites', icon: Globe, label: 'Сайти', end: false },
  { to: '/cabinet/payments', icon: Receipt, label: 'Замовлення', end: false },
  { to: '/cabinet/settings', icon: Settings, label: 'Налаштув.', end: false },
]

export default function BottomNav() {
  return (
    <nav className="bottomnav">
      {items.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `bottomnav__item ${isActive ? 'bottomnav__item--active' : ''}`
          }
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
