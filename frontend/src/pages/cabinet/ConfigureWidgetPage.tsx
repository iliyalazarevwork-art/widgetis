import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Globe, ChevronDown, Check, Copy,
  Megaphone, Truck, Eye, Timer, ShoppingBag, Package,
  TrendingUp, Star, Zap, Tag, BarChart2, Bell, Heart,
  Gift, Percent, Clock, Users, MessageSquare, Award,
} from 'lucide-react'
import { get, put } from '../../api/client'
import { toast } from 'sonner'
import type { DashboardData, Site, SiteDetail, SiteWidget, WidgetAccess } from '../../types'
import './styles/configure.css'

type LucideComp = React.ComponentType<{ size?: number; color?: string }>

// Map lucide icon name (from DB) → component
const LUCIDE_ICON_MAP: Record<string, LucideComp> = {
  megaphone: Megaphone,
  truck: Truck,
  eye: Eye,
  timer: Timer,
  'shopping-bag': ShoppingBag,
  package: Package,
  'trending-up': TrendingUp,
  star: Star,
  zap: Zap,
  tag: Tag,
  'bar-chart-2': BarChart2,
  bell: Bell,
  heart: Heart,
  gift: Gift,
  percent: Percent,
  clock: Clock,
  users: Users,
  'message-square': MessageSquare,
  award: Award,
}

function getWidgetIcon(iconName: string): LucideComp {
  return LUCIDE_ICON_MAP[iconName] ?? Package
}

const CONFIG_LABELS: Record<string, string> = {
  color: 'Колір',
  position: 'Позиція',
  speed: 'Швидкість',
  delay: 'Затримка',
  text: 'Текст',
  interval: 'Інтервал',
}

function mergeWidgets(
  available: WidgetAccess['available'],
  siteWidgets: SiteWidget[],
): SiteWidget[] {
  return available.map((p) => {
    const siteW = siteWidgets.find((w) => w.product_id === p.product_id)
    return {
      product_id: p.product_id,
      slug: p.slug,
      name: p.name,
      icon: p.icon,
      is_enabled: siteW?.is_enabled ?? false,
      config: siteW?.config ?? {},
    }
  })
}

export default function ConfigureWidgetPage() {
  const { domain } = useParams()
  const navigate = useNavigate()

  const [sites, setSites] = useState<Site[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null)
  const [siteDetail, setSiteDetail] = useState<SiteDetail | null>(null)
  const [widgetAccess, setWidgetAccess] = useState<WidgetAccess | null>(null)
  const [_planSlug, setPlanSlug] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [showSiteSelect, setShowSiteSelect] = useState(false)
  const [copiedScript, setCopiedScript] = useState(false)

  useEffect(() => {
    Promise.all([
      get<{ data: Site[]; limits: unknown }>('/profile/sites'),
      get<{ data: DashboardData }>('/profile/dashboard'),
      get<WidgetAccess>('/profile/widgets'),
    ]).then(([sitesRes, dashRes, widgetsRes]) => {
      setSites(sitesRes.data)
      setPlanSlug(dashRes.data.plan?.slug ?? null)
      setWidgetAccess(widgetsRes)
      const siteFromUrl = domain ? sitesRes.data.find((s) => s.domain === domain) : null
      if (siteFromUrl) {
        setSelectedSiteId(siteFromUrl.id)
      } else if (sitesRes.data.length > 0) {
        setSelectedSiteId(sitesRes.data[0]!.id)
      }
    }).finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedSiteId) return
    get<{ data: SiteDetail }>(`/profile/sites/${selectedSiteId}`)
      .then((res) => setSiteDetail(res.data))
      .catch(() => {})
  }, [selectedSiteId])

  const toggleWidget = async (widget: SiteWidget) => {
    if (!selectedSiteId) return
    setSaving(widget.product_id)
    const nextEnabled = !widget.is_enabled
    try {
      await put(`/profile/sites/${selectedSiteId}/widgets/${widget.product_id}`, {
        config: { enabled: nextEnabled },
      })
      setSiteDetail((prev) => {
        if (!prev) return prev
        const exists = prev.widgets.some((w) => w.product_id === widget.product_id)
        const updated = exists
          ? prev.widgets.map((w) =>
              w.product_id === widget.product_id ? { ...w, is_enabled: nextEnabled } : w,
            )
          : [...prev.widgets, { ...widget, is_enabled: nextEnabled }]
        return { ...prev, widgets: updated }
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка')
    } finally {
      setSaving(null)
    }
  }

  const copyScript = async (tag: string) => {
    try {
      await navigator.clipboard.writeText(tag)
      setCopiedScript(true)
      setTimeout(() => setCopiedScript(false), 1500)
    } catch {
      toast.error('Не вдалося скопіювати')
    }
  }

  if (loading) return <div className="page-loader">Завантаження…</div>

  if (sites.length === 0) {
    return (
      <div className="cfg__empty">
        <p>Спочатку додайте сайт</p>
        <button onClick={() => navigate('/cabinet/sites/add')} className="cfg__empty-btn">
          Додати сайт
        </button>
      </div>
    )
  }

  const selectedSite = sites.find((s) => s.id === selectedSiteId)
  const canSelectSite = sites.length > 1

  const widgets: SiteWidget[] = widgetAccess
    ? mergeWidgets(widgetAccess.available, siteDetail?.widgets ?? [])
    : []
  const allEnabled = widgets.length > 0 && widgets.every((widget) => widget.is_enabled)

  const setAllWidgetsEnabled = async (nextEnabled: boolean) => {
    if (!selectedSiteId || widgets.length === 0) return

    const targets = widgets.filter((widget) => widget.is_enabled !== nextEnabled)
    if (targets.length === 0) return

    setBulkUpdating(true)
    try {
      await Promise.all(
        targets.map((widget) =>
          put(`/profile/sites/${selectedSiteId}/widgets/${widget.product_id}`, {
            config: { enabled: nextEnabled },
          }),
        ),
      )
      setSiteDetail((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          widgets: widgets.map((widget) => ({ ...widget, is_enabled: nextEnabled })),
        }
      })
      toast.success(nextEnabled ? 'Всі віджети увімкнено' : 'Всі віджети вимкнено')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка')
    } finally {
      setBulkUpdating(false)
    }
  }

  return (
    <div className="cfg">
      {/* Header */}
      <div className="cfg__header">
        <button className="cfg__back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} color="#AAAAAA" />
        </button>
        <div className="cfg__header-text">
          <span className="cfg__header-title">Налаштувати Віджет</span>
          {selectedSite && (
            <span className="cfg__header-domain">{selectedSite.domain}</span>
          )}
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Body */}
      <div className="cfg__body">
        {/* Site selector */}
        <div className="cfg__site-select">
          <button
            type="button"
            className="cfg__site-row"
            onClick={canSelectSite ? () => setShowSiteSelect((prev) => !prev) : undefined}
            disabled={!canSelectSite}
          >
            <div className="cfg__site-row-left">
              <Globe size={16} color="#3B82F6" />
              <span className="cfg__site-row-domain">{selectedSite?.domain ?? 'Оберіть сайт'}</span>
            </div>
            {canSelectSite && (
              <ChevronDown
                size={16}
                color="#555555"
                className={`cfg__site-chevron ${showSiteSelect ? 'cfg__site-chevron--open' : ''}`}
              />
            )}
          </button>

          {canSelectSite && showSiteSelect && (
            <div className="cfg__site-dropdown">
              {sites.map((s) => (
                <button
                  key={s.id}
                  className={`cfg__site-option ${s.id === selectedSiteId ? 'cfg__site-option--active' : ''}`}
                  onClick={() => { setSelectedSiteId(s.id); setShowSiteSelect(false) }}
                >
                  <Globe size={14} color={s.id === selectedSiteId ? '#3B82F6' : '#555'} />
                  {s.domain}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Script install block */}
        {siteDetail?.script && (
          <div className="cfg__install">
            <div className="cfg__install-header">
              <span className="cfg__install-title">Код встановлення</span>
              <span className={`cfg__install-status cfg__install-status--${siteDetail.script_installed ? 'ok' : 'pending'}`}>
                {siteDetail.script_installed ? '● Встановлено' : '● Не встановлено'}
              </span>
            </div>
            <div className="cfg__script-block">
              <pre className="cfg__script-code">{siteDetail.script.script_tag}</pre>
              <button
                className="cfg__script-copy"
                onClick={() => copyScript(siteDetail.script!.script_tag)}
              >
                {copiedScript ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedScript ? 'Скопійовано' : 'Скопіювати'}</span>
              </button>
            </div>
            <p className="cfg__install-hint">
              Вставте цей код перед &lt;/body&gt; у шаблоні сайту. Конфіг оновлюється автоматично.
            </p>
          </div>
        )}

        {/* Widgets section */}
        {widgets.length > 0 && (
          <>
            <div className="cfg__section-head">
              <p className="cfg__section-label">Віджети на цьому сайті</p>
              <div className="cfg__bulk">
                <span className={`cfg__bulk-text ${!allEnabled ? 'cfg__bulk-text--active' : ''}`}>OFF</span>
                <button
                  type="button"
                  className={`cfg__toggle cfg__toggle--bulk ${allEnabled ? 'cfg__toggle--on' : ''}`}
                  onClick={() => setAllWidgetsEnabled(!allEnabled)}
                  disabled={bulkUpdating || widgets.length === 0}
                  title={allEnabled ? 'Вимкнути всі віджети' : 'Увімкнути всі віджети'}
                  aria-label={allEnabled ? 'Вимкнути всі віджети' : 'Увімкнути всі віджети'}
                >
                  <span className="cfg__toggle-thumb" />
                </button>
                <span className={`cfg__bulk-text ${allEnabled ? 'cfg__bulk-text--active' : ''}`}>ON</span>
              </div>
            </div>
            <div className="cfg__widgets">
              {widgets.map((widget) => {
                const Icon = getWidgetIcon(widget.icon)
                const configEntries = Object.entries(widget.config).filter(
                  ([k]) => k !== 'enabled' && CONFIG_LABELS[k],
                )

                return (
                  <div key={widget.product_id} className={`cfg__wcard ${widget.is_enabled ? 'cfg__wcard--on' : ''}`}>
                    {/* Top row */}
                    <div className="cfg__wcard-top">
                      <div className="cfg__wcard-left">
                        <div className="cfg__wico">
                          <Icon size={15} color="#3B82F6" />
                        </div>
                        <div className="cfg__winfo">
                          <span className="cfg__wname">{widget.name}</span>
                          <span className={`cfg__wstatus ${widget.is_enabled ? 'cfg__wstatus--on' : ''}`}>
                            {widget.is_enabled ? 'Активний' : 'Вимкнений'}
                          </span>
                        </div>
                      </div>
                      <button
                        className={`cfg__toggle ${widget.is_enabled ? 'cfg__toggle--on' : ''}`}
                        onClick={() => toggleWidget(widget)}
                        disabled={saving === widget.product_id || bulkUpdating}
                      >
                        <span className="cfg__toggle-thumb" />
                      </button>
                    </div>

                    {/* Expanded options (only when enabled and has config) */}
                    {widget.is_enabled && configEntries.length > 0 && (
                      <>
                        <div className="cfg__wdivider" />
                        <div className="cfg__wopts">
                          {configEntries.map(([key, val]) => (
                            <div key={key} className="cfg__wopt">
                              <span className="cfg__wopt-label">{CONFIG_LABELS[key] ?? key}</span>
                              {key === 'color' && typeof val === 'string' ? (
                                <div className="cfg__wopt-color">
                                  <span className="cfg__wopt-swatch" style={{ background: val }} />
                                  <span className="cfg__wopt-val">{val}</span>
                                </div>
                              ) : (
                                <span className="cfg__wopt-val">{String(val)}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
