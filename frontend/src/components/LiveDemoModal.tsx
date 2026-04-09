import { useCallback, useEffect, useRef, useState } from 'react'
import {
  X,
  AlertCircle,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { get } from '../api/client'
import { BRAND_NAME } from '../constants/brand'
import './LiveDemoModal.css'

interface DemoSessionData {
  code: string
  domain: string
  widget_ids: string[]
  config: { modules: Record<string, { config: Record<string, unknown>; i18n: Record<string, unknown> }> }
  expires_at: string
}

interface LiveDemoModalProps {
  isOpen: boolean
  onClose: () => void
  code: string
}

function moduleLabel(id: string): string {
  return id
    .replace(/^module-/, '')
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

export function LiveDemoModal({ isOpen, onClose, code }: LiveDemoModalProps) {
  const [demo, setDemo] = useState<DemoSessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enabledWidgets, setEnabledWidgets] = useState<Set<string>>(new Set())
  const [building, setBuilding] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(true)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const widgetJsRef = useRef<string | null>(null)
  const injectedRef = useRef(false)
  const buildTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isOpen || !code) return
    setDemo(null)
    setLoading(true)
    setError(null)
    setIframeLoaded(false)
    widgetJsRef.current = null
    injectedRef.current = false

    get<{ data: DemoSessionData }>(`/demo-sessions/${encodeURIComponent(code)}`)
      .then(({ data }) => {
        setDemo(data)
        setEnabledWidgets(new Set(data.widget_ids))
      })
      .catch(() => setError('Не вдалося завантажити демо-сесію.'))
      .finally(() => setLoading(false))
  }, [isOpen, code])

  const destroyWidgets = useCallback(() => {
    try {
      const win = iframeRef.current?.contentWindow as Record<string, unknown> | null
      if (typeof win?.__widgetality_destroy === 'function') {
        ;(win.__widgetality_destroy as () => void)()
      }
    } catch {
      // cross-origin or destroyed iframe — ignore
    }
    const doc = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document
    if (doc) {
      const prev = doc.getElementById('widgetis-injected')
      if (prev) prev.remove()
    }
  }, [])

  const injectScript = useCallback((js: string) => {
    destroyWidgets()
    const frame = iframeRef.current
    if (!frame) return
    const doc = frame.contentDocument || frame.contentWindow?.document
    if (!doc) return
    const s = doc.createElement('script')
    s.id = 'widgetis-injected'
    s.textContent = js
    ;(doc.body || doc.documentElement).appendChild(s)
  }, [destroyWidgets])

  const buildWidgets = useCallback(
    (widgetIds: string[]) => {
      if (!code) return
      // If no widgets enabled — just destroy and clear
      if (widgetIds.length === 0) {
        destroyWidgets()
        widgetJsRef.current = null
        return
      }
      setBuilding(true)
      const BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '')
      fetch(`${BASE}/demo-build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, enabled_widgets: widgetIds }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.text()
        })
        .then((js) => {
          widgetJsRef.current = js
          injectedRef.current = false
          if (iframeLoaded) {
            injectScript(js)
            injectedRef.current = true
          }
        })
        .catch(() => toast.error('Помилка збірки віджетів'))
        .finally(() => setBuilding(false))
    },
    [code, iframeLoaded, injectScript, destroyWidgets],
  )

  useEffect(() => {
    if (demo && enabledWidgets.size > 0 && isOpen) {
      buildWidgets([...enabledWidgets])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo])

  useEffect(() => {
    if (iframeLoaded && widgetJsRef.current && !injectedRef.current) {
      injectScript(widgetJsRef.current)
      injectedRef.current = true
    }
  }, [iframeLoaded, injectScript])

  const handleToggle = (widgetId: string) => {
    setEnabledWidgets((prev) => {
      const next = new Set(prev)
      if (next.has(widgetId)) next.delete(widgetId)
      else next.add(widgetId)
      if (buildTimerRef.current) clearTimeout(buildTimerRef.current)
      buildTimerRef.current = setTimeout(() => buildWidgets([...next]), 400)
      return next
    })
  }

  const handleClose = () => {
    if (buildTimerRef.current) clearTimeout(buildTimerRef.current)
    onClose()
  }

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const moduleIds = demo ? Object.keys(demo.config.modules) : []
  const enabledCount = enabledWidgets.size
  const totalCount = moduleIds.length

  const widgetList = moduleIds.map((id) => {
    const slug = id.replace('module-', '')
    const on = enabledWidgets.has(slug)
    return (
      <div
        key={id}
        className={`dm-widget-item ${on ? 'dm-widget-item--active' : ''}`}
        onClick={() => handleToggle(slug)}
      >
        <div className="dm-widget-text">
          <div className="dm-widget-name">{moduleLabel(id)}</div>
        </div>
        <label className="dm-toggle" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={on} onChange={() => handleToggle(slug)} />
          <span className="dm-toggle-track" />
        </label>
      </div>
    )
  })

  /* ── Logo SVG (same as Header) ── */
  const logoSvg = (
    <svg className="dm-topbar-logo-mark" viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M 14 14 L 42 86 L 60 46 L 78 86 L 106 14" fill="none" stroke="currentColor" strokeWidth="22" strokeLinejoin="miter" strokeLinecap="round" />
    </svg>
  )

  if (loading) {
    return (
      <div className="dm-overlay">
        <div className="dm-page">
          <div className="dm-topbar">
            <div className="dm-topbar-left">
              <span className="dm-topbar-logo">{logoSvg}<span className="dm-topbar-logo-text">{BRAND_NAME}</span></span>
            </div>
            <div className="dm-topbar-right">
              <button className="dm-close-btn" onClick={handleClose} aria-label="Закрити"><X size={18} /></button>
            </div>
          </div>
          <div className="dm-center">
            <div className="dm-spinner-big" />
            <div className="dm-loading-text">Завантаження демо...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !demo) {
    return (
      <div className="dm-overlay">
        <div className="dm-page">
          <div className="dm-topbar">
            <div className="dm-topbar-left">
              <span className="dm-topbar-logo">{logoSvg}<span className="dm-topbar-logo-text">{BRAND_NAME}</span></span>
            </div>
            <div className="dm-topbar-right">
              <button className="dm-close-btn" onClick={handleClose} aria-label="Закрити"><X size={18} /></button>
            </div>
          </div>
          <div className="dm-center">
            <AlertCircle size={48} strokeWidth={1.5} />
            <div className="dm-error-title">Демо недоступне</div>
            <p className="dm-loading-text">{error || 'Невідома помилка'}</p>
            <button className="dm-close-error" onClick={handleClose}>Закрити</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dm-overlay">
      <div className="dm-page">
        {/* ── Top brand bar ── */}
        <div className="dm-topbar">
          <div className="dm-topbar-left">
            <span className="dm-topbar-logo">
              {logoSvg}
              <span className="dm-topbar-logo-text">{BRAND_NAME}</span>
            </span>
            <span className="dm-topbar-sep" />
            <span className="dm-topbar-domain">{demo.domain}</span>
          </div>
          <div className="dm-topbar-right">
            <a
              className="dm-topbar-btn"
              href={`https://${demo.domain}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={14} />
              <span>Сайт</span>
            </a>
            <button className="dm-close-btn" onClick={handleClose} aria-label="Закрити">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Main area ── */}
        <div className="dm-body">
          {/* Iframe */}
          <div className="dm-iframe-area">
            <iframe
              ref={iframeRef}
              className="dm-iframe"
              src={`/site/${demo.domain}/?v=mobile`}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              onLoad={() => setIframeLoaded(true)}
              title={`Preview of ${demo.domain}`}
            />
            {building && (
              <div className="dm-iframe-loading">
                <div className="dm-spinner-big" />
                <span>Застосовуємо віджети...</span>
              </div>
            )}
          </div>

          {/* Desktop sidebar */}
          <div className="dm-panel">
            <div className="dm-panel-status">
              <span className="dm-panel-status-dot" />
              <span>{enabledCount} з {totalCount} активно</span>
              {building && <div className="dm-building-spinner" />}
            </div>

            <div className="dm-widget-list">{widgetList}</div>

            <div className="dm-panel-footer">
              <div className="dm-panel-hint">Всі кольори та розташування налаштовуються</div>
              <Link to="/pricing" className="dm-cta-btn" onClick={handleClose}>
                <Zap size={15} />
                Замовити віджети
              </Link>
            </div>
          </div>

          {/* Mobile bottom sheet */}
          <div className="dm-mobile-wrap">
            {!mobileOpen ? (
              <div className="dm-mobile-bar" onClick={() => setMobileOpen(true)}>
                <span className="dm-mobile-bar-text">
                  {building ? 'Оновлення...' : `${enabledCount} з ${totalCount} віджетів`}
                </span>
                <ChevronUp size={20} className="dm-mobile-bar-arrow" />
              </div>
            ) : (
              <div className="dm-mobile-sheet">
                <div className="dm-mobile-sheet-handle" onClick={() => setMobileOpen(false)}>
                  <ChevronDown size={20} />
                  <span>Згорнути</span>
                </div>
                <div className="dm-mobile-sheet-list">{widgetList}</div>
                <div className="dm-panel-footer">
                  <Link to="/pricing" className="dm-cta-btn" onClick={handleClose}>
                    <Zap size={15} />
                    Замовити віджети
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
