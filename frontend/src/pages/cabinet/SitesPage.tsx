import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Globe, ChevronRight } from 'lucide-react'
import { get } from '../../api/client'
import type { Site } from '../../types'
import './styles/sites.css'

interface SitesResponse {
  data: Site[]
  limits: { used: number; max: number; plan: string }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [limits, setLimits] = useState<{ used: number; max: number; plan: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    get<SitesResponse>('/profile/sites')
      .then((res) => {
        setSites(res.data)
        setLimits(res.limits)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-loader">Завантаження…</div>

  const isAtLimit = limits ? limits.used >= limits.max : false

  return (
    <div className="sites">
      <Link to="/cabinet/sites/add" className="sites__add-btn">
        <Plus size={18} />
        <span>Додати сайт</span>
      </Link>

      {limits && (
        <div className="sites__limit-row">
          <span className="sites__limit-text">
            {limits.plan} план · використано {limits.used} з {limits.max} сайтів
          </span>
          {isAtLimit && <span className="sites__limit-badge">Ліміт</span>}
        </div>
      )}

      {sites.length === 0 ? (
        <div className="sites__empty">
          <Globe size={40} strokeWidth={1} />
          <p>У вас ще немає сайтів</p>
        </div>
      ) : (
        <div className="sites__list">
          {sites.map((site) => (
            <Link
              key={site.id}
              to={`/cabinet/sites/${site.domain}/widgets`}
              className="sites__card"
            >
              <div className="sites__card-main">
                <div className={`sites__icon sites__icon--${site.status}`}>
                  <Globe size={18} strokeWidth={1.5} />
                </div>
                <div className="sites__card-body">
                  <div className="sites__card-top">
                    <span className="sites__card-domain">{site.domain}</span>
                    <span className={`sites__status-badge sites__status-badge--${site.status}`}>
                      {site.status === 'active' && '✓ Активний'}
                      {site.status === 'pending' && 'Очікує'}
                      {site.status === 'disconnected' && 'Відключений'}
                    </span>
                  </div>
                  <span className="sites__card-date">
                    {site.status === 'active'
                      ? `Підключено ${formatDate(site.connected_at)}`
                      : `Додано ${formatDate(site.created_at)}`}
                  </span>
                  <div className="sites__card-meta">
                    <span className="sites__meta-widgets">
                      <Globe size={11} />
                      {site.widgets_count} віджет{widgetSuffix(site.widgets_count)}
                    </span>
                    <span className={`sites__meta-plan sites__meta-plan--${limits?.plan?.toLowerCase()}`}>
                      {limits?.plan}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="sites__card-arrow" />
              </div>

              {site.status === 'pending' && (
                <div className="sites__card-warning">
                  <span>Встановіть скрипт для верифікації</span>
                  <span className="sites__instruction-btn">Інструкція</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function widgetSuffix(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return ''
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'и'
  return 'ів'
}
