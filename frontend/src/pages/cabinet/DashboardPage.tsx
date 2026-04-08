import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Globe, Wand2, CreditCard, ChevronRight, Package, ArrowUpRight } from 'lucide-react'
import { get } from '../../api/client'
import type { DashboardData } from '../../types'
import './styles/dashboard.css'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    get<{ data: DashboardData }>('/profile/dashboard')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="page-loader">Завантаження…</div>
  }

  if (!data) {
    return <div className="page-loader">Не вдалося завантажити дані</div>
  }

  // No subscription — redirect to plan selection
  if (!data.plan && !data.subscription_status) {
    return <Navigate to="/choose-plan" replace />
  }

  const planName = data.plan?.name || 'Free'
  const planColor = getPlanColor(data.plan?.slug)

  return (
    <div className="dash">
      {/* Plan card */}
      <div className="dash__plan-card">
        <div className="dash__plan-top">
          <div className="dash__plan-info">
            <span className="dash__plan-label">Поточний план</span>
            <span className="dash__plan-name" style={{ color: planColor }}>{planName}</span>
          </div>
          <Link to="/cabinet/plan" className="dash__plan-link">
            Деталі <ChevronRight size={14} />
          </Link>
        </div>
        <div className="dash__plan-divider" />
        <div className="dash__plan-stats">
          <div className="dash__plan-stat">
            <Globe size={14} className="dash__plan-stat-icon" />
            <span>{data.stats.sites_count} сайтів</span>
          </div>
          <div className="dash__plan-stat">
            <Package size={14} className="dash__plan-stat-icon" />
            <span>{data.stats.widgets_count} віджетів</span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="dash__section">
        <h2 className="dash__section-title">Швидкі дії</h2>
        <div className="dash__actions">
          <Link to="/cabinet/sites/add" className="dash__action">
            <div className="dash__action-icon dash__action-icon--blue">
              <Globe size={18} />
            </div>
            <div className="dash__action-text">
              <span className="dash__action-label">Додати сайт</span>
              <span className="dash__action-desc">Підключити магазин</span>
            </div>
            <ArrowUpRight size={16} className="dash__action-arrow" />
          </Link>

          <Link to="/cabinet/sites/configure" className="dash__action">
            <div className="dash__action-icon dash__action-icon--purple">
              <Wand2 size={18} />
            </div>
            <div className="dash__action-text">
              <span className="dash__action-label">Конфігуратор</span>
              <span className="dash__action-desc">Налаштувати віджети</span>
            </div>
            <ArrowUpRight size={16} className="dash__action-arrow" />
          </Link>

          <Link to="/cabinet/plan" className="dash__action">
            <div className="dash__action-icon dash__action-icon--green">
              <CreditCard size={18} />
            </div>
            <div className="dash__action-text">
              <span className="dash__action-label">Змінити план</span>
              <span className="dash__action-desc">Порівняти тарифи</span>
            </div>
            <ArrowUpRight size={16} className="dash__action-arrow" />
          </Link>
        </div>
      </div>

      {/* Recent activity */}
      {data.recent_activity.length > 0 && (
        <div className="dash__section">
          <h2 className="dash__section-title">Остання активність</h2>
          <div className="dash__activity">
            {data.recent_activity.map((item, i) => (
              <div key={i} className="dash__activity-item">
                <div className="dash__activity-dot" />
                <div className="dash__activity-content">
                  <span className="dash__activity-text">{item.description}</span>
                  <span className="dash__activity-time">
                    {new Date(item.created_at).toLocaleDateString('uk-UA')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getPlanColor(slug?: string | null): string {
  switch (slug) {
    case 'basic': return '#10B981'
    case 'pro': return '#3B82F6'
    case 'max': return '#A855F7'
    default: return '#888888'
  }
}
