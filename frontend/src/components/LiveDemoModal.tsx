import { useCallback, useEffect, useRef, useState } from 'react'
import {
  X,
  Loader,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { get } from '../api/client'
import { BRAND_NAME_UPPER } from '../constants/brand'
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
  /** Pre-created session code (from POST /demo-sessions) */
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

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const widgetJsRef = useRef<string | null>(null)
  const injectedRef = useRef(false)
  const buildTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Load session ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !code) return

    // Reset state for new session
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

  // ─── Script injection ──────────────────────────────────────────────
  const injectScript = useCallback((js: string) => {
    const frame = iframeRef.current
    if (!frame) return
    const doc = frame.contentDocument || frame.contentWindow?.document
    if (!doc) return
    const prev = doc.getElementById('widgetis-injected')
    if (prev) prev.remove()
    const s = doc.createElement('script')
    s.id = 'widgetis-injected'
    s.textContent = js
    ;(doc.body || doc.documentElement).appendChild(s)
  }, [])

  // ─── Build widgets ─────────────────────────────────────────────────
  const buildWidgets = useCallback(
    (widgetIds: string[]) => {
      if (!code) return
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
          // Inject immediately if iframe is ready
          if (iframeLoaded) {
            injectScript(js)
            injectedRef.current = true
          }
        })
        .catch(() => toast.error('Помилка збірки віджетів'))
        .finally(() => setBuilding(false))
    },
    [code, iframeLoaded, injectScript],
  )

  // Build on first load when demo data arrives
  useEffect(() => {
    if (demo && enabledWidgets.size > 0 && isOpen) {
      buildWidgets([...enabledWidgets])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo])

  // Inject when iframe finishes loading
  useEffect(() => {
    if (iframeLoaded && widgetJsRef.current && !injectedRef.current) {
      injectScript(widgetJsRef.current)
      injectedRef.current = true
    }
  }, [iframeLoaded, injectScript])

  // ─── Toggle widget ─────────────────────────────────────────────────
  const handleToggle = (widgetId: string) => {
    setEnabledWidgets((prev) => {
      const next = new Set(prev)
      if (next.has(widgetId)) next.delete(widgetId)
      else next.add(widgetId)

      if (buildTimerRef.current) clearTimeout(buildTimerRef.current)
      buildTimerRef.current = setTimeout(() => {
        buildWidgets([...next])
      }, 400)

      return next
    })
  }

  // ─── Close ─────────────────────────────────────────────────────────
  const handleClose = () => {
    if (buildTimerRef.current) clearTimeout(buildTimerRef.current)
    onClose()
  }

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const moduleIds = demo ? Object.keys(demo.config.modules) : []

  return (
    <div className="demo-modal__overlay" onClick={handleClose}>
      <div className="demo-modal" onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <header className="demo-modal__header">
          <div className="demo-modal__header-left">
            <span className="demo-modal__logo">{BRAND_NAME_UPPER}</span>
            {demo && (
              <>
                <span className="demo-modal__divider" />
                <span className="demo-modal__domain">{demo.domain}</span>
              </>
            )}
          </div>
          <div className="demo-modal__header-right">
            {demo && (
              <a
                className="demo-modal__btn-icon"
                href={`https://${demo.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Відкрити сайт"
              >
                <ExternalLink size={16} />
              </a>
            )}
            <button className="demo-modal__btn-icon" onClick={handleClose} aria-label="Закрити">
              <X size={18} />
            </button>
          </div>
        </header>

        {/* ── Content ── */}
        <div className="demo-modal__content">
          {loading && (
            <div className="demo-modal__status">
              <Loader className="demo-modal__spinner" size={28} />
              <p>Завантаження демо…</p>
            </div>
          )}

          {error && (
            <div className="demo-modal__status">
              <AlertCircle size={40} strokeWidth={1.5} />
              <p>{error}</p>
            </div>
          )}

          {demo && !loading && !error && (
            <>
              {/* Widget toggles */}
              <aside className="demo-modal__panel">
                <div className="demo-modal__panel-title">
                  <span>Віджети</span>
                  {building && <Loader className="demo-modal__mini-spin" size={14} />}
                </div>
                <div className="demo-modal__widget-list">
                  {moduleIds.map((id) => {
                    const slug = id.replace('module-', '')
                    const on = enabledWidgets.has(slug)
                    return (
                      <button
                        key={id}
                        className={`demo-modal__widget-btn ${on ? 'demo-modal__widget-btn--on' : ''}`}
                        onClick={() => handleToggle(slug)}
                        type="button"
                      >
                        {on ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        <span>{moduleLabel(id)}</span>
                      </button>
                    )
                  })}
                </div>
                <a href="/pricing" className="demo-modal__cta" onClick={handleClose}>
                  Спробувати безкоштовно <ArrowRight size={14} />
                </a>
              </aside>

              {/* Site preview */}
              <div className="demo-modal__preview">
                <div className="demo-modal__browser-bar">
                  <div className="demo-modal__dots"><span /><span /><span /></div>
                  <span className="demo-modal__url">🔒 {demo.domain}</span>
                </div>
                <iframe
                  ref={iframeRef}
                  className="demo-modal__iframe"
                  src={`/site/${demo.domain}/?v=mobile`}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  onLoad={() => setIframeLoaded(true)}
                  title={`Preview of ${demo.domain}`}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
