import { useState, useEffect, useRef } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  ArrowLeft,
  Code,
  Eye,
  Copy,
  Check,
  Plus,
  Trash2,
  Play,
  Loader,
  Globe,
} from 'lucide-react'
import { toast } from 'sonner'
import { get, post, put } from '../../api/client'
import { ADMIN_BOTTOM_TABS } from './adminBottomTabs'
import './configurator-mobile.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModuleSchema {
  config: Record<string, unknown>
  i18n: Record<string, unknown>
  defaultConfig: Record<string, unknown>
  defaultI18n: Record<string, unknown>
}

type ModuleSchemas = Record<string, ModuleSchema>

interface ModuleState {
  config: Record<string, unknown>
  i18n: Record<string, unknown>
}

type JsonPanelMode = 'export' | 'import'

const HIDDEN_CONFIG_FIELDS: Record<string, string[]> = {
  'module-cart-recommender': ['apiBaseUrl', 'mountSelector'],
  'module-sms-otp-checkout': ['apiBaseUrl', 'siteKey'],
}

const OMITTED_CONFIG_FIELDS_ON_SUBMIT: Record<string, string[]> = {
  'module-cart-recommender': ['apiBaseUrl', 'mountSelector'],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deepSet(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const keys = path.split('.')
  const result = { ...obj }
  let cur: Record<string, unknown> = result
  for (let i = 0; i < keys.length - 1; i++) {
    cur[keys[i]] = { ...(cur[keys[i]] as Record<string, unknown> || {}) }
    cur = cur[keys[i]] as Record<string, unknown>
  }
  cur[keys[keys.length - 1]] = value
  return result
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

function sanitizeConfigForSubmit(moduleId: string, config: Record<string, unknown>): Record<string, unknown> {
  const omittedFields = OMITTED_CONFIG_FIELDS_ON_SUBMIT[moduleId] ?? []
  if (omittedFields.length === 0) {
    return deepClone(config)
  }

  const next = deepClone(config)
  for (const field of omittedFields) {
    delete next[field]
  }
  return next
}

function moduleLabel(id: string): string {
  return id.replace(/^module-/, '').split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
}

function looksLikeColor(v: unknown): boolean {
  if (typeof v !== 'string' || !v) return false
  return /^#[0-9a-fA-F]{3,8}$/.test(v)
}

// ─── Persistence ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'widgetis-configurator-state'

interface SavedState {
  moduleStates: Record<string, ModuleState>
  activeModule: string
  previewUrl: string
}

function loadSaved(key: string): SavedState | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveToStorage(key: string, moduleStates: Record<string, ModuleState>, activeModule: string, previewUrl: string) {
  try {
    localStorage.setItem(key, JSON.stringify({ moduleStates, activeModule, previewUrl }))
  } catch { /* quota */ }
}

// ─── Site context (for site-specific configurator) ─────────────────────────────

export interface SiteContext {
  id: number
  domain: string
  deployedScriptUrl?: string | null
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AdminConfiguratorPage({ siteContext }: { siteContext?: SiteContext } = {}) {
  const [schemas, setSchemas] = useState<ModuleSchemas | null>(null)
  const [moduleIds, setModuleIds] = useState<string[]>([])
  const [moduleStates, setModuleStates] = useState<Record<string, ModuleState>>({})
  const [activeModule, setActiveModule] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Per-site mode reads/writes site_widgets through the API; only the global
  // playground (no siteContext) uses localStorage as a sandbox.
  const storageKey = STORAGE_KEY
  const isSiteMode = !!siteContext

  const [slugToProductId, setSlugToProductId] = useState<Record<string, number>>({})
  const [savingActive, setSavingActive] = useState(false)
  const [deployingAll, setDeployingAll] = useState(false)

  const [building, setBuilding] = useState(false)
  const [builtJs, setBuiltJs] = useState<string | null>(null)
  const [buildError, setBuildError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [obfuscate, setObfuscate] = useState(true)
  const [creatingDemo, setCreatingDemo] = useState(false)
  const [demoLink, setDemoLink] = useState<string | null>(null)
  const [demoLinkCopied, setDemoLinkCopied] = useState(false)
  const [deployedUrl] = useState<string | null>(siteContext?.deployedScriptUrl ?? null)
  const [snippetCopied, setSnippetCopied] = useState(false)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [previewDemoCode, setPreviewDemoCode] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewLoaded, setPreviewLoaded] = useState(false)
  const [jsonPanelMode, setJsonPanelMode] = useState<JsonPanelMode | null>(null)
  const [jsonText, setJsonText] = useState('')

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const pendingLoadRef = useRef(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef(0)
  const dragStartH = useRef(0)
  const [sheetHeight, setSheetHeight] = useState(55) // % of viewport

  // ─── Boot: load schemas from widget-builder ────────────────────────

  useEffect(() => {
    async function boot() {
      try {
        const res = await get<{ data: ModuleSchemas }>('/admin/widget-builder/modules')
        const data = res.data
        setSchemas(data)

        const ids = Object.keys(data).sort()
        setModuleIds(ids)

        // Per-site mode: hydrate from site_widgets (DB is the source of truth).
        // Global mode: hydrate from localStorage sandbox.
        const siteWidgetState: Record<string, { is_enabled: boolean; config: Record<string, unknown>; i18n: Record<string, unknown> }> = {}
        let slugMap: Record<string, number> = {}

        if (siteContext) {
          type SiteResp = {
            data: {
              widgets: Array<{ product_id: number; slug: string | null; is_enabled: boolean; config: unknown }>
              products: Array<{ id: number; slug: string }>
            }
          }
          const site = await get<SiteResp>(`/admin/sites/${siteContext.id}`)
          slugMap = Object.fromEntries(site.data.products.map(p => [p.slug, p.id]))
          for (const w of site.data.widgets) {
            if (!w.slug) continue
            const moduleKey = `module-${w.slug}`
            const stored = (w.config && typeof w.config === 'object') ? (w.config as Record<string, unknown>) : {}
            const cfg = (stored.config && typeof stored.config === 'object') ? (stored.config as Record<string, unknown>) : {}
            const i18n = (stored.i18n && typeof stored.i18n === 'object') ? (stored.i18n as Record<string, unknown>) : {}
            siteWidgetState[moduleKey] = { is_enabled: w.is_enabled, config: cfg, i18n }
          }
        }
        setSlugToProductId(slugMap)

        const saved = isSiteMode ? null : loadSaved(storageKey)
        const states: Record<string, ModuleState> = {}
        for (const id of ids) {
          if (siteWidgetState[id]) {
            // DB row exists — merge with widget-builder defaults so newly-added schema keys still appear
            const db = siteWidgetState[id]
            states[id] = {
              config: { ...deepClone(data[id].defaultConfig), ...db.config, enabled: db.is_enabled },
              i18n: Object.keys(db.i18n).length > 0 ? db.i18n : deepClone(data[id].defaultI18n),
            }
          } else if (saved?.moduleStates?.[id]) {
            states[id] = saved.moduleStates[id]
          } else {
            states[id] = {
              config: { ...deepClone(data[id].defaultConfig), enabled: false },
              i18n: deepClone(data[id].defaultI18n),
            }
          }
        }
        setModuleStates(states)

        const active = (saved?.activeModule && ids.includes(saved.activeModule)) ? saved.activeModule : ids[0] ?? ''
        setActiveModule(active)

        const fallbackUrl = siteContext ? `https://${siteContext.domain}` : ''
        setPreviewUrl(saved?.previewUrl || fallbackUrl)
      } catch (err) {
        setLoadError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    boot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist on change — sandbox only; per-site mode writes via Save button.
  useEffect(() => {
    if (!isSiteMode && moduleIds.length > 0) {
      saveToStorage(storageKey, moduleStates, activeModule, previewUrl)
    }
  }, [moduleStates, activeModule, previewUrl, moduleIds, storageKey, isSiteMode])

  // ─── Convenience ───────────────────────────────────────────────────

  const config = moduleStates[activeModule]?.config ?? {}
  const i18n = moduleStates[activeModule]?.i18n ?? {}
  const isEnabled = (config.enabled ?? true) as boolean
  const allModulesEnabled = moduleIds.length > 0 && moduleIds.every((id) => Boolean(moduleStates[id]?.config?.enabled))
  const allModulesDisabled = moduleIds.length > 0 && moduleIds.every((id) => !moduleStates[id]?.config?.enabled)

  function updateConfig(path: string, value: unknown) {
    setModuleStates(prev => ({
      ...prev,
      [activeModule]: { ...prev[activeModule], config: deepSet(prev[activeModule].config, path, value) },
    }))
  }

  function updateI18nDirect(newI18n: Record<string, unknown>) {
    setModuleStates(prev => ({
      ...prev,
      [activeModule]: { ...prev[activeModule], i18n: newI18n },
    }))
  }

  function setI18nValue(path: string, value: unknown) {
    setModuleStates(prev => ({
      ...prev,
      [activeModule]: { ...prev[activeModule], i18n: deepSet(prev[activeModule].i18n, path, value) },
    }))
  }

  function setAllModulesEnabled(enabled: boolean) {
    setModuleStates((prev) => {
      const next: Record<string, ModuleState> = { ...prev }
      for (const id of moduleIds) {
        const state = prev[id]
        if (!state) continue
        next[id] = {
          ...state,
          config: {
            ...state.config,
            enabled,
          },
        }
      }
      return next
    })
  }

  // ─── Build ─────────────────────────────────────────────────────────

  function getBuildRequest() {
    const modules: Record<string, { config: Record<string, unknown>; i18n: Record<string, unknown> }> = {}
    for (const id of moduleIds) {
      const st = moduleStates[id]
      if (!st) continue
      modules[id] = { config: sanitizeConfigForSubmit(id, st.config), i18n: deepClone(st.i18n) }
    }
    return { modules, obfuscate }
  }

  async function buildWidget() {
    setBuildError(null)
    setBuilding(true)
    try {
      const res = await post<{ data: { js: string; size: number } }>(
        '/admin/widget-builder/build',
        getBuildRequest(),
      )
      const js = res.data.js
      setBuiltJs(js)
        try { await navigator.clipboard.writeText(js) } catch { /* */ }
      toast.success(`Збудовано! ${Math.round(js.length / 1024)} KB`)
    } catch (err) {
      const msg = (err as Error).message || 'Помилка build'
      setBuildError(msg)
      toast.error(msg)
    } finally {
      setBuilding(false)
    }
  }

  // ─── Preview ───────────────────────────────────────────────────────

  function loadPreview(demoCode?: string | null) {
    if (!previewUrl.trim()) { toast.error('Введіть URL сайту'); return }
    try {
      const nextDemoCode = demoCode ?? previewDemoCode
      const raw = previewUrl.includes('://') ? previewUrl : `https://${previewUrl}`
      const parsed = new URL(raw)
      const previewBase = (import.meta.env.VITE_PREVIEW_BASE_URL as string | undefined ?? '').replace(/\/+$/, '')
      const landingPath = `${parsed.pathname || '/'}${parsed.search}`
      const frameUrl = new URL(`${previewBase}/site/${parsed.host}${landingPath}`)
      frameUrl.searchParams.set('v', 'mobile')
      if (nextDemoCode) {
        frameUrl.searchParams.set('demo_code', nextDemoCode)
      }

      setPreviewLoading(true)
      setPreviewLoaded(false)
      const frame = iframeRef.current
      if (!frame) return
      frame.src = frameUrl.toString()
      frame.onload = () => {
        setPreviewLoading(false)
        setPreviewLoaded(true)
      }
      frame.onerror = () => {
        setPreviewLoading(false)
        setPreviewLoaded(false)
        toast.error('Не вдалося завантажити')
      }
    } catch {
      toast.error('Невірний URL')
    }
  }

  // Load preview after sheet opens (fixes race condition)
  useEffect(() => {
    if (previewOpen && pendingLoadRef.current && iframeRef.current) {
      pendingLoadRef.current = false
      loadPreview()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewOpen])

  async function applyPreviewConfig() {
    if (!previewUrl.trim()) { toast.error('Введіть URL сайту'); return }
    if (!previewLoaded) { toast.error('Спочатку завантажте сайт'); return }

    try {
      const raw = previewUrl.includes('://') ? previewUrl : `https://${previewUrl}`
      const parsed = new URL(raw)
      const landingPath = `${parsed.pathname || '/'}${parsed.search}`
      const modules: Record<string, {
        is_enabled: boolean
        config: Record<string, unknown>
        i18n: Record<string, unknown>
      }> = {}

      for (const id of moduleIds) {
        const st = moduleStates[id]
        if (!st) continue
        modules[id] = {
          is_enabled: Boolean(st.config?.enabled),
          config: sanitizeConfigForSubmit(id, st.config),
          i18n: deepClone(st.i18n),
        }
      }

      const res = await post<{ data: { code: string } }>('/admin/demo-sessions', {
        domain: parsed.host,
        landing_path: landingPath,
        config: { modules },
      })

      const code = res.data.code
      setPreviewDemoCode(code)
      loadPreview(code)
      toast.success('Скрипт застосовано')
    } catch (err) {
      toast.error((err as Error).message || 'Помилка застосування')
    }
  }

  // ─── Create demo link ──────────────────────────────────────────────

  async function createDemoLink() {
    if (!previewUrl.trim()) { toast.error('Введіть URL сайту'); return }
    setCreatingDemo(true)
    try {
      const domain = previewUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
      const modules: Record<string, {
        is_enabled: boolean
        config: Record<string, unknown>
        i18n: Record<string, unknown>
      }> = {}
      for (const id of moduleIds) {
        const st = moduleStates[id]
        if (!st) continue
        modules[id] = {
          is_enabled: Boolean(st.config?.enabled),
          config: sanitizeConfigForSubmit(id, st.config),
          i18n: deepClone(st.i18n),
        }
      }

      const BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '')
      const token = localStorage.getItem('wty_token')
      const res = await fetch(`${BASE}/admin/demo-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ domain, config: { modules } }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}`)
      }

      const json = await res.json() as { data: { link: string; code: string } }
      setDemoLink(json.data.link)
      await navigator.clipboard.writeText(json.data.link).catch(() => {})
      toast.success(`Демо створено! Код: ${json.data.code}`)
    } catch (err) {
      toast.error((err as Error).message || 'Помилка створення демо')
    } finally {
      setCreatingDemo(false)
    }
  }

  // ─── Sheet drag ────────────────────────────────────────────────────

  function onSheetTouchStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0].clientY
    dragStartH.current = sheetHeight
    const sheet = sheetRef.current
    if (sheet) sheet.style.transition = 'none'
  }

  function onSheetTouchMove(e: React.TouchEvent) {
    const dy = dragStartY.current - e.touches[0].clientY
    const dvh = (dy / window.innerHeight) * 100
    const next = Math.min(98, Math.max(30, dragStartH.current + dvh))
    setSheetHeight(next)
  }

  function onSheetTouchEnd() {
    const sheet = sheetRef.current
    if (sheet) sheet.style.transition = ''
    // Snap: <40% → 55%, >75% → 98%, else keep
    if (sheetHeight < 40) setSheetHeight(55)
    else if (sheetHeight > 75) setSheetHeight(98)
  }

  // ─── Export / Import ───────────────────────────────────────────────

  function exportConfig() {
    setJsonPanelMode('export')
    setJsonText(JSON.stringify({ moduleStates }, null, 2))
  }

  function openImportPanel() {
    setJsonPanelMode('import')
    setJsonText('')
  }

  function closeJsonPanel() {
    setJsonPanelMode(null)
  }

  async function copyJsonText() {
    if (!jsonText.trim()) {
      toast.error('JSON порожній')
      return
    }
    try {
      await navigator.clipboard.writeText(jsonText)
      toast.success('JSON скопійовано')
    } catch {
      toast.error('Не вдалося скопіювати')
    }
  }

  function applyImportFromText() {
    try {
      const data = JSON.parse(jsonText)
      if (!data.moduleStates || typeof data.moduleStates !== 'object') {
        toast.error('Невірний формат')
        return
      }
      setModuleStates((prev) => {
        const next = { ...prev }
        for (const id of moduleIds) {
          if (data.moduleStates[id]) next[id] = data.moduleStates[id]
        }
        return next
      })
        toast.success('Імпортовано!')
      closeJsonPanel()
    } catch (err) {
      toast.error('Помилка: ' + (err as Error).message)
    }
  }

  function hardReset() {
    if (!schemas) return
    const fresh: Record<string, ModuleState> = {}
    for (const id of moduleIds) {
      fresh[id] = { config: deepClone(schemas[id].defaultConfig), i18n: deepClone(schemas[id].defaultI18n) }
    }
    setModuleStates(fresh)
    setBuiltJs(null)
    setBuildError(null)
    localStorage.removeItem(storageKey)
    toast.success('Скинуто')
  }

  async function copyBuiltScript() {
    if (!builtJs) { toast.error('Спочатку зберіть скрипт'); return }
    try {
      await navigator.clipboard.writeText(builtJs)
      setCopied(true)
      toast.success('Скопійовано')
      setTimeout(() => setCopied(false), 2500)
    } catch { toast.error('Не вдалося скопіювати') }
  }

  // ─── Deploy to R2 ─────────────────────────────────────────────────

  async function saveActiveModule() {
    if (!siteContext || !activeModule) return
    const slug = activeModule.replace(/^module-/, '')
    const productId = slugToProductId[slug]
    if (!productId) {
      toast.error(`У каталозі немає продукту з slug "${slug}"`)
      return
    }
    const st = moduleStates[activeModule]
    if (!st) return
    const { enabled, ...configWithoutEnabled } = st.config as Record<string, unknown> & { enabled?: unknown }
    const sanitizedConfig = sanitizeConfigForSubmit(activeModule, configWithoutEnabled)
    setSavingActive(true)
    try {
      await put(`/admin/sites/${siteContext.id}/widgets/${productId}`, {
        is_enabled: Boolean(enabled),
        config: { config: sanitizedConfig, i18n: st.i18n },
      })
      toast.success('Збережено. Скрипт пересобирається.')
    } catch (err) {
      toast.error((err as Error).message || 'Помилка збереження')
    } finally {
      setSavingActive(false)
    }
  }

  async function deployAll() {
    if (!siteContext) return
    const widgets = Object.entries(moduleStates)
      .map(([moduleId, st]) => {
        const slug = moduleId.replace(/^module-/, '')
        const productId = slugToProductId[slug]
        if (!productId) return null
        const { enabled, ...configWithoutEnabled } = st.config as Record<string, unknown> & { enabled?: unknown }
        return {
          product_id: productId,
          is_enabled: Boolean(enabled),
          config: { config: sanitizeConfigForSubmit(moduleId, configWithoutEnabled), i18n: st.i18n },
        }
      })
      .filter(Boolean)
    if (widgets.length === 0) {
      toast.error('Немає модулів для деплою')
      return
    }
    setDeployingAll(true)
    try {
      await post(`/admin/sites/${siteContext.id}/widgets/batch`, { widgets })
      toast.success(`Задеплоєно ${widgets.length} модулів. Скрипт пересобирається.`)
    } catch (err) {
      toast.error((err as Error).message || 'Помилка деплою')
    } finally {
      setDeployingAll(false)
    }
  }

  async function copySnippet() {
    if (!deployedUrl) return
    const snippet = `<script src="${deployedUrl}"></script>`
    try {
      await navigator.clipboard.writeText(snippet)
      setSnippetCopied(true)
      toast.success('Тег скопійовано')
      setTimeout(() => setSnippetCopied(false), 2500)
    } catch { toast.error('Не вдалося скопіювати') }
  }

  // ─── Render ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="cfg-m">
        <div className="cfg-m__loader">
          <Loader size={22} strokeWidth={2} className="cfg-m__spin" />
          <span>Завантаження модулів...</span>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="cfg-m">
        <div className="cfg-m__loader" style={{ color: '#f87171' }}>
          Помилка: {loadError}
          <button type="button" onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '8px 16px', background: '#3B82F6', color: '#fff', border: 0, borderRadius: 8, cursor: 'pointer' }}>
            Перезавантажити
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="cfg-m">
      {/* Topbar */}
      <header className="cfg-m__topbar">
        <Link to={siteContext ? `/admin/sites/${siteContext.domain}` : '/admin'} className="cfg-m__back" aria-label="Назад">
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <div className="cfg-m__topbar-title">
          <strong>{siteContext ? siteContext.domain : 'Конфігуратор'}</strong>
          <span>{siteContext ? 'Конфігуратор сайту' : 'Налаштування віджетів'}</span>
        </div>
        <div className="cfg-m__avatar" aria-hidden="true">ІЛ</div>
      </header>

      <main className="cfg-m__body">
        <div className="cfg-m__desktop-actions">
          <button
            type="button"
            className="cfg-m__desktop-preview-btn"
            onClick={() => setPreviewOpen(true)}
            disabled={building}
          >
            <Eye size={16} strokeWidth={2} />
            <span>Превью</span>
          </button>
        </div>

        {/* Deployed script URL banner */}
        {siteContext && deployedUrl && (
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: '#6ee7b7', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Задеплоєний скрипт
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <code style={{ fontSize: 11, color: '#a7f3d0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {deployedUrl}
              </code>
              <button
                type="button"
                style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: '#6ee7b7', padding: 4 }}
                onClick={async () => { await navigator.clipboard.writeText(deployedUrl); toast.success('URL скопійовано') }}
              >
                <Copy size={13} strokeWidth={2} />
              </button>
            </div>
            <div style={{ fontSize: 11, color: '#6ee7b7', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Код для вставки в сайт
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <code style={{ fontSize: 11, color: '#a7f3d0', flex: 1, padding: '6px 8px', background: 'rgba(0,0,0,0.25)', borderRadius: 6, wordBreak: 'break-all' }}>
                {`<script src="${deployedUrl}"></script>`}
              </code>
              <button
                type="button"
                style={{ flexShrink: 0, background: snippetCopied ? 'rgba(16,185,129,0.3)' : 'none', border: 'none', cursor: 'pointer', color: '#6ee7b7', padding: 4, borderRadius: 4 }}
                onClick={copySnippet}
                title="Копіювати тег <script>"
              >
                {snippetCopied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2} />}
              </button>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="cfg-m__qa">
          <div className="cfg-m__qa-row">
            <button type="button" className="cfg-m__qa-btn cfg-m__qa-btn--teal" onClick={exportConfig}>Експорт</button>
            <button type="button" className="cfg-m__qa-btn cfg-m__qa-btn--indigo" onClick={openImportPanel}>Імпорт</button>
          </div>
          <div className="cfg-m__qa-row">
            <button type="button" className="cfg-m__qa-btn cfg-m__qa-btn--dteal" onClick={() => buildWidget()} disabled={building}>
              {building ? 'Збірка...' : 'Швидко'}
            </button>
            <button type="button" className="cfg-m__qa-btn cfg-m__qa-btn--red" onClick={hardReset}>Hard Reset</button>
          </div>
        </div>

        {/* Module card */}
        <div className="cfg-m__card">
          <div className="cfg-m__card-head">
            <span className="cfg-m__badge-num">1</span>
            <span className="cfg-m__card-title">Модулі</span>
          </div>
          <div className="cfg-m__pills-row">
            {moduleIds.map((id) => {
              const st = moduleStates[id]
              const enabled = (st?.config?.enabled ?? false) as boolean
              const isActive = activeModule === id
              return (
                <button key={id} type="button" onClick={() => setActiveModule(id)}
                  className={`cfg-m__pill ${isActive ? 'cfg-m__pill--active' : ''}`}>
                  <span className={`cfg-m__pill-dot cfg-m__pill-dot--${enabled ? 'green' : 'grey'}`} />
                  {moduleLabel(id)}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => setAllModulesEnabled(true)}
              disabled={allModulesEnabled}
              style={{
                flex: 1,
                minHeight: 36,
                borderRadius: 10,
                border: '1px solid rgba(16,185,129,0.3)',
                background: allModulesEnabled ? 'rgba(31,41,55,0.6)' : 'rgba(16,185,129,0.14)',
                color: allModulesEnabled ? '#9ca3af' : '#6ee7b7',
                fontSize: 13,
                fontWeight: 600,
                cursor: allModulesEnabled ? 'not-allowed' : 'pointer',
                opacity: allModulesEnabled ? 0.7 : 1,
              }}
            >
              Увімкнути всі
            </button>
            <button
              type="button"
              onClick={() => setAllModulesEnabled(false)}
              disabled={allModulesDisabled}
              style={{
                flex: 1,
                minHeight: 36,
                borderRadius: 10,
                border: '1px solid rgba(248,113,113,0.3)',
                background: allModulesDisabled ? 'rgba(31,41,55,0.6)' : 'rgba(248,113,113,0.12)',
                color: allModulesDisabled ? '#9ca3af' : '#fca5a5',
                fontSize: 13,
                fontWeight: 600,
                cursor: allModulesDisabled ? 'not-allowed' : 'pointer',
                opacity: allModulesDisabled ? 0.7 : 1,
              }}
            >
              Вимкнути всі
            </button>
          </div>
          <div className="cfg-m__divider" />
          <div className="cfg-m__toggle-row">
            <span>Увімкнено</span>
            <button type="button" role="switch" aria-checked={isEnabled}
              className={`cfg-m__toggle ${isEnabled ? 'cfg-m__toggle--on' : ''}`}
              onClick={() => updateConfig('enabled', !isEnabled)}>
              <span className="cfg-m__toggle-thumb" />
            </button>
          </div>
        </div>

        {/* Settings card */}
        <div className="cfg-m__card cfg-m__card--blue">
          <div className="cfg-m__scard-head">
            <Code size={15} strokeWidth={2} className="cfg-m__scard-icon" />
            <span>{moduleLabel(activeModule)} — налаштування</span>
          </div>
          <GenericConfigForm
            moduleId={activeModule}
            config={config}
            schema={schemas?.[activeModule]?.config}
            onChange={updateConfig}
          />
          <div className="cfg-m__divider" style={{ margin: '10px -14px' }} />
          <div className="cfg-m__scard-head" style={{ marginTop: 4 }}>
            <Globe size={15} strokeWidth={2} className="cfg-m__scard-icon" />
            <span>Переклади (i18n)</span>
          </div>
          <GenericI18nForm i18n={i18n} schema={schemas?.[activeModule]?.i18n} onChange={setI18nValue} onReplace={updateI18nDirect} />
        </div>

        {/* Actions */}
        <div className="cfg-m__actions">
          <div className="cfg-m__toggle-row" style={{ marginBottom: 4 }}>
            <span>Обфускація</span>
            <ToggleButton checked={obfuscate} onChange={setObfuscate} />
          </div>
          <button type="button" className="cfg-m__action-build" onClick={() => buildWidget()} disabled={building}>
            {building ? <Loader size={15} strokeWidth={2} className="cfg-m__spin" /> : <Code size={15} strokeWidth={2} />}
            {building ? 'Збірка...' : 'Зібрати скрипт'}
          </button>
          <div className="cfg-m__action-row">
            <button type="button" className="cfg-m__action-copy" onClick={copyBuiltScript}>
              {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2} />}
              {copied ? 'Скопійовано' : 'Копіювати'}
            </button>
          </div>
          <button type="button" className="cfg-m__action-demo" onClick={createDemoLink} disabled={creatingDemo}>
            {creatingDemo ? <Loader size={13} strokeWidth={2} className="cfg-m__spin" /> : <Play size={13} strokeWidth={2} />}
            {creatingDemo ? 'Створення...' : 'Демо-посилання'}
          </button>
          {demoLink && (
            <div className="cfg-m__demo-link-banner">
              <a href={demoLink} target="_blank" rel="noopener noreferrer" title={demoLink}>{demoLink}</a>
              <button
                type="button"
                aria-label="Копіювати демо-посилання"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(demoLink)
                    setDemoLinkCopied(true)
                    toast.success('Посилання скопійовано')
                    setTimeout(() => setDemoLinkCopied(false), 1500)
                  } catch {
                    toast.error('Не вдалося скопіювати')
                  }
                }}
              >
                {demoLinkCopied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} strokeWidth={2} />}
              </button>
            </div>
          )}
          {siteContext && (
            <>
              <button
                type="button"
                className="cfg-m__action-build"
                style={{
                  background: savingActive ? '#374151' : 'linear-gradient(135deg, #16a34a 0%, #0369a1 100%)',
                  marginTop: 6,
                  opacity: savingActive ? 0.5 : 1,
                  cursor: savingActive ? 'not-allowed' : 'pointer',
                }}
                onClick={saveActiveModule}
                disabled={savingActive || !activeModule}
              >
                {savingActive ? <Loader size={15} strokeWidth={2} className="cfg-m__spin" /> : <Check size={15} strokeWidth={2} />}
                {savingActive ? 'Збереження...' : `Зберегти ${moduleLabel(activeModule)}`}
              </button>
              <button
                type="button"
                className="cfg-m__action-build"
                style={{
                  background: deployingAll ? '#374151' : 'linear-gradient(135deg, #7c3aed 0%, #0369a1 100%)',
                  marginTop: 6,
                  opacity: deployingAll ? 0.5 : 1,
                  cursor: deployingAll ? 'not-allowed' : 'pointer',
                }}
                onClick={deployAll}
                disabled={deployingAll}
              >
                {deployingAll ? <Loader size={15} strokeWidth={2} className="cfg-m__spin" /> : <Check size={15} strokeWidth={2} />}
                {deployingAll ? 'Деплой...' : 'Задеплоїти всі'}
              </button>
            </>
          )}
          {buildError && <div className="cfg-m__build-error">Помилка: {buildError}</div>}
        </div>

        {/* Result card */}
        <div className="cfg-m__card">
          <div className="cfg-m__card-head">
            <span className="cfg-m__badge-num cfg-m__badge-num--green">2</span>
            <span className="cfg-m__card-title">Результат</span>
          </div>
          {copied && <div className="cfg-m__copied-banner"><Check size={13} strokeWidth={2.5} /> Скопійовано!</div>}
          {builtJs && (
            <div className="cfg-m__copied-banner">
              <Check size={13} strokeWidth={2.5} />
              Збірка успішна! Скрипт скопійовано в буфер.
            </div>
          )}
          <div className="cfg-m__code">
            {builtJs ? (
              <pre className="cfg-m__code-js">{builtJs}</pre>
            ) : (
              <span className="cfg-m__code-placeholder">Тут з&#39;явиться згенерований JavaScript...</span>
            )}
          </div>
          <button type="button" className="cfg-m__copy-res" onClick={copyBuiltScript}>
            <Copy size={13} strokeWidth={2} /> Копіювати скрипт
          </button>
        </div>
      </main>

      {/* FAB */}
      <button type="button" className="cfg-m__fab" onClick={() => setPreviewOpen(true)} disabled={building}>
        <Eye size={18} strokeWidth={2} /> Превью
      </button>

      {/* Bottom nav */}
      <nav className="cfg-m__nav">
        {ADMIN_BOTTOM_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              ['cfg-m__tab', isActive ? 'cfg-m__tab--active' : ''].filter(Boolean).join(' ')
            }
          >
            <tab.icon size={20} strokeWidth={2} />
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Preview overlay */}
      {previewOpen && <div className="cfg-m__overlay" role="presentation" onClick={() => setPreviewOpen(false)} />}

      {/* Preview sheet — always mounted so iframe persists */}
      <div className={`cfg-m__sheet ${previewOpen ? 'cfg-m__sheet--open' : ''}`} ref={sheetRef}
        style={previewOpen ? { height: `${sheetHeight}dvh` } : undefined}>
        <div className="cfg-m__sheet-handle"
          onTouchStart={onSheetTouchStart}
          onTouchMove={onSheetTouchMove}
          onTouchEnd={onSheetTouchEnd}
        ><span /></div>
        <div className="cfg-m__sheet-head"><strong>Попередній перегляд</strong></div>
        <div className="cfg-m__preview-url-bar">
          <input type="text" placeholder="https://example.com" value={previewUrl}
            onChange={(e) => {
              setPreviewUrl(e.target.value)
              setPreviewDemoCode(null)
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') loadPreview() }}
            className="cfg-m__preview-url-input" />
          <button type="button" className="cfg-m__preview-url-btn" onClick={() => loadPreview()} disabled={previewLoading}>
            {previewLoading ? <Loader size={14} strokeWidth={2} className="cfg-m__spin" /> : 'Завантажити'}
          </button>
        </div>
        <div className="cfg-m__preview-frame-wrap">
          {!previewLoaded && !previewLoading && (
            <div className="cfg-m__preview-placeholder">Введіть URL та натисніть &quot;Завантажити&quot;</div>
          )}
          {previewLoading && (
            <div className="cfg-m__preview-placeholder">
              <Loader size={24} strokeWidth={2} className="cfg-m__spin" /><span>Завантаження...</span>
            </div>
          )}
          <iframe ref={iframeRef} className="cfg-m__preview-iframe"
            style={{ display: previewLoaded ? 'block' : 'none' }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
        </div>
        <div className="cfg-m__sheet-actions">
          <button type="button" className="cfg-m__sheet-close" onClick={() => setPreviewOpen(false)}>Закрити</button>
          <button type="button" className="cfg-m__sheet-apply" onClick={() => { void applyPreviewConfig() }}>
            Застосувати скрипт
          </button>
        </div>
      </div>

      {jsonPanelMode && (
        <>
          <div className="cfg-m__json-overlay" role="presentation" onClick={closeJsonPanel} />
          <div className="cfg-m__json-modal" role="dialog" aria-modal="true" aria-label="JSON налаштувань">
            <div className="cfg-m__json-head">
              <strong>{jsonPanelMode === 'export' ? 'JSON налаштувань (експорт)' : 'JSON налаштувань (імпорт)'}</strong>
              <button type="button" onClick={closeJsonPanel} aria-label="Закрити">×</button>
            </div>
            <textarea
              className="cfg-m__json-textarea"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder={jsonPanelMode === 'import' ? 'Вставте JSON тут...' : undefined}
              readOnly={jsonPanelMode === 'export'}
              spellCheck={false}
            />
            <div className="cfg-m__json-actions">
              <button type="button" className="cfg-m__json-btn cfg-m__json-btn--muted" onClick={closeJsonPanel}>
                Закрити
              </button>
              {jsonPanelMode === 'export' ? (
                <button type="button" className="cfg-m__json-btn cfg-m__json-btn--primary" onClick={copyJsonText}>
                  Скопіювати JSON
                </button>
              ) : (
                <button type="button" className="cfg-m__json-btn cfg-m__json-btn--primary" onClick={applyImportFromText}>
                  Застосувати
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Schema helpers ────────────────────────────────────────────────────────────

function resolveRef(node: Record<string, unknown>, root: Record<string, unknown>): Record<string, unknown> {
  if (!node || !node.$ref) return node
  const parts = (node.$ref as string).replace(/^#\//, '').split('/')
  let t: unknown = root
  for (const p of parts) { if (t && typeof t === 'object') t = (t as Record<string, unknown>)[p]; else return node }
  const resolved = t as Record<string, unknown>
  return node.default !== undefined ? { ...resolved, default: node.default } : resolved
}

function deepResolve(node: Record<string, unknown>, root: Record<string, unknown>): Record<string, unknown> {
  if (!node || typeof node !== 'object') return node
  let r = resolveRef(node, root)
  if (r !== node) r = { ...r }
  if (r.properties) {
    const p: Record<string, Record<string, unknown>> = {}
    for (const [k, v] of Object.entries(r.properties as Record<string, Record<string, unknown>>)) {
      p[k] = deepResolve(v, root)
    }
    r = { ...r, properties: p }
  }
  if (r.items && typeof r.items === 'object') r = { ...r, items: deepResolve(r.items as Record<string, unknown>, root) }
  if (r.additionalProperties && typeof r.additionalProperties === 'object') r = { ...r, additionalProperties: deepResolve(r.additionalProperties as Record<string, unknown>, root) }
  return r
}

function isOptionalObject(prop: Record<string, unknown>): Record<string, unknown> | null {
  // oneOf: [{ type: object, properties... }, { type: null }] → optional object
  if (!Array.isArray(prop.oneOf)) return null
  const variants = prop.oneOf as Record<string, unknown>[]
  const obj = variants.find(v => v.type === 'object' && v.properties)
  const nul = variants.find(v => v.type === 'null')
  return (obj && nul) ? obj : null
}

function buildDefaultFromSchema(schema: Record<string, unknown>): Record<string, unknown> {
  if (!schema || schema.type !== 'object') return {}
  const obj: Record<string, unknown> = {}
  const props = (schema.properties ?? {}) as Record<string, Record<string, unknown>>
  for (const [k, p] of Object.entries(props)) {
    if (p.default !== undefined) obj[k] = deepClone(p.default)
    else if (p.type === 'string') obj[k] = p.enum ? (p.enum as string[])[0] : ''
    else if (p.type === 'number') obj[k] = 0
    else if (p.type === 'boolean') obj[k] = false
  }
  return obj
}

// ─── Generic Config Form (schema-driven, like old configurator) ───────────────

function GenericConfigForm({ moduleId, config, schema, onChange }: {
  moduleId: string
  config: Record<string, unknown>
  schema: Record<string, unknown> | undefined
  onChange: (path: string, val: unknown) => void
}) {
  if (!schema) return null
  const resolved = deepResolve(schema, schema)
  const hiddenFields = new Set(HIDDEN_CONFIG_FIELDS[moduleId] ?? [])
  const properties = Object.fromEntries(
    Object.entries((resolved.properties as Record<string, Record<string, unknown>> | undefined) ?? {})
      .filter(([key]) => !hiddenFields.has(key)),
  ) as Record<string, Record<string, unknown>>
  if (!properties) return null

  const booleans: [string, Record<string, unknown>][] = []
  const numbers: [string, Record<string, unknown>][] = []
  const strings: [string, Record<string, unknown>][] = []
  const objects: [string, Record<string, unknown>][] = []
  const arraysOfObjects: [string, Record<string, unknown>][] = []
  const arraysOfStrings: [string, Record<string, unknown>][] = []

  for (const [key, prop] of Object.entries(properties)) {
    if (key === 'enabled') continue
    const t = prop.type as string
    if (t === 'boolean') booleans.push([key, prop])
    else if (t === 'number') numbers.push([key, prop])
    else if (t === 'string') strings.push([key, prop])
    else if (t === 'object') objects.push([key, prop])
    else if (t === 'array') {
      const items = prop.items as Record<string, unknown> | undefined
      if (items && (items.type as string) === 'string') arraysOfStrings.push([key, prop])
      else arraysOfObjects.push([key, prop])
    } else if (isOptionalObject(prop)) objects.push([key, prop])
  }

  return (
    <>
      {/* Booleans as toggles with dividers */}
      {booleans.map(([key, prop]) => (
        <div key={key}>
          <div className="cfg-m__toggle-row">
            <span>{prettify(key)}</span>
            <ToggleButton checked={(config[key] ?? prop.default ?? false) as boolean} onChange={(v) => onChange(key, v)} />
          </div>
          <div className="cfg-m__divider" style={{ margin: '8px -14px' }} />
        </div>
      ))}

      {/* Numbers in 2-col grid */}
      {numbers.length > 0 && (
        <div className="cfg-m__num-grid">
          {numbers.map(([key, prop]) => (
            <div key={key} className="cfg-m__field">
              <div className="cfg-m__field-label">{prettify(key)}</div>
              <input type="number" className="cfg-m__num-input"
                value={(config[key] ?? prop.default ?? 0) as number}
                min={prop.minimum as number | undefined}
                onChange={(e) => onChange(key, Number(e.target.value))} />
            </div>
          ))}
        </div>
      )}

      {/* Strings: enum → select, color → color picker, else → text */}
      {strings.map(([key, prop]) => {
        const val = (config[key] ?? prop.default ?? '') as string
        if (Array.isArray(prop.enum)) {
          return (
            <div key={key} className="cfg-m__field">
              <div className="cfg-m__field-label">{prettify(key)}</div>
              <select className="cfg-m__select" value={val} onChange={(e) => onChange(key, e.target.value)}>
                {(prop.enum as string[]).map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          )
        }
        if (looksLikeColor(val) || looksLikeColor(prop.default)) {
          return (
            <div key={key} className="cfg-m__color-row">
              <ColorField label={prettify(key)} value={val} onChange={(v) => onChange(key, v)} />
            </div>
          )
        }
        return (
          <div key={key} className="cfg-m__field">
            <div className="cfg-m__field-label">{prettify(key)}</div>
            <input type="text" className="cfg-m__item-input" style={{ width: '100%' }}
              value={val} onChange={(e) => onChange(key, e.target.value)} />
          </div>
        )
      })}

      {/* Objects: optional (oneOf/null) or nested */}
      {objects.map(([key, prop]) => {
        const optSchema = isOptionalObject(prop)
        if (optSchema) {
          return <OptionalObjectField key={key} keyName={key} schema={optSchema} value={config[key]} onChange={onChange} />
        }
        if (prop.properties) {
          const obj = (config[key] ?? {}) as Record<string, unknown>
          return <NestedObjectField key={key} keyName={key} schema={prop} value={obj} parentPath={key} onChange={onChange} />
        }
        return null
      })}

      {/* Arrays of objects */}
      {arraysOfObjects.map(([key, prop]) => {
        const items = (config[key] ?? []) as Record<string, unknown>[]
        const itemSchema = prop.items as Record<string, unknown> | undefined
        return <ArrayOfObjectsField key={key} keyName={key} items={items} itemSchema={itemSchema} parentPath={key} onChange={onChange} />
      })}

      {/* Arrays of strings */}
      {arraysOfStrings.map(([key, prop]) => {
        const items = (config[key] ?? []) as string[]
        const itemSchema = prop.items as Record<string, unknown> | undefined
        return <ArrayOfStringsField key={key} keyName={key} items={items} itemSchema={itemSchema} parentPath={key} onChange={onChange} />
      })}
    </>
  )
}

// ─── Optional object (oneOf object|null) ──────────────────────────────────────

function OptionalObjectField({ keyName, schema, value, onChange }: {
  keyName: string
  schema: Record<string, unknown>
  value: unknown
  onChange: (path: string, val: unknown) => void
}) {
  const isActive = value != null && typeof value === 'object'

  function toggle(on: boolean) {
    if (on) {
      onChange(keyName, buildDefaultFromSchema(schema))
    } else {
      onChange(keyName, null)
    }
  }

  return (
    <>
      <div className="cfg-m__toggle-row">
        <span>{prettify(keyName)}</span>
        <ToggleButton checked={isActive} onChange={toggle} />
      </div>
      <div className="cfg-m__divider" style={{ margin: '8px -14px' }} />
      {isActive && schema.properties && (
        <div className="cfg-m__nested-card">
          <NestedFields obj={value as Record<string, unknown>} properties={schema.properties as Record<string, Record<string, unknown>>} parentPath={keyName} onChange={onChange} />
        </div>
      )}
    </>
  )
}

// ─── Nested object with toggle ────────────────────────────────────────────────

function NestedObjectField({ keyName, schema, value, parentPath, onChange }: {
  keyName: string
  schema: Record<string, unknown>
  value: Record<string, unknown>
  parentPath: string
  onChange: (path: string, val: unknown) => void
}) {
  const [open, setOpen] = useState(true)
  const properties = schema.properties as Record<string, Record<string, unknown>> | undefined
  if (!properties) return null

  return (
    <>
      <div className="cfg-m__toggle-row">
        <span style={{ fontWeight: 600 }}>{prettify(keyName)}</span>
        <ToggleButton checked={open} onChange={setOpen} />
      </div>
      <div className="cfg-m__divider" style={{ margin: '8px -14px' }} />
      {open && (
        <div className="cfg-m__nested-card">
          {Object.entries(properties).map(([childKey, childProp]) => {
            const childPath = `${parentPath}.${childKey}`
            const childVal = value[childKey]

            // Nested object (e.g. colors.desktop)
            if ((childProp.type as string) === 'object' && childProp.properties) {
              return (
                <div key={childKey}>
                  <div className="cfg-m__toggle-row">
                    <span style={{ fontWeight: 600 }}>{prettify(childKey)}</span>
                    <ToggleButton checked={true} onChange={() => {}} />
                  </div>
                  <div className="cfg-m__nested-card">
                    <NestedFields
                      obj={(childVal ?? {}) as Record<string, unknown>}
                      properties={childProp.properties as Record<string, Record<string, unknown>>}
                      parentPath={childPath}
                      onChange={onChange}
                    />
                  </div>
                </div>
              )
            }

            return <SingleField key={childKey} fieldKey={childKey} prop={childProp} value={childVal} path={childPath} onChange={onChange} />
          })}
        </div>
      )}
    </>
  )
}

// ─── Array of objects ─────────────────────────────────────────────────────────

function ArrayOfObjectsField({ keyName, items, itemSchema, parentPath, onChange }: {
  keyName: string
  items: Record<string, unknown>[]
  itemSchema: Record<string, unknown> | undefined
  parentPath: string
  onChange: (path: string, val: unknown) => void
}) {
  function removeItem(idx: number) {
    onChange(parentPath, items.filter((_, i) => i !== idx))
  }

  function addItem() {
    const newItem = itemSchema ? buildDefaultFromSchema(itemSchema) : {}
    onChange(parentPath, [...items, newItem])
  }

  function updateField(idx: number, field: string, val: unknown) {
    const updated = items.map((item, i) => i === idx ? { ...item, [field]: val } : item)
    onChange(parentPath, updated)
  }

  const fields = (itemSchema?.properties ?? {}) as Record<string, Record<string, unknown>>

  return (
    <div className="cfg-m__field">
      <div className="cfg-m__field-label">{prettify(keyName)}</div>
      {items.map((item, idx) => (
        <div key={idx} className="cfg-m__array-card">
          <div className="cfg-m__array-card-head">
            <span>#{idx + 1}</span>
            <button type="button" className="cfg-m__array-card-rm" onClick={() => removeItem(idx)}>×</button>
          </div>
          {Object.entries(fields).map(([fk, fp]) => {
            const fVal = item[fk]
            if (Array.isArray(fp.enum)) {
              return (
                <div key={fk} className="cfg-m__field">
                  <div className="cfg-m__field-label">{prettify(fk)}</div>
                  <select className="cfg-m__select" value={(fVal ?? fp.default ?? '') as string}
                    onChange={(e) => updateField(idx, fk, e.target.value)}>
                    {(fp.enum as string[]).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              )
            }
            if ((fp.type as string) === 'array') {
              const subItems = (fp.items as Record<string, unknown> | undefined)
              const subType = subItems?.type as string | undefined
              if (subType === 'string') {
                const arr = Array.isArray(fVal) ? (fVal as string[]) : []
                return (
                  <ArrayOfStringsField
                    key={fk}
                    keyName={fk}
                    items={arr}
                    itemSchema={subItems}
                    parentPath={`${parentPath}.${idx}.${fk}`}
                    onChange={(_p, v) => updateField(idx, fk, v)}
                  />
                )
              }
            }
            if ((fp.type as string) === 'boolean') {
              return (
                <div key={fk} className="cfg-m__toggle-row" style={{ marginTop: 6 }}>
                  <span>{prettify(fk)}</span>
                  <ToggleButton checked={(fVal ?? fp.default ?? false) as boolean} onChange={(v) => updateField(idx, fk, v)} />
                </div>
              )
            }
            if ((fp.type as string) === 'number') {
              return (
                <div key={fk} className="cfg-m__field">
                  <div className="cfg-m__field-label">{prettify(fk)}</div>
                  <input type="number" className="cfg-m__num-input"
                    value={(fVal ?? fp.default ?? 0) as number}
                    min={fp.minimum as number | undefined}
                    onChange={(e) => updateField(idx, fk, Number(e.target.value))} />
                </div>
              )
            }
            return (
              <div key={fk} className="cfg-m__field">
                <div className="cfg-m__field-label">{prettify(fk)}</div>
                <input type="text" className="cfg-m__item-input" style={{ width: '100%' }}
                  value={(fVal ?? '') as string} onChange={(e) => updateField(idx, fk, e.target.value)} />
              </div>
            )
          })}
        </div>
      ))}
      <button type="button" className="cfg-m__add-btn" onClick={addItem}>
        <Plus size={12} strokeWidth={2.5} /> Додати
      </button>
    </div>
  )
}

// ─── Array of strings ─────────────────────────────────────────────────────────

function ArrayOfStringsField({ keyName, items, itemSchema, parentPath, onChange }: {
  keyName: string
  items: string[]
  itemSchema: Record<string, unknown> | undefined
  parentPath: string
  onChange: (path: string, val: unknown) => void
}) {
  const enumOpts = Array.isArray(itemSchema?.enum) ? (itemSchema!.enum as string[]) : null

  function removeItem(idx: number) {
    onChange(parentPath, items.filter((_, i) => i !== idx))
  }

  function addItem() {
    const def = (itemSchema?.default as string | undefined) ?? (enumOpts ? enumOpts[0] : '')
    onChange(parentPath, [...items, def])
  }

  function updateItem(idx: number, val: string) {
    onChange(parentPath, items.map((s, i) => (i === idx ? val : s)))
  }

  return (
    <div className="cfg-m__field">
      <div className="cfg-m__field-label">{prettify(keyName)}</div>
      {items.map((item, idx) => (
        <div key={idx} className="cfg-m__array-card">
          <div className="cfg-m__array-card-head">
            <span>#{idx + 1}</span>
            <button type="button" className="cfg-m__array-card-rm" onClick={() => removeItem(idx)}>×</button>
          </div>
          {enumOpts ? (
            <select className="cfg-m__select" value={item} onChange={(e) => updateItem(idx, e.target.value)}>
              {enumOpts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input type="text" className="cfg-m__item-input" style={{ width: '100%' }}
              value={item} onChange={(e) => updateItem(idx, e.target.value)} />
          )}
        </div>
      ))}
      <button type="button" className="cfg-m__add-btn" onClick={addItem}>
        <Plus size={12} strokeWidth={2.5} /> Додати
      </button>
    </div>
  )
}

// ─── Flat nested fields ───────────────────────────────────────────────────────

function NestedFields({ obj, properties, parentPath, onChange }: {
  obj: Record<string, unknown>
  properties: Record<string, Record<string, unknown>>
  parentPath: string
  onChange: (path: string, val: unknown) => void
}) {
  return (
    <>
      {Object.entries(properties).map(([key, prop]) => (
        <SingleField key={key} fieldKey={key} prop={prop} value={obj[key]} path={`${parentPath}.${key}`} onChange={onChange} />
      ))}
    </>
  )
}

function SingleField({ fieldKey, prop, value, path, onChange }: {
  fieldKey: string
  prop: Record<string, unknown>
  value: unknown
  path: string
  onChange: (path: string, val: unknown) => void
}) {
  const t = prop.type as string
  if (t === 'boolean') {
    return (
      <div className="cfg-m__toggle-row" style={{ marginTop: 6 }}>
        <span>{prettify(fieldKey)}</span>
        <ToggleButton checked={(value ?? prop.default ?? false) as boolean} onChange={(v) => onChange(path, v)} />
      </div>
    )
  }
  if (t === 'number') {
    return (
      <div className="cfg-m__field" style={{ marginTop: 6 }}>
        <div className="cfg-m__field-label">{prettify(fieldKey)}</div>
        <input type="number" className="cfg-m__num-input" style={{ width: '100%' }}
          value={(value ?? prop.default ?? 0) as number}
          onChange={(e) => onChange(path, Number(e.target.value))} />
      </div>
    )
  }
  if (t === 'string') {
    const val = (value ?? prop.default ?? '') as string
    if (Array.isArray(prop.enum)) {
      return (
        <div className="cfg-m__field" style={{ marginTop: 6 }}>
          <div className="cfg-m__field-label">{prettify(fieldKey)}</div>
          <select className="cfg-m__select" value={val} onChange={(e) => onChange(path, e.target.value)}>
            {(prop.enum as string[]).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      )
    }
    if (looksLikeColor(val) || looksLikeColor(prop.default)) {
      return (
        <div className="cfg-m__field" style={{ marginTop: 6 }}>
          <div className="cfg-m__field-label">{prettify(fieldKey)}</div>
          <ColorField label={prettify(fieldKey)} value={val} onChange={(v) => onChange(path, v)} />
        </div>
      )
    }
    return (
      <div className="cfg-m__field" style={{ marginTop: 6 }}>
        <div className="cfg-m__field-label">{prettify(fieldKey)}</div>
        <input type="text" className="cfg-m__item-input" style={{ width: '100%' }}
          value={val} onChange={(e) => onChange(path, e.target.value)} />
      </div>
    )
  }
  return null
}

// ─── Generic I18n Form ────────────────────────────────────────────────────────

function GenericI18nForm({ i18n, schema, onChange, onReplace }: {
  i18n: Record<string, unknown>
  schema: Record<string, unknown> | undefined
  onChange: (path: string, val: unknown) => void
  onReplace: (newI18n: Record<string, unknown>) => void
}) {
  const [newLang, setNewLang] = useState('')

  if (!schema) return null

  const resolved = deepResolve(schema, schema)
  const additionalProps = (resolved as { additionalProperties?: Record<string, unknown> }).additionalProperties
  if (!additionalProps) return null

  const resolvedAP = deepResolve(additionalProps, schema)
  const isArray = (resolvedAP as { type?: string }).type === 'array'

  // Get object keys from schema for new lang defaults
  const objKeys = (!isArray && (resolvedAP as { properties?: Record<string, unknown> }).properties)
    ? Object.keys((resolvedAP as { properties: Record<string, unknown> }).properties)
    : []

  function removeLang(lang: string) {
    const next = { ...i18n }
    delete next[lang]
    onReplace(next)
  }

  function addLang() {
    const code = newLang.trim().toLowerCase()
    if (!code || i18n[code]) return
    if (isArray) {
      onReplace({ ...i18n, [code]: [''] })
    } else {
      const entry: Record<string, string> = {}
      for (const k of objKeys) entry[k] = ''
      onReplace({ ...i18n, [code]: entry })
    }
    setNewLang('')
  }

  return (
    <>
      {Object.entries(i18n).map(([lang, data]) => (
        <div key={lang} className="cfg-m__i18n-lang-card">
          <div className="cfg-m__i18n-lang-head">
            <span className="cfg-m__i18n-lang-code">{lang.toUpperCase()}</span>
            <button type="button" className="cfg-m__i18n-lang-rm" onClick={() => removeLang(lang)}>Видалити</button>
          </div>
          {isArray ? (
            <I18nArrayFields items={(data as string[]) ?? []} onChange={(items) => onReplace({ ...i18n, [lang]: items })} />
          ) : (
            <I18nObjectFields obj={(data as Record<string, string>) ?? {}} onChange={(key, val) => onChange(`${lang}.${key}`, val)} />
          )}
        </div>
      ))}

      {/* Add language */}
      <div className="cfg-m__i18n-add-row">
        <input type="text" className="cfg-m__i18n-add-input" placeholder="uk" value={newLang}
          onChange={(e) => setNewLang(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addLang() }} />
        <button type="button" className="cfg-m__add-btn" onClick={addLang}>
          <Plus size={12} strokeWidth={2.5} /> Додати мову
        </button>
      </div>
    </>
  )
}

function I18nArrayFields({ items, onChange }: {
  items: string[]
  onChange: (items: string[]) => void
}) {
  return (
    <>
      {items.map((text, i) => (
        <div key={i} className="cfg-m__item" style={{ marginTop: 6 }}>
          <input type="text" value={text}
            onChange={(e) => onChange(items.map((t, idx) => idx === i ? e.target.value : t))}
            className="cfg-m__item-input" />
          <button type="button" className="cfg-m__item-remove"
            onClick={() => { if (items.length > 1) onChange(items.filter((_, idx) => idx !== i)) }}
            aria-label="Видалити">
            <Trash2 size={13} strokeWidth={2} />
          </button>
        </div>
      ))}
      <button type="button" className="cfg-m__add-btn" style={{ marginTop: 8 }}
        onClick={() => onChange([...items, ''])}>
        <Plus size={12} strokeWidth={2.5} /> Додати
      </button>
    </>
  )
}

function I18nObjectFields({ obj, onChange }: {
  obj: Record<string, string>
  onChange: (key: string, val: string) => void
}) {
  return (
    <>
      {Object.entries(obj).map(([key, val]) => (
        <div key={key} className="cfg-m__field" style={{ marginTop: 6 }}>
          <div className="cfg-m__field-label">{prettify(key)}</div>
          <input type="text" value={val} onChange={(e) => onChange(key, e.target.value)}
            className="cfg-m__item-input" style={{ width: '100%' }} />
        </div>
      ))}
    </>
  )
}

// ─── Shared components ────────────────────────────────────────────────────────

function prettify(key: string): string {
  return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="cfg-m__color-field">
      <label>{label}</label>
      <div className="cfg-m__color-input">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="cfg-m__color-native" aria-label={label} />
        <span className="cfg-m__color-swatch" style={{ background: value }} />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="cfg-m__color-text" />
      </div>
    </div>
  )
}

function ToggleButton({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked}
      className={`cfg-m__toggle ${checked ? 'cfg-m__toggle--on' : ''}`}
      onClick={() => onChange(!checked)}>
      <span className="cfg-m__toggle-thumb" />
    </button>
  )
}
