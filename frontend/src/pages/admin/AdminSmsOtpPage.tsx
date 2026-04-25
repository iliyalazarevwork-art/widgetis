import { useCallback, useEffect, useState } from 'react'
import {
  Check,
  MessageSquare,
  Plus,
  Send,
  Settings,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { del, get, post, put } from '../../api/client'
import { AdminScreenLayout } from './AdminScreenLayout'
import './admin-sms-otp.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Site {
  id: string
  domain: string
  name: string | null
}

interface OtpProviderConfig {
  id: string
  site_id: string
  provider: string
  channel: string
  sender_name: string
  templates: Record<string, string>
  is_active: boolean
  priority: number
  created_at: string | null
  updated_at: string | null
}

interface SitesResponse {
  data: Site[]
}

interface ProvidersResponse {
  data: OtpProviderConfig[]
}

interface ProviderPayload {
  site_id: string
  provider: string
  credentials: { token: string }
  sender_name: string
  templates: Record<string, string>
  is_active: boolean
}

const LOCALES = ['uk', 'ru', 'en', 'pl'] as const
type Locale = (typeof LOCALES)[number]

const LOCALE_LABELS: Record<Locale, string> = {
  uk: 'Українська',
  ru: 'Російська',
  en: 'Англійська',
  pl: 'Польська',
}

const PROVIDER_OPTIONS = [
  { value: 'turbosms', label: 'TurboSMS' },
  { value: 'vonage', label: 'Vonage (незабаром)', disabled: true },
]

const DEFAULT_TEMPLATES: Record<Locale, string> = {
  uk: 'Ваш код підтвердження: {code}. Дійсний 5 хвилин.',
  ru: 'Ваш код подтверждения: {code}. Действителен 5 минут.',
  en: 'Your confirmation code: {code}. Valid for 5 minutes.',
  pl: 'Twój kod potwierdzenia: {code}. Ważny przez 5 minut.',
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function providerLabel(value: string): string {
  return PROVIDER_OPTIONS.find((p) => p.value === value)?.label ?? value
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ProviderFormData {
  provider: string
  token: string
  sender_name: string
  templates: Record<string, string>
  is_active: boolean
}

function emptyForm(): ProviderFormData {
  return {
    provider: 'turbosms',
    token: '',
    sender_name: '',
    templates: { ...DEFAULT_TEMPLATES },
    is_active: true,
  }
}

function configToForm(cfg: OtpProviderConfig): ProviderFormData {
  return {
    provider: cfg.provider,
    token: '',
    sender_name: cfg.sender_name ?? '',
    templates: {
      uk: cfg.templates['uk'] ?? DEFAULT_TEMPLATES.uk,
      ru: cfg.templates['ru'] ?? DEFAULT_TEMPLATES.ru,
      en: cfg.templates['en'] ?? DEFAULT_TEMPLATES.en,
      pl: cfg.templates['pl'] ?? DEFAULT_TEMPLATES.pl,
    },
    is_active: cfg.is_active,
  }
}

interface ProviderModalProps {
  siteId: string
  editing: OtpProviderConfig | null
  onClose: () => void
  onSaved: () => void
}

function ProviderModal({ siteId, editing, onClose, onSaved }: ProviderModalProps) {
  const [form, setForm] = useState<ProviderFormData>(
    editing ? configToForm(editing) : emptyForm(),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setField<K extends keyof ProviderFormData>(key: K, value: ProviderFormData[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function setTemplate(locale: string, value: string): void {
    setForm((prev) => ({
      ...prev,
      templates: { ...prev.templates, [locale]: value },
    }))
  }

  async function handleSave(): Promise<void> {
    if (!form.token && !editing) {
      setError('Введіть API-токен TurboSMS')
      return
    }
    if (!form.sender_name.trim()) {
      setError("Введіть ім'я відправника")
      return
    }

    setSaving(true)
    setError(null)

    const payload: ProviderPayload = {
      site_id: siteId,
      provider: form.provider,
      credentials: { token: form.token },
      sender_name: form.sender_name.trim(),
      templates: form.templates,
      is_active: form.is_active,
    }

    // If editing and token not changed, omit credentials to avoid clearing it
    if (editing && !form.token) {
      const { credentials: _creds, ...rest } = payload
      void _creds
      try {
        await put<{ data: OtpProviderConfig }>(`/profile/widgets/sms-otp/providers/${editing.id}`, rest)
        toast.success('Провайдера оновлено')
        onSaved()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Помилка збереження')
      } finally {
        setSaving(false)
      }
      return
    }

    try {
      if (editing) {
        await put<{ data: OtpProviderConfig }>(`/profile/widgets/sms-otp/providers/${editing.id}`, payload)
        toast.success('Провайдера оновлено')
      } else {
        await post<{ data: OtpProviderConfig }>('/profile/widgets/sms-otp/providers', payload)
        toast.success('Провайдера додано')
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка збереження')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="smsotp-modal__backdrop" onClick={onClose}>
      <div
        className="smsotp-modal__dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={editing ? 'Редагувати провайдера' : 'Додати провайдера'}
      >
        <div className="smsotp-modal__header">
          <h2>{editing ? 'Редагувати провайдера' : 'Додати провайдера'}</h2>
          <button type="button" className="smsotp-modal__close" onClick={onClose} aria-label="Закрити">
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="smsotp-modal__body">
          {error && <div className="smsotp-modal__error">{error}</div>}

          <div className="smsotp-modal__field">
            <label className="smsotp-modal__label">Провайдер</label>
            <select
              className="smsotp-modal__select"
              value={form.provider}
              onChange={(e) => setField('provider', e.target.value)}
            >
              {PROVIDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="smsotp-modal__field">
            <label className="smsotp-modal__label">
              API-токен TurboSMS
              {editing && <span className="smsotp-modal__hint"> (залиште порожнім щоб не змінювати)</span>}
            </label>
            <input
              type="password"
              className="smsotp-modal__input"
              placeholder={editing ? '••••••••••••••••' : 'Вставте токен'}
              value={form.token}
              onChange={(e) => setField('token', e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="smsotp-modal__field">
            <label className="smsotp-modal__label">Ім'я відправника (Sender Name)</label>
            <input
              type="text"
              className="smsotp-modal__input"
              placeholder="MyShop"
              value={form.sender_name}
              onChange={(e) => setField('sender_name', e.target.value)}
            />
          </div>

          <div className="smsotp-modal__section-title">Шаблони SMS</div>
          {LOCALES.map((locale) => (
            <div key={locale} className="smsotp-modal__field">
              <label className="smsotp-modal__label">{LOCALE_LABELS[locale]}</label>
              <input
                type="text"
                className="smsotp-modal__input"
                placeholder={DEFAULT_TEMPLATES[locale]}
                value={form.templates[locale] ?? ''}
                onChange={(e) => setTemplate(locale, e.target.value)}
              />
              <div className="smsotp-modal__field-hint">Використовуйте {'{code}'} для підстановки коду</div>
            </div>
          ))}

          <div className="smsotp-modal__field smsotp-modal__field--toggle">
            <label className="smsotp-modal__label">Активний</label>
            <button
              type="button"
              className={`smsotp-modal__toggle ${form.is_active ? 'smsotp-modal__toggle--on' : ''}`}
              onClick={() => setField('is_active', !form.is_active)}
              aria-pressed={form.is_active}
            >
              <span className="smsotp-modal__toggle-thumb" />
            </button>
          </div>
        </div>

        <div className="smsotp-modal__footer">
          <button type="button" className="adminx-ghost-btn" onClick={onClose} disabled={saving}>
            Скасувати
          </button>
          <button
            type="button"
            className="adminx-primary-btn"
            onClick={() => { void handleSave() }}
            disabled={saving}
          >
            {saving ? 'Збереження...' : (editing ? 'Зберегти' : 'Додати')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Test send modal ─────────────────────────────────────────────────────────

interface TestSendModalProps {
  config: OtpProviderConfig
  onClose: () => void
}

function TestSendModal({ config, onClose }: TestSendModalProps) {
  const [phone, setPhone] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<'success' | 'error' | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSend(): Promise<void> {
    if (!phone.trim()) return
    setSending(true)
    setResult(null)

    try {
      await post(`/profile/widgets/sms-otp/providers/${config.id}/test`, { phone: phone.trim() })
      setResult('success')
      toast.success('Тестову SMS надіслано успішно')
    } catch (err) {
      setResult('error')
      setErrorMsg(err instanceof Error ? err.message : 'Помилка надсилання')
      toast.error('Не вдалося надіслати SMS')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="smsotp-modal__backdrop" onClick={onClose}>
      <div
        className="smsotp-modal__dialog smsotp-modal__dialog--small"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Тестова відправка"
      >
        <div className="smsotp-modal__header">
          <h2>Тестова відправка</h2>
          <button type="button" className="smsotp-modal__close" onClick={onClose} aria-label="Закрити">
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="smsotp-modal__body">
          <p className="smsotp-modal__desc">
            Надіслати тестову SMS через провайдера <strong>{providerLabel(config.provider)}</strong>{' '}
            (відправник: <strong>{config.sender_name}</strong>)
          </p>

          <div className="smsotp-modal__field">
            <label className="smsotp-modal__label">Номер телефону</label>
            <input
              type="tel"
              className="smsotp-modal__input"
              placeholder="+380501234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {result === 'success' && (
            <div className="smsotp-modal__success-msg">
              <Check size={14} strokeWidth={2.5} />
              SMS надіслано. Перевірте телефон.
            </div>
          )}
          {result === 'error' && (
            <div className="smsotp-modal__error">{errorMsg}</div>
          )}
        </div>

        <div className="smsotp-modal__footer">
          <button type="button" className="adminx-ghost-btn" onClick={onClose}>
            Закрити
          </button>
          <button
            type="button"
            className="adminx-primary-btn"
            onClick={() => { void handleSend() }}
            disabled={sending || !phone.trim()}
          >
            <Send size={14} strokeWidth={2} />
            {sending ? 'Надсилання...' : 'Надіслати'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Provider card ────────────────────────────────────────────────────────────

interface ProviderCardProps {
  config: OtpProviderConfig
  onEdit: () => void
  onDelete: () => void
  onTest: () => void
}

function ProviderCard({ config, onEdit, onDelete, onTest }: ProviderCardProps) {
  return (
    <article className="smsotp-card">
      <div className="smsotp-card__head">
        <div className="smsotp-card__icon">
          <MessageSquare size={15} strokeWidth={2} />
        </div>
        <div className="smsotp-card__info">
          <strong>{providerLabel(config.provider)}</strong>
          <span>{config.sender_name}</span>
        </div>
        <div className="smsotp-card__badges">
          <span className={`adminx-badge ${config.is_active ? 'adminx-badge--ok' : 'adminx-badge--warn'}`}>
            {config.is_active ? 'Активний' : 'Неактивний'}
          </span>
        </div>
      </div>

      <div className="smsotp-card__actions">
        <button type="button" className="adminx-ghost-btn smsotp-card__action-btn" onClick={onTest}>
          <Send size={13} strokeWidth={2} />
          Тест
        </button>
        <button type="button" className="adminx-ghost-btn smsotp-card__action-btn" onClick={onEdit}>
          <Settings size={13} strokeWidth={2} />
          Редагувати
        </button>
        <button type="button" className="adminx-ghost-btn smsotp-card__action-btn smsotp-card__action-btn--danger" onClick={onDelete}>
          <Trash2 size={13} strokeWidth={2} />
          Видалити
        </button>
      </div>
    </article>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdminSmsOtpPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState<string>('')
  const [providers, setProviders] = useState<OtpProviderConfig[]>([])
  const [loadingSites, setLoadingSites] = useState(true)
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [editingConfig, setEditingConfig] = useState<OtpProviderConfig | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [testConfig, setTestConfig] = useState<OtpProviderConfig | null>(null)

  useEffect(() => {
    setLoadingSites(true)
    get<SitesResponse>('/profile/sites')
      .then((res) => {
        const list = res.data ?? []
        setSites(list)
        if (list.length > 0 && !selectedSiteId) {
          setSelectedSiteId(list[0].id)
        }
      })
      .catch(() => {
        toast.error('Не вдалося завантажити сайти')
      })
      .finally(() => setLoadingSites(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadProviders = useCallback(() => {
    if (!selectedSiteId) return
    setLoadingProviders(true)
    get<ProvidersResponse>('/profile/widgets/sms-otp/providers', { site_id: selectedSiteId })
      .then((res) => setProviders(res.data ?? []))
      .catch(() => {
        toast.error('Не вдалося завантажити провайдерів')
        setProviders([])
      })
      .finally(() => setLoadingProviders(false))
  }, [selectedSiteId])

  useEffect(() => {
    loadProviders()
  }, [loadProviders])

  function handleDelete(configId: string): void {
    if (!window.confirm('Видалити провайдера? Цю дію неможливо скасувати.')) return
    del(`/profile/widgets/sms-otp/providers/${configId}`)
      .then(() => {
        toast.success('Провайдера видалено')
        loadProviders()
      })
      .catch(() => toast.error('Не вдалося видалити провайдера'))
  }

  function openAddModal(): void {
    setEditingConfig(null)
    setModalOpen(true)
  }

  function openEditModal(cfg: OtpProviderConfig): void {
    setEditingConfig(cfg)
    setModalOpen(true)
  }

  function handleModalSaved(): void {
    setModalOpen(false)
    setEditingConfig(null)
    loadProviders()
  }

  const selectedSite = sites.find((s) => s.id === selectedSiteId)

  return (
    <AdminScreenLayout
      mode="dashboard"
      title="SMS OTP"
      subtitle="Провайдери підтвердження"
    >
      <div className="smsotp-page mobile-plain__content">

        {/* Site selector */}
        <section className="admin-card adminx-section smsotp-page__site-select">
          <div className="smsotp-page__site-row">
            <label className="smsotp-page__site-label">
              <Settings size={13} strokeWidth={2} />
              Сайт
            </label>
            {loadingSites ? (
              <span className="smsotp-page__loading">Завантаження...</span>
            ) : sites.length === 0 ? (
              <span className="adminx-muted">Немає підключених сайтів</span>
            ) : (
              <select
                className="smsotp-page__site-dropdown"
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.domain}
                  </option>
                ))}
              </select>
            )}
          </div>
        </section>

        {/* Providers list */}
        {selectedSiteId && (
          <section className="admin-card adminx-section">
            <div className="smsotp-page__section-head">
              <h2 className="admin-card__title">Провайдери SMS</h2>
              <button type="button" className="adminx-primary-btn" onClick={openAddModal}>
                <Plus size={14} strokeWidth={2.5} />
                Додати
              </button>
            </div>

            {loadingProviders ? (
              <p className="orders-mobile__empty">Завантаження...</p>
            ) : providers.length === 0 ? (
              <div className="smsotp-page__empty">
                <MessageSquare size={28} strokeWidth={1.5} />
                <p>Провайдерів не налаштовано</p>
                <p className="smsotp-page__empty-sub">
                  Додайте TurboSMS щоб активувати SMS-верифікацію для{' '}
                  <strong>{selectedSite?.domain ?? ''}</strong>
                </p>
              </div>
            ) : (
              <div className="smsotp-page__list">
                {providers.map((cfg) => (
                  <ProviderCard
                    key={cfg.id}
                    config={cfg}
                    onEdit={() => openEditModal(cfg)}
                    onDelete={() => handleDelete(cfg.id)}
                    onTest={() => setTestConfig(cfg)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Info card */}
        <section className="admin-card adminx-section smsotp-page__info">
          <h2 className="admin-card__title">Як це працює</h2>
          <ol className="smsotp-page__steps">
            <li>Клієнт потрапляє на сторінку оформлення замовлення з Google або Facebook</li>
            <li>Після введення номеру телефону — з'являється кнопка «Отримати код»</li>
            <li>Видгет надсилає SMS через TurboSMS і верифікує код</li>
            <li>Лише підтверджені номери можуть оформити замовлення</li>
          </ol>
        </section>
      </div>

      {/* Provider modal */}
      {modalOpen && selectedSiteId && (
        <ProviderModal
          siteId={selectedSiteId}
          editing={editingConfig}
          onClose={() => setModalOpen(false)}
          onSaved={handleModalSaved}
        />
      )}

      {/* Test send modal */}
      {testConfig && (
        <TestSendModal
          config={testConfig}
          onClose={() => setTestConfig(null)}
        />
      )}
    </AdminScreenLayout>
  )
}
