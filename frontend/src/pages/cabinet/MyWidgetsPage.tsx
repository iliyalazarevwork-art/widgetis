import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, ArrowLeft } from 'lucide-react'
import { get } from '../../api/client'
import type { WidgetAccess } from '../../types'
import { PageLoader } from '../../components/PageLoader'
import './styles/widgets.css'

export default function MyWidgetsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<WidgetAccess | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    get<WidgetAccess>('/profile/widgets')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />
  if (!data) return <PageLoader label="Помилка завантаження" />

  return (
    <div className="wdg-page">
      <div className="wdg-page__header">
        <button className="page-back" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <h1 className="wdg-page__title">Мої віджети</h1>
        <div style={{ width: 36 }} />
      </div>
      <span className="wdg-page__limit">
        {data.limits.used} з {data.limits.max} віджетів
      </span>

      <div className="wdg-page__progress">
        <div
          className="wdg-page__progress-fill"
          style={{ width: `${(data.limits.used / data.limits.max) * 100}%` }}
        />
      </div>

      <h2 className="wdg-page__section">Доступні у вашому плані</h2>
      <div className="wdg-page__list">
        {data.available.map((w) => (
          <div key={w.product_id} className="wdg-page__item">
            <span className="wdg-page__item-icon">{w.icon || '📦'}</span>
            <span className="wdg-page__item-name">{w.name}</span>
            <span className={`wdg-page__item-status ${w.is_enabled ? 'wdg-page__item-status--on' : ''}`}>
              {w.is_enabled ? 'Увімкнено' : 'Вимкнено'}
            </span>
          </div>
        ))}
      </div>

      {data.locked.length > 0 && (
        <>
          <h2 className="wdg-page__section wdg-page__section--locked">
            <Lock size={14} /> Потрібен вищий план
          </h2>
          <div className="wdg-page__list">
            {data.locked.map((w) => (
              <div key={w.product_id} className="wdg-page__item wdg-page__item--locked">
                <span className="wdg-page__item-icon">{w.icon || '📦'}</span>
                <span className="wdg-page__item-name">{w.name}</span>
                <Lock size={14} className="wdg-page__item-lock" />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
