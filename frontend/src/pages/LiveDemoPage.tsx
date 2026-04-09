import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Loader,
  AlertCircle,
  ExternalLink,
  Share2,
  ToggleLeft,
  ToggleRight,
  ArrowRight,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { get } from '../api/client'
import { BRAND_NAME_UPPER } from '../constants/brand'
import './LiveDemoPage.css'

interface DemoSessionData {
  code: string
  domain: string
  widget_ids: string[]
  config: { modules: Record<string, { config: Record<string, unknown>; i18n: Record<string, unknown> }> }
  expires_at: string
}

function moduleLabel(id: string): string {
  return id
    .replace(/^module-/, '')
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

export function LiveDemoPage() {
  const [params] = useSearchParams()
  const code = params.get('code') || ''

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
    if (!code) {
      setError('Невірне посилання: відсутній код демо.')
      setLoading(false)
      return
    }

    get<{ data: DemoSessionData }>(`/demo-sessions/${encodeURIComponent(code)}`)
      .then(({ data }) => {
        setDemo(data)
        setEnabledWidgets(new Set(data.widget_ids))
      })
      .catch(() => setError('Демо-сесію не знайдено або вона вже закінчилась.'))
      .finally(() => setLoading(false))
  }, [code])

  // ─── Script injection ──────────────────────────────────────────────
  const destroyWidgets = useCallback(() => {
    try {
      const win = iframeRef.current?.contentWindow as Record<string, unknown> | null
      if (typeof win?.__widgetality_destroy === 'function') {
        ;(win.__widgetality_destroy as () => void)()
      }
    } catch { /* cross-origin */ }
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

  const tryInject = useCallback(() => {
    if (widgetJsRef.current && iframeLoaded) {
      injectScript(widgetJsRef.current)
      injectedRef.current = true
    }
  }, [iframeLoaded, injectScript])

  // ─── Build widgets ─────────────────────────────────────────────────
  const buildWidgets = useCallback(
    (widgetIds: string[], reload: boolean) => {
      if (!code) return
      if (widgetIds.length === 0) {
        destroyWidgets()
        widgetJsRef.current = null
        return
      }
      setBuilding(true)

      fetch(
        `${(import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '')}/demo-build`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, enabled_widgets: widgetIds }),
        },
      )
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.text()
        })
        .then((js) => {
          widgetJsRef.current = js
          injectedRef.current = false
          if (reload) {
            setIframeLoaded(false)
            const frame = iframeRef.current
            if (frame) frame.src = frame.src
          } else {
            tryInject()
          }
        })
        .catch(() => toast.error('Помилка збірки віджетів'))
        .finally(() => setBuilding(false))
    },
    [code, tryInject],
  )

  // Build on first load
  useEffect(() => {
    if (demo && enabledWidgets.size > 0) {
      buildWidgets([...enabledWidgets], false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo])

  // Inject when iframe loads
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
        buildWidgets([...next], false)
      }, 400)

      return next
    })
  }

  // ─── Share ─────────────────────────────────────────────────────────
  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard
      ?.writeText(url)
      .then(() => toast.success('Посилання скопійовано'))
      .catch(() => toast.error('Не вдалося скопіювати'))
  }

  // ─── Loading / Error states ────────────────────────────────────────
  if (loading) {
    return (
      <div className="live-demo live-demo--loading">
        <Loader className="live-demo__spinner" size={32} />
        <p>Завантаження демо…</p>
      </div>
    )
  }

  if (error || !demo) {
    return (
      <div className="live-demo live-demo--error">
        <AlertCircle size={48} strokeWidth={1.5} />
        <h2>Демо недоступне</h2>
        <p>{error || 'Невідома помилка'}</p>
        <Link to="/" className="live-demo__back-btn">
          На головну <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  const moduleIds = Object.keys(demo.config.modules)

  return (
    <div className="live-demo">
      <Helmet>
        <title>{`Демо для ${demo.domain} — ${BRAND_NAME_UPPER}`}</title>
      </Helmet>

      {/* ── Top bar ── */}
      <header className="live-demo__header">
        <div className="live-demo__header-left">
          <span className="live-demo__logo">{BRAND_NAME_UPPER}</span>
          <span className="live-demo__divider" />
          <span className="live-demo__domain">{demo.domain}</span>
        </div>
        <div className="live-demo__header-right">
          <button className="live-demo__btn-icon" onClick={handleShare} title="Поділитись">
            <Share2 size={16} />
          </button>
          <a
            className="live-demo__btn-icon"
            href={`https://${demo.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Відкрити сайт"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </header>

      {/* ── Main area ── */}
      <div className="live-demo__body">
        {/* Widget toggle panel */}
        <aside className="live-demo__panel">
          <div className="live-demo__panel-header">
            <h3>Віджети</h3>
            {building && <Loader className="live-demo__mini-spinner" size={14} />}
          </div>
          <ul className="live-demo__widget-list">
            {moduleIds.map((id) => {
              const slug = id.replace('module-', '')
              const on = enabledWidgets.has(slug)
              return (
                <li key={id} className="live-demo__widget-item">
                  <button
                    className={`live-demo__widget-toggle ${on ? 'live-demo__widget-toggle--on' : ''}`}
                    onClick={() => handleToggle(slug)}
                    type="button"
                  >
                    {on ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    <span>{moduleLabel(id)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="live-demo__panel-footer">
            <div className="live-demo__expires">
              <Clock size={12} />
              <span>
                Діє до{' '}
                {new Date(demo.expires_at).toLocaleDateString('uk-UA', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <Link to="/pricing" className="live-demo__cta-btn">
              Спробувати безкоштовно
              <ArrowRight size={14} />
            </Link>
          </div>
        </aside>

        {/* Site iframe */}
        <div className="live-demo__preview">
          <div className="live-demo__browser-bar">
            <div className="live-demo__browser-dots">
              <span />
              <span />
              <span />
            </div>
            <span className="live-demo__browser-url">
              🔒 {demo.domain}
            </span>
          </div>
          <iframe
            ref={iframeRef}
            className="live-demo__iframe"
            src={`/site/${demo.domain}/?v=mobile`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={() => setIframeLoaded(true)}
            title={`Preview of ${demo.domain}`}
          />
        </div>
      </div>
    </div>
  )
}
