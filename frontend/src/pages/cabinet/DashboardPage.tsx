import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ChevronRight, ChevronDown, Globe, Wand2, HelpCircle } from 'lucide-react'
import { get } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import type { DashboardData } from '../../types'
import './styles/dashboard.css'

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [moreOpen, setMoreOpen] = useState(true)

  useEffect(() => {
    get<{ data: DashboardData }>('/profile/dashboard')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-loader">Завантаження…</div>
  if (!data) return <div className="page-loader">Не вдалося завантажити дані</div>
  if (!data.plan && !data.subscription_status) return <Navigate to="/cabinet/choose-plan" replace />

  const planSlug = data.plan?.slug
  const planName = data.plan?.name || 'Free'
  const planColor = getPlanColor(planSlug)
  const firstName = user?.name?.split(' ')[0] || 'Користувачу'

  return (
    <div className="dash">
      {/* ── Plan card ── */}
      <div className="dash__plan" style={{ borderColor: `${planColor}30` }}>
        <div className="dash__plan-top">
          <div className="dash__plan-left">
            <span className="dash__plan-greeting">Привіт, {firstName}!</span>
            <span className="dash__plan-sublabel">Ваш поточний тариф</span>
          </div>
          <div className="dash__plan-badge" style={{ background: `${planColor}20`, borderColor: `${planColor}40` }}>
            <span style={{ color: planColor }}>{planName}</span>
          </div>
        </div>

        <div className="dash__plan-divider" />

        <div className="dash__plan-stats">
          <div className="dash__plan-stat">
            <span className="dash__plan-stat-value">{data.stats.sites_count}</span>
            <span className="dash__plan-stat-label">Сайти</span>
          </div>
          <div className="dash__plan-stat">
            <span className="dash__plan-stat-value">{data.stats.widgets_count}</span>
            <span className="dash__plan-stat-label">Віджети</span>
          </div>
          <div className="dash__plan-stat">
            <span className="dash__plan-stat-value dash__plan-stat-value--yellow">—</span>
            <span className="dash__plan-stat-label">Поновлення</span>
          </div>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="dash__kpi-row">
        <div className="dash__kpi" style={{ borderColor: `${planColor}30` }}>
          <span className="dash__kpi-value" style={{ color: planColor }}>
            {data.stats.widgets_count} / {data.plan?.max_widgets ?? '?'}
          </span>
          <span className="dash__kpi-label">Активні віджети</span>
        </div>
        <div className="dash__kpi" style={{ borderColor: 'rgba(16, 185, 129, 0.25)' }}>
          <span className="dash__kpi-value" style={{ color: '#10B981' }}>15 хв</span>
          <span className="dash__kpi-label">Середній ETA підтримки</span>
        </div>
      </div>

      {/* ── More section (collapsible) ── */}
      <div className="dash__more">
        <button className="dash__more-head" onClick={() => setMoreOpen(!moreOpen)}>
          <span className="dash__more-title">Докладніше</span>
          <ChevronDown
            size={16}
            className={`dash__more-chevron ${moreOpen ? 'dash__more-chevron--open' : ''}`}
          />
        </button>

        {moreOpen && (
          <>
            {/* Quick actions */}
            <div className="dash__qa-section">
              <span className="dash__qa-title">Швидкі дії</span>

              <Link to="/cabinet/sites/add" className="dash__qa-card">
                <div className="dash__qa-icon dash__qa-icon--blue">
                  <Globe size={16} />
                </div>
                <div className="dash__qa-text">
                  <span className="dash__qa-label">Додати сайт</span>
                  <span className="dash__qa-desc">Підключити новий магазин</span>
                </div>
                <ChevronRight size={14} className="dash__qa-arrow" />
              </Link>

              <Link to="/cabinet/sites/configure" className="dash__qa-card">
                <div className="dash__qa-icon dash__qa-icon--blue">
                  <Wand2 size={16} />
                </div>
                <div className="dash__qa-text">
                  <span className="dash__qa-label">Конфігуратор</span>
                  <span className="dash__qa-desc">Увімкнути / налаштувати віджети</span>
                </div>
                <ChevronRight size={14} className="dash__qa-arrow" />
              </Link>

              <Link to="/cabinet/support" className="dash__qa-card">
                <div className="dash__qa-icon dash__qa-icon--green">
                  <HelpCircle size={16} />
                </div>
                <div className="dash__qa-text">
                  <span className="dash__qa-label">Підтримка</span>
                  <span className="dash__qa-desc">Telegram · відповідь до 15 хв</span>
                </div>
                <ChevronRight size={14} className="dash__qa-arrow" />
              </Link>
            </div>

            {/* Recent activity */}
            <div className="dash__activity-card">
              <div className="dash__activity-head">
                <span className="dash__activity-title">Остання активність</span>
                <Link to="/cabinet/notifications" className="dash__activity-link">Усі →</Link>
              </div>
              {data.recent_activity.length > 0 ? (
                data.recent_activity.slice(0, 3).map((item, i) => (
                  <div key={i} className="dash__activity-row">
                    <div className={`dash__activity-dot dash__activity-dot--${dotColor(i)}`} />
                    <span className="dash__activity-text">{item.description}</span>
                    <span className="dash__activity-time">{timeAgo(item.created_at)}</span>
                  </div>
                ))
              ) : (
                <div className="dash__activity-row">
                  <span className="dash__activity-text" style={{ color: 'var(--text-muted)' }}>
                    Поки немає активності
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
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

function dotColor(i: number): string {
  return ['green', 'blue', 'yellow'][i % 3]!
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'щойно'
  if (mins < 60) return `${mins} хв`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} год`
  const days = Math.floor(hours / 24)
  return `${days} дн`
}
