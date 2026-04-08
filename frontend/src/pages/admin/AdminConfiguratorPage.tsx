import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  LayoutDashboard,
  Receipt,
  Users,
  Globe,
  Wand2,
  Code,
  Eye,
  Copy,
  Check,
  Plus,
  Trash2,
  Play,
  Monitor,
  Smartphone,
  Save,
  ChevronDown,
  Loader,
  Megaphone,
  CalendarClock,
  ShoppingCart,
} from 'lucide-react'
import { toast } from 'sonner'
import { get, put, getToken } from '../../api/client'
import type { Site, SiteDetail, SiteWidget } from '../../types'
import './configurator-mobile.css'

// ─── Module metadata ───────────────────────────────────────────────────────────

interface ModuleMeta {
  slug: string          // product slug in backend
  label: string
  icon: typeof Megaphone
  defaultConfig: Record<string, unknown>
  defaultI18n: Record<string, unknown>
}

const MODULES: ModuleMeta[] = [
  {
    slug: 'marquee',
    label: 'Біжучий рядок',
    icon: Megaphone,
    defaultConfig: {
      enabled: true,
      speed: 80,
      height: 36,
      zIndex: 999,
      mode: 'shift',
      ttlHours: 24,
      isFixed: true,
      colors: {
        desktop: { backgroundColor: '#1e1b4b', textColor: '#e0e7ff' },
        mobile:  { backgroundColor: '#1e1b4b', textColor: '#e0e7ff' },
      },
    },
    defaultI18n: { ua: ['АКЦIЯ', 'Офіційний магазин', 'Доставка по всій Україні'] },
  },
  {
    slug: 'delivery-date',
    label: 'Дата доставки',
    icon: CalendarClock,
    defaultConfig: {
      enabled: true,
      offsetDays: 3,
      selectors: [],
    },
    defaultI18n: {
      ua: {
        prefix: 'Очікувана доставка',
        tomorrow: 'завтра',
        dayAfterTomorrow: 'післязавтра',
        monday: 'в понеділок', tuesday: 'у вівторок', wednesday: 'в середу',
        thursday: 'в четвер', friday: 'в п\'ятницю', saturday: 'в суботу', sunday: 'в неділю',
      },
    },
  },
  {
    slug: 'cart-goal',
    label: 'Ціль кошика',
    icon: ShoppingCart,
    defaultConfig: {
      enabled: true,
      threshold: 1000,
      minimum: 0,
      floatingWidget: true,
      background: '#172554',
      achievedBackground: '#14532d',
      textColor: '#bfdbfe',
      shakeInterval: 3000,
      zIndex: 999,
    },
    defaultI18n: {
      ua: { text: 'До безкоштовної доставки залишилось', achieved: '🎉 Вітаємо! Ви отримали безкоштовну доставку!' },
    },
  },
]

const COLOR_PRESETS = ['#1E1B4B', '#CBD5E1', '#4C1D95', '#14532D', '#F59E0B', '#3B82F6']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deepGet(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj as unknown)
}

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

function scriptTag(token: string): string {
  return `<script src="https://cdn.widgetis.com/w/${token}.js" async></script>`
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AdminConfiguratorPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [siteDetail, setSiteDetail] = useState<SiteDetail | null>(null)
  const [activeSiteId, setActiveSiteId] = useState<number | null>(null)
  const [activeSlug, setActiveSlug] = useState<string>('marquee')
  const [config, setConfig] = useState<Record<string, unknown>>({ ...MODULES[0].defaultConfig })
  const [i18n, setI18n] = useState<Record<string, unknown>>({ ...MODULES[0].defaultI18n })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [copied, setCopied] = useState(false)
  const [siteDropOpen, setSiteDropOpen] = useState(false)
  const [siteSearch, setSiteSearch] = useState('')

  // Load sites list
  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    get<{ data: Site[] }>('/admin/sites', { per_page: 100 })
      .then((res) => {
        const list = res.data ?? []
        setSites(list)
        if (list.length > 0) setActiveSiteId(list[0].id)
      })
      .catch(() => { /* backend недоступний — продовжуємо з мок-даними */ })
      .finally(() => setLoading(false))
  }, [])

  // Load site detail when site changes
  useEffect(() => {
    if (!activeSiteId || !getToken()) return
    setLoading(true)
    get<SiteDetail>(`/admin/sites/${activeSiteId}`)
      .then((detail) => {
        setSiteDetail(detail)
        loadWidgetConfig(detail, activeSlug)
      })
      .catch(() => { /* backend недоступний */ })
      .finally(() => setLoading(false))
  }, [activeSiteId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadWidgetConfig = useCallback((detail: SiteDetail, slug: string) => {
    const meta = MODULES.find((m) => m.slug === slug)!
    const widget = detail.widgets?.find((w) => w.name?.toLowerCase().includes(slug.replace('-', ' ').toLowerCase()) || w.icon === slug)

    const rawConfig = (widget?.config as Record<string, unknown>) ?? {}
    const rawI18n = (rawConfig.i18n as Record<string, unknown>) ?? {}
    // Remove i18n from config to keep them separate
    const { i18n: _i18n, ...cleanConfig } = rawConfig

    setConfig(Object.keys(cleanConfig).length > 0 ? cleanConfig : { ...meta.defaultConfig })
    setI18n(Object.keys(rawI18n).length > 0 ? rawI18n : { ...meta.defaultI18n })
  }, [])

  const activeMeta = MODULES.find((m) => m.slug === activeSlug) ?? MODULES[0]
  const activeSite = sites.find((s) => s.id === activeSiteId)
  const filteredSites = siteSearch.trim()
    ? sites.filter((s) =>
        s.domain.toLowerCase().includes(siteSearch.toLowerCase()) ||
        s.user?.email.toLowerCase().includes(siteSearch.toLowerCase())
      )
    : sites

  // Widget availability for module pills
  function getWidgetForSlug(slug: string): SiteWidget | undefined {
    return siteDetail?.widgets?.find((w) =>
      w.name?.toLowerCase().includes(slug.replace('-', ' ').toLowerCase()) ||
      w.icon === slug
    )
  }

  function handleModuleSelect(slug: string) {
    setActiveSlug(slug)
    if (siteDetail) loadWidgetConfig(siteDetail, slug)
  }

  async function handleSave() {
    if (!activeSiteId) {
      toast.error('Виберіть сайт')
      return
    }
    const widget = getWidgetForSlug(activeSlug)
    if (!widget) {
      toast.error('Виджет не знайдено для цього сайту')
      return
    }

    setSaving(true)
    try {
      await put(`/admin/sites/${activeSiteId}/widgets/${widget.product_id}`, {
        is_enabled: (config.enabled ?? true) as boolean,
        config: { ...config, i18n },
      })
      toast.success('Конфігурацію збережено')
    } catch (err) {
      toast.error((err as Error).message || 'Помилка збереження')
    } finally {
      setSaving(false)
    }
  }

  async function copyScript() {
    const tag = siteDetail?.script?.script_tag ?? scriptTag(siteDetail?.script?.token ?? '...')
    try {
      await navigator.clipboard.writeText(tag)
      setCopied(true)
      toast.success('Скрипт скопійовано')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error('Не вдалося скопіювати')
    }
  }

  const isEnabled = (config.enabled ?? true) as boolean

  return (
    <div className="cfg-m">
      {/* Topbar */}
      <header className="cfg-m__topbar">
        <Link to="/admin" className="cfg-m__back" aria-label="Назад">
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <div className="cfg-m__topbar-title">
          <strong>Конфігуратор</strong>
          <span>Налаштування віджетів</span>
        </div>
        <div className="cfg-m__avatar" aria-hidden="true">ІЛ</div>
      </header>

      {/* Body */}
      <main className="cfg-m__body">

        {/* Site selector */}
        <div className="cfg-m__site-sel">
          <button
            type="button"
            className="cfg-m__site-btn"
            onClick={() => setSiteDropOpen((o) => !o)}
          >
            <Globe size={15} strokeWidth={2} className="cfg-m__site-ico" />
            <span className="cfg-m__site-label">
              {activeSite ? activeSite.domain : (loading ? 'Завантаження...' : 'Оберіть сайт')}
            </span>
            <ChevronDown size={14} strokeWidth={2} className={`cfg-m__site-chevron ${siteDropOpen ? 'cfg-m__site-chevron--open' : ''}`} />
          </button>
          {siteDropOpen && (
            <div className="cfg-m__site-drop">
              <div className="cfg-m__site-search">
                <input
                  type="text"
                  placeholder="Пошук сайту або email..."
                  value={siteSearch}
                  onChange={(e) => setSiteSearch(e.target.value)}
                  className="cfg-m__site-search-input"
                  autoFocus
                />
              </div>
              {filteredSites.map((site) => (
                <button
                  key={site.id}
                  type="button"
                  className={`cfg-m__site-option ${site.id === activeSiteId ? 'cfg-m__site-option--active' : ''}`}
                  onClick={() => { setActiveSiteId(site.id); setSiteDropOpen(false); setSiteSearch('') }}
                >
                  <span className={`cfg-m__site-dot ${site.status === 'active' ? 'cfg-m__site-dot--green' : 'cfg-m__site-dot--grey'}`} />
                  <span className="cfg-m__site-option-info">
                    <span className="cfg-m__site-option-domain">{site.domain}</span>
                    {site.user?.email && <span className="cfg-m__site-option-email">{site.user.email}</span>}
                  </span>
                </button>
              ))}
              {filteredSites.length === 0 && (
                <div className="cfg-m__site-empty">Нічого не знайдено</div>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="cfg-m__loader">
            <Loader size={22} strokeWidth={2} className="cfg-m__spin" />
            <span>Завантаження...</span>
          </div>
        ) : (
          <>
            {/* Module card */}
            <div className="cfg-m__card">
              <div className="cfg-m__card-head">
                <span className="cfg-m__badge-num">1</span>
                <span className="cfg-m__card-title">Модулі</span>
              </div>
              <div className="cfg-m__pills-row">
                {MODULES.map((mod) => {
                  const widget = getWidgetForSlug(mod.slug)
                  const isActive = activeSlug === mod.slug
                  const hasWidget = !!widget
                  return (
                    <button
                      key={mod.slug}
                      type="button"
                      onClick={() => handleModuleSelect(mod.slug)}
                      className={[
                        'cfg-m__pill',
                        isActive ? 'cfg-m__pill--active' : '',
                        !hasWidget ? 'cfg-m__pill--dimmed' : '',
                      ].join(' ')}
                    >
                      <span className={`cfg-m__pill-dot cfg-m__pill-dot--${widget?.is_enabled ? 'green' : 'grey'}`} />
                      {mod.label}
                    </button>
                  )
                })}
              </div>
              <div className="cfg-m__divider" />
              <div className="cfg-m__toggle-row">
                <span>Увімкнено</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isEnabled}
                  className={`cfg-m__toggle ${isEnabled ? 'cfg-m__toggle--on' : ''}`}
                  onClick={() => setConfig((c) => ({ ...c, enabled: !isEnabled }))}
                >
                  <span className="cfg-m__toggle-thumb" />
                </button>
              </div>
            </div>

            {/* Settings card */}
            <div className="cfg-m__card cfg-m__card--blue">
              <div className="cfg-m__scard-head">
                <activeMeta.icon size={15} strokeWidth={2} className="cfg-m__scard-icon" />
                <span>{activeMeta.label} — налаштування</span>
              </div>

              {activeSlug === 'marquee' && (
                <MarqueeForm
                  config={config}
                  i18n={i18n as { ua?: string[] }}
                  onChange={(path, val) => setConfig((c) => deepSet(c, path, val))}
                  onI18nChange={(items: string[]) => setI18n({ ...i18n, ua: items })}
                />
              )}

              {activeSlug === 'delivery-date' && (
                <DeliveryDateForm
                  config={config}
                  i18n={i18n as Record<string, Record<string, string>>}
                  onChange={(path, val) => setConfig((c) => deepSet(c, path, val))}
                  onI18nChange={(lang, key, val) => setI18n((i) => deepSet(i as Record<string, unknown>, `${lang}.${key}`, val))}
                />
              )}

              {activeSlug === 'cart-goal' && (
                <CartGoalForm
                  config={config}
                  i18n={i18n as Record<string, { text?: string; achieved?: string }>}
                  onChange={(path, val) => setConfig((c) => deepSet(c, path, val))}
                  onI18nChange={(lang, key, val) => setI18n((i) => deepSet(i as Record<string, unknown>, `${lang}.${key}`, val))}
                />
              )}
            </div>

            {/* Actions */}
            <div className="cfg-m__actions">
              <button
                type="button"
                className="cfg-m__action-build"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Loader size={15} strokeWidth={2} className="cfg-m__spin" /> : <Save size={15} strokeWidth={2} />}
                {saving ? 'Збереження...' : 'Зберегти конфігурацію'}
              </button>
              <div className="cfg-m__action-row">
                <button type="button" className="cfg-m__action-preview" onClick={() => setPreviewOpen(true)}>
                  <Eye size={14} strokeWidth={2} />
                  До прев'ю
                </button>
                <button type="button" className="cfg-m__action-copy" onClick={copyScript}>
                  {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2} />}
                  {copied ? 'Скопійовано' : 'Скрипт'}
                </button>
              </div>
              <button type="button" className="cfg-m__action-demo">
                <Play size={13} strokeWidth={2} />
                Демо-посилання
              </button>
            </div>

            {/* Result card */}
            <div className="cfg-m__card">
              <div className="cfg-m__card-head">
                <span className="cfg-m__badge-num cfg-m__badge-num--green">2</span>
                <span className="cfg-m__card-title">Результат</span>
              </div>
              <div className="cfg-m__code">
                <ConfigPreview config={config} i18n={i18n} moduleSlug={activeSlug} />
              </div>
              <button type="button" className="cfg-m__copy-res" onClick={copyScript}>
                <Code size={13} strokeWidth={2} />
                Копіювати скрипт для сайту
              </button>
            </div>
          </>
        )}
      </main>

      {/* FAB */}
      <button type="button" className="cfg-m__fab" onClick={() => setPreviewOpen(true)}>
        <Eye size={18} strokeWidth={2} />
        Превью
      </button>

      {/* Bottom nav */}
      <nav className="cfg-m__nav">
        <Link to="/admin" className="cfg-m__tab">
          <LayoutDashboard size={20} strokeWidth={2} />
          <span>Дашборд</span>
        </Link>
        <Link to="/admin/orders" className="cfg-m__tab">
          <Receipt size={20} strokeWidth={2} />
          <span>Замовлення</span>
        </Link>
        <Link to="/admin/users" className="cfg-m__tab">
          <Users size={20} strokeWidth={2} />
          <span>Юзери</span>
        </Link>
        <Link to="/admin/sites" className="cfg-m__tab">
          <Globe size={20} strokeWidth={2} />
          <span>Сайти</span>
        </Link>
        <Link to="/admin/configurator" className="cfg-m__tab cfg-m__tab--active">
          <Wand2 size={20} strokeWidth={2} />
          <span>Конфіг</span>
        </Link>
      </nav>

      {/* Preview sheet */}
      {previewOpen && (
        <PreviewSheet
          config={config}
          scriptTag={siteDetail?.script?.script_tag ?? scriptTag(siteDetail?.script?.token ?? '...')}
          viewMode={viewMode}
          onViewMode={setViewMode}
          onCopy={copyScript}
          copied={copied}
          onClose={() => setPreviewOpen(false)}
          activeSlug={activeSlug}
        />
      )}
    </div>
  )
}

// ─── Marquee Form ─────────────────────────────────────────────────────────────

function MarqueeForm({
  config, i18n, onChange, onI18nChange,
}: {
  config: Record<string, unknown>
  i18n: { ua?: string[] }
  onChange: (path: string, val: unknown) => void
  onI18nChange: (items: string[]) => void
}) {
  const items = i18n.ua ?? ['АКЦIЯ']
  const mode = (config.mode ?? 'shift') as string
  const speed = (config.speed ?? 80) as number
  const isFixed = (config.isFixed ?? true) as boolean
  const deskBg = (deepGet(config, 'colors.desktop.backgroundColor') ?? '#1e1b4b') as string
  const deskTxt = (deepGet(config, 'colors.desktop.textColor') ?? '#e0e7ff') as string

  function addItem() { onI18nChange([...items, 'Нова акція']) }
  function removeItem(i: number) {
    if (items.length === 1) { toast.error('Мінімум 1 текст'); return }
    onI18nChange(items.filter((_, idx) => idx !== i))
  }
  function updateItem(i: number, val: string) {
    onI18nChange(items.map((t, idx) => idx === i ? val : t))
  }

  return (
    <>
      {/* Colors */}
      <div className="cfg-m__color-row">
        <ColorField label="Фон" value={deskBg} onChange={(v) => onChange('colors.desktop.backgroundColor', v)} />
        <ColorField label="Текст" value={deskTxt} onChange={(v) => onChange('colors.desktop.textColor', v)} />
      </div>

      {/* Speed */}
      <div className="cfg-m__field">
        <div className="cfg-m__field-label">Швидкість</div>
        <div className="cfg-m__slider-row">
          <input
            type="range" min={10} max={100} value={speed}
            onChange={(e) => onChange('speed', Number(e.target.value))}
            className="cfg-m__slider"
          />
          <span className="cfg-m__slider-val" style={{ color: '#3B82F6' }}>{speed}</span>
        </div>
        <span className="cfg-m__hint">Висота: 36 · Z-index: 999 · TTL: 24 год</span>
      </div>

      {/* Mode */}
      <div className="cfg-m__field">
        <div className="cfg-m__field-label">Режим</div>
        <div className="cfg-m__segs">
          <button type="button" className={`cfg-m__seg ${mode === 'shift' ? 'cfg-m__seg--active' : ''}`}
            onClick={() => onChange('mode', 'shift')}>зсув</button>
          <button type="button" className={`cfg-m__seg ${mode === 'overlay' ? 'cfg-m__seg--active' : ''}`}
            onClick={() => onChange('mode', 'overlay')}>накладання</button>
        </div>
      </div>

      {/* Fixed */}
      <div className="cfg-m__toggle-row">
        <span>Фіксований</span>
        <ToggleButton checked={isFixed} onChange={(v) => onChange('isFixed', v)} />
      </div>

      {/* Items */}
      <div className="cfg-m__items-head">
        <span>Повідомлення ua ({items.length})</span>
        <button type="button" className="cfg-m__add-btn" onClick={addItem}>
          <Plus size={12} strokeWidth={2.5} />Додати
        </button>
      </div>
      <div className="cfg-m__items">
        {items.map((text, i) => (
          <div key={i} className="cfg-m__item">
            <input
              type="text" value={text}
              onChange={(e) => updateItem(i, e.target.value)}
              className="cfg-m__item-input"
            />
            <button type="button" className="cfg-m__item-remove" onClick={() => removeItem(i)} aria-label="Видалити">
              <Trash2 size={13} strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>

      {/* Color picker preview */}
      <div className="cfg-m__cpicker">
        <span className="cfg-m__cpicker-label">Кольорова палітра</span>
        <div className="cfg-m__cpicker-gradient" style={{ background: `linear-gradient(135deg, ${deskTxt} 0%, ${deskBg} 100%)` }} />
        <div className="cfg-m__cpicker-hue" />
        <div className="cfg-m__cpicker-hex">
          <span className="cfg-m__cpicker-swatch" style={{ background: deskBg }} />
          <span className="cfg-m__cpicker-hexval">{deskBg}</span>
        </div>
        <div className="cfg-m__swatches">
          {COLOR_PRESETS.map((color) => (
            <button key={color} type="button" className="cfg-m__swatch"
              style={{ background: color }}
              onClick={() => onChange('colors.desktop.backgroundColor', color)}
              aria-label={color} />
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Delivery Date Form ───────────────────────────────────────────────────────

function DeliveryDateForm({
  config, i18n, onChange, onI18nChange,
}: {
  config: Record<string, unknown>
  i18n: Record<string, Record<string, string>>
  onChange: (path: string, val: unknown) => void
  onI18nChange: (lang: string, key: string, val: string) => void
}) {
  const offsetDays = (config.offsetDays ?? 3) as number
  const ua = i18n.ua ?? {}

  return (
    <>
      <div className="cfg-m__field">
        <div className="cfg-m__field-label">Зсув доставки (днів)</div>
        <div className="cfg-m__slider-row">
          <input type="range" min={0} max={14} value={offsetDays}
            onChange={(e) => onChange('offsetDays', Number(e.target.value))}
            className="cfg-m__slider" />
          <span className="cfg-m__slider-val" style={{ color: '#3B82F6' }}>{offsetDays}</span>
        </div>
        <span className="cfg-m__hint">Дата = сьогодні + {offsetDays} днів</span>
      </div>

      <div className="cfg-m__field">
        <div className="cfg-m__field-label">Префікс (ua)</div>
        <input type="text" value={ua.prefix ?? 'Очікувана доставка'}
          onChange={(e) => onI18nChange('ua', 'prefix', e.target.value)}
          className="cfg-m__item-input" style={{ width: '100%' }} />
      </div>

      <div className="cfg-m__items-head">
        <span>Назви днів (ua)</span>
      </div>
      <div className="cfg-m__items">
        {(['tomorrow', 'dayAfterTomorrow', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day) => (
          <div key={day} className="cfg-m__item">
            <span className="cfg-m__item-label">{day}</span>
            <input type="text" value={ua[day] ?? ''}
              onChange={(e) => onI18nChange('ua', day, e.target.value)}
              className="cfg-m__item-input" />
          </div>
        ))}
      </div>
    </>
  )
}

// ─── Cart Goal Form ───────────────────────────────────────────────────────────

function CartGoalForm({
  config, i18n, onChange, onI18nChange,
}: {
  config: Record<string, unknown>
  i18n: Record<string, { text?: string; achieved?: string }>
  onChange: (path: string, val: unknown) => void
  onI18nChange: (lang: string, key: string, val: string) => void
}) {
  const threshold = (config.threshold ?? 1000) as number
  const floatingWidget = (config.floatingWidget ?? true) as boolean
  const background = (config.background ?? '#172554') as string
  const achievedBg = (config.achievedBackground ?? '#14532d') as string
  const textColor = (config.textColor ?? '#bfdbfe') as string
  const ua = i18n.ua ?? {}

  return (
    <>
      <div className="cfg-m__field">
        <div className="cfg-m__field-label">Поріг (грн)</div>
        <div className="cfg-m__slider-row">
          <input type="range" min={100} max={5000} step={100} value={threshold}
            onChange={(e) => onChange('threshold', Number(e.target.value))}
            className="cfg-m__slider" />
          <span className="cfg-m__slider-val" style={{ color: '#3B82F6' }}>{threshold} ₴</span>
        </div>
      </div>

      <div className="cfg-m__toggle-row">
        <span>Плаваючий віджет</span>
        <ToggleButton checked={floatingWidget} onChange={(v) => onChange('floatingWidget', v)} />
      </div>

      <div className="cfg-m__color-row">
        <ColorField label="Фон" value={background} onChange={(v) => onChange('background', v)} />
        <ColorField label="Досягнуто" value={achievedBg} onChange={(v) => onChange('achievedBackground', v)} />
      </div>
      <div className="cfg-m__color-row">
        <ColorField label="Текст" value={textColor} onChange={(v) => onChange('textColor', v)} />
      </div>

      <div className="cfg-m__field">
        <div className="cfg-m__field-label">Текст підказки (ua)</div>
        <input type="text" value={ua.text ?? ''}
          onChange={(e) => onI18nChange('ua', 'text', e.target.value)}
          className="cfg-m__item-input" style={{ width: '100%' }} />
      </div>
      <div className="cfg-m__field">
        <div className="cfg-m__field-label">Текст досягнення (ua)</div>
        <input type="text" value={ua.achieved ?? ''}
          onChange={(e) => onI18nChange('ua', 'achieved', e.target.value)}
          className="cfg-m__item-input" style={{ width: '100%' }} />
      </div>
    </>
  )
}

// ─── Reusable field components ────────────────────────────────────────────────

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

// ─── Config Preview (JSON) ────────────────────────────────────────────────────

function ConfigPreview({ config, i18n, moduleSlug }: {
  config: Record<string, unknown>
  i18n: Record<string, unknown>
  moduleSlug: string
}) {
  const full = { ...config, i18n }
  const lines = JSON.stringify({ [moduleSlug]: full }, null, 2).split('\n')
  return (
    <>
      {lines.map((line, i) => {
        let color = '#888888'
        if (line.includes('"i18n"') || line.includes('"colors"')) color = '#7AB8F5'
        if (line.includes('true') || line.includes('false')) color = '#A8D5A2'
        if (line.match(/"[^"]+": "/)) color = '#CCCCCC'
        if (line.match(/^\s*"[^"]+": [0-9]/)) color = '#F59E0B'
        if (i === 0) color = '#A8D5A2'
        return <div key={i} style={{ color }}>{line || '\u00A0'}</div>
      })}
    </>
  )
}

// ─── Preview bottom sheet ─────────────────────────────────────────────────────

function PreviewSheet({
  config, scriptTag: tag, viewMode, onViewMode, onCopy, copied, onClose, activeSlug,
}: {
  config: Record<string, unknown>
  scriptTag: string
  viewMode: 'desktop' | 'mobile'
  onViewMode: (mode: 'desktop' | 'mobile') => void
  onCopy: () => void
  copied: boolean
  onClose: () => void
  activeSlug: string
}) {
  const bgColor = (deepGet(config, 'colors.desktop.backgroundColor') ?? '#1e1b4b') as string
  const txtColor = (deepGet(config, 'colors.desktop.textColor') ?? '#e0e7ff') as string

  return (
    <>
      <div className="cfg-m__overlay" role="presentation" onClick={onClose} />
      <div className="cfg-m__sheet">
        <div className="cfg-m__sheet-handle"><span /></div>

        <div className="cfg-m__sheet-head">
          <strong>Попередній перегляд</strong>
          <div className="cfg-m__view-toggle">
            <button type="button" className={viewMode === 'desktop' ? 'active' : ''} onClick={() => onViewMode('desktop')} aria-label="Десктоп">
              <Monitor size={14} strokeWidth={2} />
            </button>
            <button type="button" className={viewMode === 'mobile' ? 'active' : ''} onClick={() => onViewMode('mobile')} aria-label="Мобільний">
              <Smartphone size={14} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="cfg-m__phone-wrap">
          <div className="cfg-m__phone">
            <div className="cfg-m__phone-cam"><span /></div>
            {activeSlug === 'marquee' && (
              <div className="cfg-m__phone-marquee" style={{ background: bgColor, color: txtColor }}>
                {(config.i18n as { ua?: string[] } | undefined)?.ua?.map((t, i) => (
                  <span key={i}>• {t} </span>
                )) ?? <span>• АКЦIЯ •</span>}
              </div>
            )}
            <div className="cfg-m__phone-content">
              <div className="cfg-m__phone-nav">
                <div className="cfg-m__phone-nav-dots"><span /><span /><span /></div>
                <div className="cfg-m__phone-url" />
              </div>
              <div className="cfg-m__phone-hero" />
              <div className="cfg-m__phone-line" />
              <div className="cfg-m__phone-line" style={{ width: '60%' }} />
              <div className="cfg-m__phone-btn" style={{ background: bgColor }}>Замовити</div>
            </div>
          </div>
        </div>

        <div className="cfg-m__sheet-script">
          <div className="cfg-m__sheet-script-head">
            <span>Скрипт для вставки</span>
            <button type="button" className="cfg-m__sheet-copy" onClick={onCopy}>
              <Copy size={12} strokeWidth={2} />
              {copied ? 'Скопійовано' : 'Копіювати'}
            </button>
          </div>
          <pre className="cfg-m__sheet-code">{tag}</pre>
          <p className="cfg-m__sheet-hint">Вставте перед закриваючим тегом &lt;/body&gt;</p>
        </div>

        <div className="cfg-m__sheet-actions">
          <button type="button" className="cfg-m__sheet-close" onClick={onClose}>Закрити</button>
          <button type="button" className="cfg-m__sheet-apply" onClick={onClose}>Застосувати</button>
        </div>
      </div>
    </>
  )
}
