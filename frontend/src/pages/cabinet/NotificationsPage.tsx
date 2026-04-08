import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, ArrowLeft } from 'lucide-react'
import { get, post } from '../../api/client'
import type { AppNotification } from '../../types'
import './styles/notifications.css'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    get<{ data: AppNotification[]; unread_count: number }>('/profile/notifications')
      .then((res) => setItems(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const markAllRead = async () => {
    await post('/profile/notifications/mark-all-read')
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const markRead = async (id: number) => {
    await post(`/profile/notifications/${id}/read`)
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
  }

  if (loading) return <div className="page-loader">Завантаження…</div>

  const unread = items.filter((n) => !n.is_read).length

  return (
    <div className="notif-page">
      <div className="notif-page__header">
        <button className="page-back" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <h1 className="notif-page__title">Сповіщення</h1>
        {unread > 0 && (
          <button className="notif-page__mark-all" onClick={markAllRead}>
            <Check size={14} /> Прочитати все
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="notif-page__empty">
          <Bell size={40} strokeWidth={1} />
          <p>Немає сповіщень</p>
        </div>
      ) : (
        <div className="notif-page__list">
          {items.map((n) => (
            <div
              key={n.id}
              className={`notif-page__item ${!n.is_read ? 'notif-page__item--unread' : ''}`}
              onClick={() => !n.is_read && markRead(n.id)}
            >
              {!n.is_read && <div className="notif-page__unread-dot" />}
              <div className="notif-page__item-content">
                <span className="notif-page__item-title">{n.title}</span>
                <span className="notif-page__item-body">{n.body}</span>
                <span className="notif-page__item-time">
                  {new Date(n.created_at).toLocaleDateString('uk-UA')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
