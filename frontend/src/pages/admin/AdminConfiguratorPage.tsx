import { useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Wand2,
  Eye,
  Code2,
  Copy,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  Monitor,
  Smartphone,
} from 'lucide-react'
import { toast } from 'sonner'
import { widgets } from '../../data/widgets'
import { WidgetIcon } from '../../components/WidgetIcon'
import './configurator.css'

type MarqueePosition = 'top' | 'bottom'

interface MarqueeConfig {
  enabled: boolean
  bgColor: string
  textColor: string
  speed: number // seconds
  position: MarqueePosition
  items: string[]
  showClose: boolean
}

const DEFAULT_CONFIG: MarqueeConfig = {
  enabled: true,
  bgColor: '#2d5a3d',
  textColor: '#ffffff',
  speed: 18,
  position: 'top',
  items: [
    'Безкоштовна доставка від 3000 грн',
    '−10% при першій покупці',
    'Новинки тижня — кожен четвер',
  ],
  showClose: false,
}

type ViewMode = 'desktop' | 'mobile'

export function AdminConfiguratorPage() {
  const { slug } = useParams<{ slug: string }>()
  const activeSlug = slug || 'marquee'

  const widget = useMemo(() => widgets.find((w) => w.id === activeSlug), [activeSlug])
  const ownedWidgets = widgets.slice(0, 6) // Mock "owned" list

  const [config, setConfig] = useState<MarqueeConfig>(DEFAULT_CONFIG)
  const [viewMode, setViewMode] = useState<ViewMode>('desktop')
  const [copied, setCopied] = useState(false)

  const scriptCode = useMemo(() => {
    const cfg = JSON.stringify(
      {
        enabled: config.enabled,
        bg: config.bgColor,
        color: config.textColor,
        speed: config.speed,
        position: config.position,
        items: config.items,
        closeable: config.showClose,
      },
      null,
      2,
    )
    return `<!-- Widgetality Marquee -->
<script>
  window.WTY_MARQUEE = ${cfg};
</script>
<script async src="https://cdn.widgetality.com/widgets/marquee.js"></script>
<!-- /Widgetality Marquee -->`
  }, [config])

  function updateConfig<K extends keyof MarqueeConfig>(key: K, value: MarqueeConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  function updateItem(idx: number, value: string) {
    setConfig((prev) => ({
      ...prev,
      items: prev.items.map((t, i) => (i === idx ? value : t)),
    }))
  }

  function addItem() {
    setConfig((prev) => ({ ...prev, items: [...prev.items, 'Нова акція'] }))
  }

  function removeItem(idx: number) {
    if (config.items.length === 1) {
      toast.error('Треба залишити хоча б 1 текст')
      return
    }
    setConfig((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))
  }

  async function copyScript() {
    try {
      await navigator.clipboard.writeText(scriptCode)
      setCopied(true)
      toast.success('Скрипт скопійовано')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Не вдалося скопіювати')
    }
  }

  function resetConfig() {
    setConfig(DEFAULT_CONFIG)
    toast.success('Скинуто до стандартних налаштувань')
  }

  if (!widget) {
    return (
      <div className="admin-placeholder">
        <p>Віджет не знайдено</p>
      </div>
    )
  }

  return (
    <>
      <header className="admin-page__head cfg__head">
        <div>
          <h1 className="admin-page__title">Конфігуратор</h1>
          <p className="admin-page__sub">Налаштуй і згенеруй скрипт для вставки в магазин</p>
        </div>
        <button className="cfg__reset" onClick={resetConfig} type="button">
          <RefreshCw size={13} strokeWidth={2.25} />
          <span>Скинути</span>
        </button>
      </header>

      {/* Widget picker */}
      <div className="cfg__widget-picker">
        {ownedWidgets.map((w) => {
          const isActive = w.id === activeSlug
          return (
            <Link
              key={w.id}
              to={`/admin/widgets/${w.id}`}
              className={`cfg__widget-btn ${isActive ? 'cfg__widget-btn--active' : ''}`}
            >
              <WidgetIcon name={w.icon} size={18} />
              <span>{w.title}</span>
            </Link>
          )
        })}
      </div>

      <div className="cfg__layout">
        {/* Settings panel */}
        <aside className="cfg__panel">
          <div className="cfg__panel-head">
            <Wand2 size={15} strokeWidth={2} />
            <h2>Налаштування</h2>
          </div>

          {/* General */}
          <section className="cfg__section">
            <label className="cfg__field cfg__field--toggle">
              <div className="cfg__field-label">
                <strong>Увімкнути віджет</strong>
                <span>Показувати на сайті</span>
              </div>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => updateConfig('enabled', e.target.checked)}
                className="cfg__toggle"
              />
            </label>
          </section>

          <div className="cfg__divider" />

          {/* Colors */}
          <section className="cfg__section">
            <h3 className="cfg__section-title">Кольори</h3>
            <div className="cfg__field">
              <label className="cfg__field-label">
                <strong>Фон</strong>
              </label>
              <div className="cfg__color">
                <input
                  type="color"
                  value={config.bgColor}
                  onChange={(e) => updateConfig('bgColor', e.target.value)}
                />
                <input
                  type="text"
                  value={config.bgColor}
                  onChange={(e) => updateConfig('bgColor', e.target.value)}
                  className="cfg__color-text"
                />
              </div>
            </div>
            <div className="cfg__field">
              <label className="cfg__field-label">
                <strong>Текст</strong>
              </label>
              <div className="cfg__color">
                <input
                  type="color"
                  value={config.textColor}
                  onChange={(e) => updateConfig('textColor', e.target.value)}
                />
                <input
                  type="text"
                  value={config.textColor}
                  onChange={(e) => updateConfig('textColor', e.target.value)}
                  className="cfg__color-text"
                />
              </div>
            </div>
          </section>

          <div className="cfg__divider" />

          {/* Speed */}
          <section className="cfg__section">
            <h3 className="cfg__section-title">Швидкість анімації</h3>
            <div className="cfg__field">
              <div className="cfg__slider-row">
                <input
                  type="range"
                  min={6}
                  max={40}
                  value={config.speed}
                  onChange={(e) => updateConfig('speed', Number(e.target.value))}
                  className="cfg__slider"
                />
                <span className="cfg__slider-value">{config.speed}с</span>
              </div>
              <span className="cfg__hint">Час одного повного циклу</span>
            </div>
          </section>

          <div className="cfg__divider" />

          {/* Position */}
          <section className="cfg__section">
            <h3 className="cfg__section-title">Позиція</h3>
            <div className="cfg__segmented">
              <button
                type="button"
                className={config.position === 'top' ? 'is-active' : ''}
                onClick={() => updateConfig('position', 'top')}
              >
                Зверху
              </button>
              <button
                type="button"
                className={config.position === 'bottom' ? 'is-active' : ''}
                onClick={() => updateConfig('position', 'bottom')}
              >
                Знизу
              </button>
            </div>
          </section>

          <div className="cfg__divider" />

          {/* Close button */}
          <section className="cfg__section">
            <label className="cfg__field cfg__field--toggle">
              <div className="cfg__field-label">
                <strong>Кнопка закриття</strong>
                <span>Дати користувачу закрити стрічку</span>
              </div>
              <input
                type="checkbox"
                checked={config.showClose}
                onChange={(e) => updateConfig('showClose', e.target.checked)}
                className="cfg__toggle"
              />
            </label>
          </section>

          <div className="cfg__divider" />

          {/* Items */}
          <section className="cfg__section">
            <div className="cfg__section-head">
              <h3 className="cfg__section-title">Тексти ({config.items.length})</h3>
              <button type="button" className="cfg__add-btn" onClick={addItem}>
                <Plus size={12} strokeWidth={2.5} />
                <span>Додати</span>
              </button>
            </div>
            <div className="cfg__items">
              {config.items.map((text, i) => (
                <div key={i} className="cfg__item">
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => updateItem(i, e.target.value)}
                    className="cfg__item-input"
                  />
                  <button
                    type="button"
                    className="cfg__item-remove"
                    onClick={() => removeItem(i)}
                    aria-label="Видалити"
                  >
                    <Trash2 size={13} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </aside>

        {/* Preview + Script */}
        <div className="cfg__preview-wrap">
          <div className="cfg__preview-head">
            <div className="cfg__preview-title">
              <Eye size={15} strokeWidth={2} />
              <span>Попередній перегляд</span>
            </div>
            <div className="cfg__view-toggle" role="tablist">
              <button
                type="button"
                className={viewMode === 'desktop' ? 'is-active' : ''}
                onClick={() => setViewMode('desktop')}
                aria-label="Десктоп"
              >
                <Monitor size={14} strokeWidth={2} />
              </button>
              <button
                type="button"
                className={viewMode === 'mobile' ? 'is-active' : ''}
                onClick={() => setViewMode('mobile')}
                aria-label="Мобільний"
              >
                <Smartphone size={14} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Live preview */}
          <div className={`cfg__preview cfg__preview--${viewMode}`}>
            <div className="cfg__preview-browser">
              <div className="cfg__preview-dots">
                <span />
                <span />
                <span />
              </div>
              <div className="cfg__preview-url">store.com.ua</div>
            </div>
            {config.enabled && config.position === 'top' && (
              <PreviewMarquee config={config} />
            )}
            <div className="cfg__preview-body">
              <div className="cfg__preview-nav">
                <strong>store</strong>
                <div className="cfg__preview-nav-links">
                  <span>Головна</span>
                  <span>Каталог</span>
                  <span>Доставка</span>
                  <span>Контакти</span>
                </div>
              </div>
              <div className="cfg__preview-hero">
                <div className="cfg__preview-hero-img" />
                <div className="cfg__preview-hero-text">
                  <div className="cfg__preview-hero-title" />
                  <div className="cfg__preview-hero-para" />
                  <div className="cfg__preview-hero-para" style={{ width: '70%' }} />
                  <div className="cfg__preview-hero-btn">Замовити</div>
                </div>
              </div>
            </div>
            {config.enabled && config.position === 'bottom' && (
              <PreviewMarquee config={config} />
            )}
          </div>

          {/* Generated script */}
          <div className="cfg__script-head">
            <div className="cfg__preview-title">
              <Code2 size={15} strokeWidth={2} />
              <span>Скрипт для встановлення</span>
            </div>
            <button type="button" className="cfg__copy-btn" onClick={copyScript}>
              {copied ? (
                <>
                  <Check size={13} strokeWidth={2.5} />
                  <span>Скопійовано</span>
                </>
              ) : (
                <>
                  <Copy size={13} strokeWidth={2} />
                  <span>Копіювати</span>
                </>
              )}
            </button>
          </div>
          <pre className="cfg__script">
            <code>{scriptCode}</code>
          </pre>
          <p className="cfg__script-hint">
            Встав цей код перед закриваючим тегом <code>&lt;/body&gt;</code> на своєму сайті.
          </p>
        </div>
      </div>
    </>
  )
}

// ===== Live marquee preview =====

function PreviewMarquee({ config }: { config: MarqueeConfig }) {
  const animationKey = `${config.speed}-${config.items.join('|')}`
  return (
    <div
      className="cfg-mq"
      style={{ background: config.bgColor, color: config.textColor }}
      key={animationKey}
    >
      <div
        className="cfg-mq__track"
        style={{ animationDuration: `${config.speed}s` }}
      >
        {[...config.items, ...config.items].map((text, i) => (
          <span key={i} className="cfg-mq__item">
            {text}
          </span>
        ))}
      </div>
      {config.showClose && (
        <button className="cfg-mq__close" aria-label="Закрити" type="button">
          ×
        </button>
      )}
    </div>
  )
}
