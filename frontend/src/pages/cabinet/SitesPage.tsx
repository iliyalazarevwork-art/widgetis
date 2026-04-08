import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Globe, ChevronRight, Package } from 'lucide-react'
import { get } from '../../api/client'
import type { Site } from '../../types'
import './styles/sites.css'

interface SitesResponse {
  data: Site[]
  limits: { used: number; max: number; plan: string }
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

  return (
    <div className="sites">
      <div className="sites__header">
        <div>
          <h1 className="sites__title">Мої сайти</h1>
          {limits && (
            <span className="sites__limit">
              {limits.used} з {limits.max} використано
            </span>
          )}
        </div>
        <Link to="/cabinet/sites/add" className="sites__add-btn">
          <Plus size={18} />
          <span>Додати</span>
        </Link>
      </div>

      {sites.length === 0 ? (
        <div className="sites__empty">
          <Globe size={40} strokeWidth={1} />
          <p>У вас ще немає сайтів</p>
          <Link to="/cabinet/sites/add" className="sites__empty-cta">
            Додати перший сайт
          </Link>
        </div>
      ) : (
        <div className="sites__list">
          {sites.map((site) => (
            <Link
              key={site.id}
              to={`/cabinet/sites/${site.id}/widgets`}
              className="sites__card"
            >
              <div className="sites__card-left">
                <div className={`sites__status-dot sites__status-dot--${site.status}`} />
                <div className="sites__card-info">
                  <span className="sites__card-domain">{site.domain}</span>
                  <span className="sites__card-meta">
                    <Package size={12} /> {site.widgets_count} віджетів · {site.platform}
                  </span>
                </div>
              </div>
              <ChevronRight size={16} className="sites__card-arrow" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
