import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUp, X, Sprout, Zap, Crown, type LucideIcon } from 'lucide-react'
import { get, post } from '../../api/client'
import { toast } from 'sonner'
import type { Subscription, Plan, DashboardData } from '../../types'
import './styles/plan.css'

// ─── Config ───────────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
  basic: '#10B981',
  pro:   '#3B82F6',
  max:   '#A855F7',
}

// Dark bg for the currently-active chip (from Pencil design data)
const PLAN_CHIP_BG: Record<string, string> = {
  basic: '#0F2B1E',
  pro:   '#1D3A5F',
  max:   '#200B38',
}

const PLAN_ICONS: Record<string, LucideIcon> = {
  sprout: Sprout,
  zap:    Zap,
  crown:  Crown,
}

const PLAN_SLUG_ICONS: Record<string, string> = {
  basic: 'sprout',
  pro:   'zap',
  max:   'crown',
}

function getPlanIcon(plan: Plan): LucideIcon {
  // features may be an empty array [] or an object {icon: '...'}
  const f = Array.isArray(plan.features) ? null : plan.features as Record<string, unknown>
  const iconName = (f?.icon as string) ?? PLAN_SLUG_ICONS[plan.slug] ?? 'zap'
  return PLAN_ICONS[iconName] ?? Zap
}

interface FeatureItem {
  key: string
  name: string
  value: boolean | string
  category: string
}

interface PlanWithFeatures extends Plan {
  feature_list: FeatureItem[]
}

interface ProrationData {
  current_plan: string
  target_plan: string
  price_difference_monthly: number
  days_remaining: number
  days_total: number
  prorate_percentage: number
  amount_due_now: number
  next_billing_amount: number
  next_billing_date: string
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyPlanPage() {
  const navigate = useNavigate()
  const [sub, setSub]             = useState<Subscription | null>(null)
  const [plans, setPlans]         = useState<PlanWithFeatures[]>([])
  const [usage, setUsage]         = useState({ sites: 0, widgets: 0 })
  const [proration, setProration] = useState<ProrationData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [changing, setChanging]   = useState(false)

  useEffect(() => {
    Promise.all([
      get<{ data: Subscription }>('/profile/subscription').catch(() => null),
      get<{ data: PlanWithFeatures[] }>('/plans'),
      get<{ data: DashboardData }>('/profile/dashboard').catch(() => null),
    ]).then(([subRes, plansRes, dashRes]) => {
      const subscription = subRes?.data ?? null
      const allPlans     = plansRes?.data ?? []

      setSub(subscription)
      setPlans(allPlans)
      setUsage({
        sites:   dashRes?.data?.stats?.sites_count   ?? 0,
        widgets: dashRes?.data?.stats?.widgets_count ?? 0,
      })

      if (subscription) {
        const sorted     = [...allPlans].sort((a, b) => a.price_monthly - b.price_monthly)
        const currentIdx = sorted.findIndex(p => p.id === subscription.plan.id)
        const next       = sorted[currentIdx + 1]
        if (next) {
          get<{ data: ProrationData }>(`/profile/subscription/prorate?target_plan_slug=${next.slug}`)
            .then(r => setProration(r.data))
            .catch(() => null)
        }
      }
    }).finally(() => setLoading(false))
  }, [])

  const handleUpgrade = async (slug: string) => {
    if (changing) return
    setChanging(true)
    try {
      await post('/profile/subscription/change', { plan_slug: slug })
      toast.success('План змінено!')
      window.location.reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка')
    } finally {
      setChanging(false)
    }
  }

  if (loading) return <div className="page-loader">Завантаження…</div>

  const sortedPlans      = [...plans].sort((a, b) => a.price_monthly - b.price_monthly)
  const currentPlanFull  = sortedPlans.find(p => p.id === sub?.plan?.id) ?? null
  const currentIdx       = sortedPlans.findIndex(p => p.id === sub?.plan?.id)
  const nextPlan         = sortedPlans[currentIdx + 1] ?? null
  const planColor        = PLAN_COLORS[sub?.plan?.slug ?? ''] ?? '#888'
  const nextColor        = PLAN_COLORS[nextPlan?.slug ?? ''] ?? '#888'
  const PlanIcon         = currentPlanFull ? getPlanIcon(currentPlanFull) : Zap

  const trialTotal     = sub?.plan?.trial_days ?? 7
  const trialRemaining = sub?.days_remaining ?? 0
  const trialElapsed   = trialTotal - trialRemaining
  const trialPct       = Math.max(0, Math.min(100, (trialElapsed / trialTotal) * 100))

  const includedFeatures = (currentPlanFull?.feature_list ?? []).filter(
    f => f.value === true || (typeof f.value === 'string' && f.value.length > 0)
  )

  return (
    <div className="mplan">

      {/* ── Header ── */}
      <div className="mplan__hdr">
        <button className="mplan__back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <span className="mplan__hdr-title">Мій план</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="mplan__body">

        {/* ── Current plan card ── */}
        {sub ? (
          <div className="mplan__cur" style={{ borderColor: `${planColor}40` }}>

            {/* Top: icon + name (white) + trial badge */}
            <div className="mplan__cur-top">
              <div className="mplan__cur-left">
                <PlanIcon size={20} style={{ color: planColor }} />
                <span className="mplan__cur-name">{sub.plan.name}</span>
              </div>
              {sub.is_trial && (
                <span
                  className="mplan__trial-badge"
                  style={{ color: planColor, background: `${planColor}20`, borderColor: `${planColor}50` }}
                >
                  Trial · {trialRemaining} днів
                </span>
              )}
            </div>

            <div className="mplan__divider" />

            {/* Stats 2×2 */}
            <div className="mplan__stats-grid">
              <div className="mplan__stat-cell">
                <span className="mplan__stat-label">Ціна</span>
                <span className="mplan__stat-val">
                  {sub.plan.price_monthly.toLocaleString('uk-UA')} ₴/міс
                </span>
              </div>
              <div className="mplan__stat-cell">
                <span className="mplan__stat-label">Наступне списання</span>
                <span className="mplan__stat-val">
                  {new Date(sub.current_period_end).toLocaleDateString('uk-UA', {
                    day: 'numeric', month: 'long',
                  })}
                </span>
              </div>
            </div>

            <div className="mplan__stats-grid">
              <div className="mplan__stat-cell">
                <span className="mplan__stat-label">Віджетів</span>
                <span className="mplan__stat-val">{usage.widgets} / {sub.plan.max_widgets}</span>
              </div>
              <div className="mplan__stat-cell">
                <span className="mplan__stat-label">Сайтів</span>
                <span className="mplan__stat-val">{usage.sites} / {sub.plan.max_sites}</span>
              </div>
            </div>

            {/* Trial progress bar */}
            {sub.is_trial && (
              <div className="mplan__trial-track">
                <div
                  className="mplan__trial-fill"
                  style={{ width: `${trialPct}%`, background: planColor }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="mplan__no-plan">У вас немає активного плану</div>
        )}

        {/* ── "Змінити план" ── */}
        <span className="mplan__section-title">Змінити план</span>

        {/* Plans chips row */}
        <div className="mplan__chips-row">
          {sortedPlans.map(plan => {
            const c     = PLAN_COLORS[plan.slug] ?? '#888'
            const isCur = plan.id === sub?.plan?.id
            return (
              <div
                key={plan.id}
                className={`mplan__chip ${isCur ? 'mplan__chip--cur' : ''}`}
                style={{
                  borderColor: isCur ? c : `${c}40`,
                  borderWidth:  isCur ? '1.5px' : '1px',
                  background:   isCur ? PLAN_CHIP_BG[plan.slug] ?? `${c}20` : '#1A1A1A',
                }}
              >
                {/* name: white if current, plan-color if not */}
                <span
                  className="mplan__chip-name"
                  style={{ color: isCur ? '#FFFFFF' : c }}
                >
                  {plan.name}
                </span>
                {isCur ? (
                  <>
                    <span className="mplan__chip-price" style={{ color: c }}>
                      {plan.price_monthly.toLocaleString('uk-UA')} ₴
                    </span>
                    <span className="mplan__chip-label" style={{ color: `${c}80` }}>
                      Поточний
                    </span>
                  </>
                ) : (
                  <>
                    <span className="mplan__chip-price" style={{ color: `${c}90` }}>
                      {plan.price_monthly.toLocaleString('uk-UA')} ₴
                    </span>
                    <span className="mplan__chip-label" style={{ color: `${c}70` }}>
                      {plan.max_widgets} віджетів
                    </span>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Що входить ── */}
        {currentPlanFull && (
          <div className="mplan__info-card">
            <span className="mplan__info-title">Що входить у ваш план {currentPlanFull.name}</span>
            <span className="mplan__info-bullet">
              • До {sub?.plan.max_sites} {pluralSites(sub?.plan.max_sites ?? 0)} та {sub?.plan.max_widgets} активних віджетів
            </span>
            {includedFeatures.slice(0, 4).map(f => (
              <span key={f.key} className="mplan__info-bullet">
                • {f.name}{typeof f.value === 'string' ? `: ${f.value}` : ''}
              </span>
            ))}
          </div>
        )}

        {/* ── Що зміниться ── */}
        {nextPlan && (
          <div className="mplan__changes-card">
            <span className="mplan__info-title">Що зміниться при зміні плану</span>
            <span className="mplan__changes-text">
              Апгрейд: нові ліміти вмикаються одразу, різниця рахується пропорційно.
            </span>
            <span className="mplan__changes-text">
              Даунгрейд: нові ліміти застосуються з наступного платіжного циклу.
            </span>
          </div>
        )}

        {/* ── Actions ── */}
        {sub && sub.status !== 'cancelled' && nextPlan && (
          <div className="mplan__act-section">

            {/* Upgrade button */}
            <button
              className="mplan__upgrade-btn"
              style={{ background: nextColor }}
              onClick={() => handleUpgrade(nextPlan.slug)}
              disabled={changing}
            >
              <ArrowUp size={16} />
              {changing ? 'Змінюємо…' : `Перейти на ${nextPlan.name}`}
            </button>

            {/* Proration rows (no card border — just text) */}
            {proration && (
              <div
                className="mplan__prorate"
                style={{ borderColor: `${nextColor}25`, background: `${nextColor}10` }}
              >
                <div className="mplan__prorate-row">
                  <span className="mplan__prorate-label">
                    {nextPlan.name} – {sub.plan.name} різниця
                  </span>
                  <span className="mplan__prorate-val">
                    {proration.price_difference_monthly.toLocaleString('uk-UA')} ₴/міс
                  </span>
                </div>
                <div className="mplan__prorate-row">
                  <span className="mplan__prorate-label">Залишилось у циклі</span>
                  <span className="mplan__prorate-val">
                    {proration.days_remaining} із {proration.days_total} днів ({proration.prorate_percentage}%)
                  </span>
                </div>
                <div className="mplan__prorate-row mplan__prorate-row--total">
                  <span className="mplan__prorate-due" style={{ color: nextColor }}>
                    До оплати зараз
                  </span>
                  <span className="mplan__prorate-amount" style={{ color: nextColor }}>
                    {proration.amount_due_now.toLocaleString('uk-UA')} ₴
                  </span>
                </div>
                <span className="mplan__prorate-note">
                  Далі {proration.next_billing_amount.toLocaleString('uk-UA')} ₴/міс з наступного циклу
                </span>
              </div>
            )}

            {/* Cancel */}
            <Link to="/cabinet/plan/cancel" className="mplan__cancel-btn">
              <X size={15} />
              Скасувати підписку
            </Link>
          </div>
        )}

        {/* Cancel only (when no next plan = Max plan) */}
        {sub && sub.status !== 'cancelled' && !nextPlan && (
          <Link to="/cabinet/plan/cancel" className="mplan__cancel-btn">
            <X size={15} />
            Скасувати підписку
          </Link>
        )}

      </div>
    </div>
  )
}

function pluralSites(n: number): string {
  if (n === 1) return 'сайт'
  if (n >= 2 && n <= 4) return 'сайти'
  return 'сайтів'
}
