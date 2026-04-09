import { Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './topbar.css'

interface Props {
  onMenuClick: () => void
}

export default function Topbar({ onMenuClick }: Props) {
  const { user } = useAuth()

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.split('@')[0].slice(0, 2).toUpperCase() || '?'

  return (
    <header className="topbar">
      <button className="topbar__burger" onClick={onMenuClick} aria-label="Меню">
        <Menu size={18} />
      </button>

      <div className="topbar__center">
        <span className="topbar__title">Мій кабінет</span>
        {user && (
          <span className="topbar__email">{user.email}</span>
        )}
      </div>

      <div className="topbar__avatar">{initials}</div>
    </header>
  )
}
