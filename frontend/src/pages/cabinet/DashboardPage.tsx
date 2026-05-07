import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronRight, ChevronDown, CirclePlus, Wand2, Headset, Gift, Check, AlertTriangle, Bell, XCircle, Clock } from 'lucide-react'
import { get } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import type { DashboardData } from '../../types'
import { toast } from 'sonner'
import { PageLoader } from '../../components/PageLoader'
import { MaxUpsellBanner, shouldShowMaxUpsellBanner, dismissMaxUpsellBanner } from '../../components/MaxUpsellBanner'
import './styles/dashboard.css'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [moreOpen, setMoreOpen] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const [maxBannerVisible, setMaxBannerVisible] = useState(false)

  useEffect(() => {
    get<{ data: DashboardData }>('/profile/dashboard')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      toast.success('Картку підключено! Тріал активний — перший платіж через 7 днів.', {
        duration: 8000,
      })
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (data?.plan?.slug === 'pro' && shouldShowMaxUpsellBanner()) {
      setMaxBannerVisible(true)
    }
  }, [data])

  if (loading) return <PageLoader />
  if (!data) return <PageLoader label="Не вдалося завантажити дані" />
  if (!data.plan && !data.subscription_status) return <Navigate to="/cabinet/choose-plan" replace />

  const planSlug = data.plan?.slug
  const planName = data.plan?.name || 'Free'
  const planColor = getPlanColor(planSlug)
  const firstName = user?.name?.trim().split(/\s+/)[0]
  const greeting = firstName ? `Привіт, ${firstName}!` : 'Привіт!'

  const handleMaxBannerDismiss = () => {
    dismissMaxUpsellBanner()
    setMaxBannerVisible(false)
  }

  const handleMaxBannerUpgrade = () => {
    navigate('/cabinet/plan?upgrade=max')
  }

  return (
    <div className="dash">
      {/* ── Max upsell banner (Pro users only) ── */}
      {maxBannerVisible && (
        <MaxUpsellBanner
          onUpgradeClick={handleMaxBannerUpgrade}
          onDismiss={handleMaxBannerDismiss}
          className="dash__max-upsell"
        />
      )}
      {/* ── Plan card ── */}
      <div className="dash__plan" style={{ borderColor: `${planColor}30` }}>
        <div className="dash__plan-top">
          <div className="dash__plan-left">
            <span className="dash__plan-greeting">{greeting}</span>
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
            <span className="dash__plan-stat-value dash__plan-stat-value--yellow">{formatRenewalDate(data.next_renewal_at)}</span>
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
                  <CirclePlus size={15} />
                </div>
                <div className="dash__qa-text">
                  <span className="dash__qa-label">Додати сайт</span>
                  <span className="dash__qa-desc">Підключіть новий магазин</span>
                </div>
                <ChevronRight size={14} className="dash__qa-arrow" />
              </Link>

              <Link to="/cabinet/sites/configure" className="dash__qa-card">
                <div className="dash__qa-icon dash__qa-icon--blue">
                  <Wand2 size={15} />
                </div>
                <div className="dash__qa-text">
                  <span className="dash__qa-label">Налаштувати віджет</span>
                  <span className="dash__qa-desc">Змінити кольори та тексти</span>
                </div>
                <ChevronRight size={14} className="dash__qa-arrow" />
              </Link>

              <Link to="/cabinet/support" className="dash__qa-card">
                <div className="dash__qa-icon dash__qa-icon--green">
                  <Headset size={15} />
                </div>
                <div className="dash__qa-text">
                  <span className="dash__qa-label">Підтримка</span>
                  <span className="dash__qa-desc">Написати в Telegram</span>
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
                  <div key={`${item.source}-${item.action}-${item.created_at}-${i}`} className="dash__activity-row">
                    <div className={`dash__activity-icon-wrap dash__activity-icon-wrap--${activityTone(item.status)}`}>
                      {activityIcon(item.status, item.source)}
                    </div>
                    <div className="dash__activity-main">
                      <span className="dash__activity-text">{activityTitle(item)}</span>
                      <span className="dash__activity-subtext">{activitySubtitle(item)}</span>
                    </div>
                    <div className="dash__activity-meta">
                      {item.source === 'payment' ? (
                        <>
                          <span className={`dash__activity-amount ${item.is_trial ? 'dash__activity-amount--trial' : ''}`}>
                            {paymentAmount(item)}
                          </span>
                          <span className={`dash__activity-status dash__activity-status--${activityTone(item.status)}`}>
                            {activityStatusLabel(item)}
                          </span>
                        </>
                      ) : (
                        <span className="dash__activity-time">{timeAgo(item.created_at)}</span>
                      )}
                    </div>
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

function activityTone(status: string): 'trial' | 'success' | 'failed' | 'pending' | 'info' | 'neutral' | 'cancelled' | 'expired' {
  switch (status) {
    case 'trial': return 'trial'
    case 'success': return 'success'
    case 'failed': return 'failed'
    case 'pending': return 'pending'
    case 'info': return 'info'
    case 'cancelled': return 'cancelled'
    case 'expired': return 'expired'
    default: return 'neutral'
  }
}

function activityIcon(status: string, source: string) {
  if (status === 'trial') return <Gift size={14} />
  if (status === 'success') return <Check size={14} />
  if (status === 'failed') return <AlertTriangle size={14} />
  if (status === 'cancelled') return <XCircle size={14} />
  if (status === 'expired') return <Clock size={14} />
  if (source === 'notification') return <Bell size={14} />

  return <Check size={14} />
}

function activityTitle(item: DashboardData['recent_activity'][number]): string {
  if (item.source !== 'payment') return item.title || item.description
  if (item.is_trial) return 'Trial активовано'

  const planLabel = item.plan_name ? `${item.plan_name} підписка` : 'Оплата'
  return `${planLabel} — ${monthName(item.created_at)}`
}

function activitySubtitle(item: DashboardData['recent_activity'][number]): string {
  if (item.source === 'payment') {
    if (item.is_trial) return formatDate(item.created_at)
    const provider = item.provider || 'Картка'
    return `${formatDate(item.created_at)} · ${provider}`
  }

  return item.subtitle || item.description
}

function activityStatusLabel(item: DashboardData['recent_activity'][number]): string {
  if (item.is_trial) return `Trial ${item.trial_days ?? 7} днів`
  switch (item.status) {
    case 'success': return 'Успішно'
    case 'pending': return 'Очікує'
    case 'failed': return 'Помилка'
    case 'cancelled': return 'Скасовано'
    case 'expired': return 'Закінчилась'
    default: return 'Оновлено'
  }
}

function paymentAmount(item: DashboardData['recent_activity'][number]): string {
  if (item.is_trial || item.amount === null) return '0 ₴'
  const value = Math.round(Math.abs(item.amount))
  return `−${value.toLocaleString('uk-UA')} ₴`
}

function formatRenewalDate(value: string | null): string {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
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

function formatDate(raw: string): string {
  return new Date(raw).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function monthName(raw: string): string {
  return new Date(raw).toLocaleDateString('uk-UA', { month: 'long' })
}
