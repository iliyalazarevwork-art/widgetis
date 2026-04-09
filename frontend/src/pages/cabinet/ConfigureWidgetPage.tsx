import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronRight, Copy, Check, Lock } from 'lucide-react'
import { get, put } from '../../api/client'
import { toast } from 'sonner'
import type { DashboardData, Site, SiteDetail, SiteWidget, WidgetAccess } from '../../types'
import './styles/configure.css'

const PRO_PLANS = ['pro', 'max']

function canFullConfig(planSlug: string | null | undefined): boolean {
  return PRO_PLANS.includes(planSlug ?? '')
}

// Merge available product list with per-site widget states
function mergeWidgets(
  available: WidgetAccess['available'],
  siteWidgets: SiteWidget[]
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

function getDisplayConfig(widget: SiteWidget, planSlug: string | null | undefined): Record<string, unknown> {
  if (!canFullConfig(planSlug)) {
    return { enabled: widget.is_enabled }
  }
  return { enabled: widget.is_enabled, ...widget.config }
}

export default function ConfigureWidgetPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [sites, setSites] = useState<Site[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(id ? Number(id) : null)
  const [siteDetail, setSiteDetail] = useState<SiteDetail | null>(null)
  const [widgetAccess, setWidgetAccess] = useState<WidgetAccess | null>(null)
  const [planSlug, setPlanSlug] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [showSiteSelect, setShowSiteSelect] = useState(false)
  const [openConfigId, setOpenConfigId] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [copiedScript, setCopiedScript] = useState(false)

  // Initial load: sites + plan + available widgets
  useEffect(() => {
    Promise.all([
      get<{ data: Site[]; limits: unknown }>('/profile/sites'),
      get<{ data: DashboardData }>('/profile/dashboard'),
      get<WidgetAccess>('/profile/widgets'),
    ]).then(([sitesRes, dashRes, widgetsRes]) => {
      setSites(sitesRes.data)
      setPlanSlug(dashRes.data.plan?.slug ?? null)
      setWidgetAccess(widgetsRes)
      if (!selectedSiteId && sitesRes.data.length > 0) {
        setSelectedSiteId(sitesRes.data[0]!.id)
      }
    }).finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load site detail when site changes
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
              w.product_id === widget.product_id ? { ...w, is_enabled: nextEnabled } : w
            )
          : [...prev.widgets, { ...widget, is_enabled: nextEnabled }]
        return { ...prev, widgets: updated }
      })
      toast.success(nextEnabled ? 'Віджет увімкнено' : 'Віджет вимкнено')
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

  const copyConfig = async (widget: SiteWidget) => {
    const json = JSON.stringify(getDisplayConfig(widget, planSlug), null, 2)
    try {
      await navigator.clipboard.writeText(json)
      setCopiedId(widget.product_id)
      setTimeout(() => setCopiedId(null), 1500)
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
  const isPro = canFullConfig(planSlug)
  const canSelectSite = sites.length > 1

  // Merge available widgets with per-site state
  const widgets: SiteWidget[] = widgetAccess
    ? mergeWidgets(widgetAccess.available, siteDetail?.widgets ?? [])
    : []

  const locked = widgetAccess?.locked ?? []

  return (
    <div className="cfg">
      <div className="cfg__header">
        <button className="cfg__back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <div className="cfg__header-text">
          <span className="cfg__header-title">Налаштувати Віджет</span>
          {selectedSite && (
            <span className="cfg__header-domain">{selectedSite.domain}</span>
          )}
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div className="cfg__body">
        {/* Site selector */}
        <button
          type="button"
          className={`cfg__site-select ${!canSelectSite ? 'cfg__site-select--single' : ''}`}
          onClick={canSelectSite ? () => setShowSiteSelect((prev) => !prev) : undefined}
          disabled={!canSelectSite}
          aria-expanded={canSelectSite ? showSiteSelect : undefined}
          aria-label="Вибрати сайт"
        >
          <div className="cfg__site-select-left">
            <div className={`sites__status-dot sites__status-dot--${selectedSite?.status || 'pending'}`} />
            <span>{selectedSite?.domain || 'Оберіть сайт'}</span>
          </div>
          {canSelectSite && (
            <ChevronDown
              size={16}
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
                <div className={`sites__status-dot sites__status-dot--${s.status}`} />
                {s.domain}
              </button>
            ))}
          </div>
        )}

        {/* Script install block */}
        {siteDetail?.script && (
          <div className="cfg__install">
            <div className="cfg__install-header">
              <span className="cfg__install-title">Код встановлення</span>
              <span className={`cfg__install-status cfg__install-status--${siteDetail.script_installed ? 'ok' : 'pending'}`}>
                {siteDetail.script_installed ? '● Встановлено' : '● Не встановлено'}
              </span>
            </div>
            <div className="cfg__config-block">
              <button
                className="cfg__config-copy"
                onClick={() => copyScript(siteDetail.script!.script_tag)}
                title="Скопіювати"
              >
                {copiedScript
                  ? (
                    <>
                      <Check size={13} />
                      <span>Скопійовано</span>
                    </>
                  )
                  : (
                    <>
                      <Copy size={13} />
                      <span>Скопіювати</span>
                    </>
                  )}
              </button>
              <pre className="cfg__config-json">{siteDetail.script.script_tag}</pre>
            </div>
            <p className="cfg__install-hint">
              Вставте цей код перед &lt;/body&gt; у шаблоні сайту. Конфіг оновлюється автоматично — повторно вставляти не потрібно.
            </p>
          </div>
        )}

        {/* Plan badge */}
        {planSlug && (
          <div className={`cfg__plan-badge cfg__plan-badge--${planSlug}`}>
            {isPro
              ? `${planSlug.toUpperCase()} — повний конфіг доступний`
              : `${planSlug.toUpperCase()} — лише вмикання/вимикання`}
          </div>
        )}

        {/* Available widgets */}
        {widgets.length > 0 && (
          <>
            <h2 className="cfg__section-title">Доступні віджети</h2>
            <div className="cfg__widgets">
              {widgets.map((widget) => {
                const configOpen = openConfigId === widget.product_id
                const displayJson = JSON.stringify(getDisplayConfig(widget, planSlug), null, 2)

                return (
                  <div key={widget.product_id} className="cfg__widget-card">
                    <div className="cfg__widget-top">
                      <div className="cfg__widget-info">
                        <span className="cfg__widget-icon">{widget.icon}</span>
                        <span className="cfg__widget-name">{widget.name}</span>
                      </div>
                      <button
                        className={`cfg__toggle ${widget.is_enabled ? 'cfg__toggle--on' : ''}`}
                        onClick={() => toggleWidget(widget)}
                        disabled={saving === widget.product_id}
                      >
                        <span className="cfg__toggle-thumb" />
                      </button>
                    </div>

                    <div className="cfg__config-row">
                      <button
                        className="cfg__config-toggle"
                        onClick={() => setOpenConfigId(configOpen ? null : widget.product_id)}
                      >
                        {configOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        <span>Config</span>
                        {isPro && <span className="cfg__config-badge">Pro</span>}
                      </button>
                    </div>

                    {configOpen && (
                      <div className="cfg__config-block">
                        <button
                          className="cfg__config-copy"
                          onClick={() => copyConfig(widget)}
                          title="Скопіювати"
                        >
                          {copiedId === widget.product_id
                            ? (
                              <>
                                <Check size={13} />
                                <span>Скопійовано</span>
                              </>
                            )
                            : (
                              <>
                                <Copy size={13} />
                                <span>Скопіювати</span>
                              </>
                            )}
                        </button>
                        <pre className="cfg__config-json">{displayJson}</pre>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Locked widgets */}
        {locked.length > 0 && (
          <>
            <h2 className="cfg__section-title cfg__section-title--muted">
              Недоступно на вашому тарифі
            </h2>
            <div className="cfg__widgets">
              {locked.map((item) => (
                <div key={item.product_id} className="cfg__widget-card cfg__widget-card--locked">
                  <div className="cfg__widget-top">
                    <div className="cfg__widget-info">
                      <span className="cfg__widget-icon">{item.icon}</span>
                      <span className="cfg__widget-name">{item.name}</span>
                    </div>
                    <Lock size={16} className="cfg__lock-icon" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
