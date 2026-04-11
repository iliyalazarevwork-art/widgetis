import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  User, CreditCard, ChevronRight, LogOut, Trash2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { DeleteAccountModal } from '../../components/DeleteAccountModal'
import './styles/settings.css'

const sections = [
  {
    title: 'Акаунт',
    items: [
      { icon: User, label: 'Профіль', to: '/cabinet/profile' },
      { icon: CreditCard, label: 'Мій план', to: '/cabinet/plan' },
    ],
  },
]

export default function SettingsPage() {
  const { logout } = useAuth()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return (
    <div className="set-page">
      <h1 className="set-page__title">Налаштування</h1>

      {sections.map((section) => (
        <div key={section.title} className="set-page__section">
          <span className="set-page__section-title">{section.title}</span>
          <div className="set-page__card">
            {section.items.map(({ icon: Icon, label, to }) => (
              <Link key={label} to={to} className="set-page__row">
                <Icon size={18} className="set-page__row-icon" />
                <span className="set-page__row-label">{label}</span>
                <ChevronRight size={16} className="set-page__row-arrow" />
              </Link>
            ))}
          </div>
        </div>
      ))}

      <div className="set-page__danger">
        <button className="set-page__danger-btn" onClick={handleLogout}>
          <LogOut size={18} /> Вийти з акаунту
        </button>
        <button
          type="button"
          className="set-page__danger-btn set-page__danger-btn--red"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 size={18} /> Видалити акаунт
        </button>
      </div>

      <DeleteAccountModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </div>
  )
}
