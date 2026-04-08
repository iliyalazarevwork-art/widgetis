import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Check } from 'lucide-react'
import { get, put } from '../../api/client'
import { toast } from 'sonner'
import type { Site, SiteDetail, SiteWidget } from '../../types'
import './styles/configure.css'

export default function ConfigureWidgetPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(id ? Number(id) : null)
  const [siteDetail, setSiteDetail] = useState<SiteDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSiteSelect, setShowSiteSelect] = useState(false)

  useEffect(() => {
    get<{ data: Site[]; limits: unknown }>('/profile/sites')
      .then((res) => {
        setSites(res.data)
        if (!selectedSiteId && res.data.length > 0) {
          setSelectedSiteId(res.data[0]!.id)
        }
      })
      .finally(() => setLoading(false))
  }, [selectedSiteId])

  useEffect(() => {
    if (!selectedSiteId) return
    get<{ data: SiteDetail }>(`/profile/sites/${selectedSiteId}`)
      .then((res) => setSiteDetail(res.data))
      .catch(() => {})
  }, [selectedSiteId])

  const toggleWidget = async (widget: SiteWidget) => {
    if (!selectedSiteId) return
    setSaving(true)
    try {
      await put(`/profile/sites/${selectedSiteId}/widgets/${widget.product_id}`, {
        is_enabled: !widget.is_enabled,
      })
      setSiteDetail((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          widgets: prev.widgets.map((w) =>
            w.product_id === widget.product_id ? { ...w, is_enabled: !w.is_enabled } : w
          ),
        }
      })
      toast.success(widget.is_enabled ? 'Віджет вимкнено' : 'Віджет увімкнено')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка')
    } finally {
      setSaving(false)
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
        <div className="cfg__site-select" onClick={() => setShowSiteSelect(!showSiteSelect)}>
          <div className="cfg__site-select-left">
            <div className={`sites__status-dot sites__status-dot--${selectedSite?.status || 'pending'}`} />
            <span>{selectedSite?.domain || 'Оберіть сайт'}</span>
          </div>
          <ChevronDown size={16} />
        </div>

        {showSiteSelect && (
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

        {/* Widgets */}
        {siteDetail && (
          <>
            <h2 className="cfg__section-title">Віджети на цьому сайті</h2>
            <div className="cfg__widgets">
              {siteDetail.widgets.map((widget) => (
                <div key={widget.product_id} className="cfg__widget-card">
                  <div className="cfg__widget-top">
                    <div className="cfg__widget-info">
                      <span className="cfg__widget-icon">{widget.icon}</span>
                      <span className="cfg__widget-name">{widget.name}</span>
                    </div>
                    <button
                      className={`cfg__toggle ${widget.is_enabled ? 'cfg__toggle--on' : ''}`}
                      onClick={() => toggleWidget(widget)}
                      disabled={saving}
                    >
                      <span className="cfg__toggle-thumb" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="cfg__save-btn"
              onClick={() => { toast.success('Зміни збережено'); navigate('/cabinet/sites') }}
            >
              <Check size={18} />
              Зберегти зміни
            </button>
          </>
        )}
      </div>
    </div>
  )
}
