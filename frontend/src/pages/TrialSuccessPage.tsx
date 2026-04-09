import { useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import {
  Check,
  Code2,
  Users,
  ArrowLeft,
  ArrowRight,
  Send,
  Phone,
  MessageCircle,
  Copy,
  XCircle,
  LoaderCircle,
  CreditCard,
  Wallet,
  Play,
} from 'lucide-react'
import { toast } from 'sonner'
import { get, post } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import './TrialSuccessPage.css'

const ACTIVE_STATUSES = new Set(['active', 'trial', 'past_due'])
const POLL_INTERVAL_MS = 1500
const POLL_MAX_ATTEMPTS = 6

interface SignupData {
  email: string
  site: string
  platform: string
  plan: string
  billing: string
  siteId?: number | null
  scriptTag?: string | null
}

type Choice = null | 'self' | 'concierge'
type Channel = 'telegram' | 'viber' | 'whatsapp'

function siteDisplayHost(site: string): string {
  try { return new URL(site).host } catch { return site.replace(/^https?:\/\//i, '') }
}

// ─── Shared header ───────────────────────────────────────────────
function PageHeader() {
  return <Header />
}

// ─── Shared footer ───────────────────────────────────────────────
function PageFooter() {
  return <Footer />
}

// ─── Success icon ─────────────────────────────────────────────────
function SuccessIcon() {
  return (
    <div style={{
      width: 80, height: 80, borderRadius: 999,
      background: 'rgba(34,197,94,0.09)',
      border: '2px solid rgba(34,197,94,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Check size={36} strokeWidth={2.5} style={{ color: '#22C55E' }} />
    </div>
  )
}

// ─── Screen 1: Choice ─────────────────────────────────────────────
function ChoiceScreen({ data, onChoice }: { data: SignupData; onChoice: (c: 'self' | 'concierge') => void }) {
  const hasSite = Boolean(data.site)
  const siteHost = hasSite ? siteDisplayHost(data.site) : ''

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PageHeader />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, padding: '40px 20px 80px', maxWidth: 375, width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <SuccessIcon />
          <h1 style={{ margin: 0, color: '#F0F0F0', fontFamily: 'Outfit, Inter, sans-serif', fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>
            Оплата пройшла успішно!
          </h1>
          <p style={{ margin: 0, color: '#8A8A8A', fontSize: 14, lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>
            {hasSite
              ? `Оберіть, як ви хочете встановити віджети на ${siteHost}`
              : 'Оберіть, як ви хочете підключити віджети до свого магазину'}
          </p>
        </div>

        <span style={{ color: '#7AA2D6', fontSize: 11, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
          Ключовий блок: спосіб підключення
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { key: 'self' as const, icon: <Code2 size={28} strokeWidth={2} style={{ color: '#3B82F6' }} />, title: 'Встановлю сам', sub: 'Покрокова інструкція — займе 2 хвилини' },
            { key: 'concierge' as const, icon: <Users size={28} strokeWidth={2} style={{ color: '#3B82F6' }} />, title: 'З допомогою менеджера', sub: 'Ми все зробимо за вас' },
          ].map(({ key, icon, title, sub }) => (
            <button key={key} onClick={() => onChoice(key)} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: 18,
              background: '#161616', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, cursor: 'pointer', textAlign: 'left',
            }}>
              {icon}
              <div style={{ flex: 1 }}>
                <div style={{ color: '#F0F0F0', fontSize: 15, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>{title}</div>
                <div style={{ color: '#8A8A8A', fontSize: 13, fontFamily: 'Inter, sans-serif', marginTop: 2 }}>{sub}</div>
              </div>
              <ArrowRight size={20} strokeWidth={2} style={{ color: '#8A8A8A', flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </div>
      <PageFooter />
    </div>
  )
}

// ─── Screen 2: Self install ───────────────────────────────────────
function SelfScreen({ data, onBack }: { data: SignupData; onBack: () => void }) {
  const [copied, setCopied] = useState(false)
  const [scriptTag, setScriptTag] = useState<string>(data.scriptTag?.trim() ?? '')
  const [scriptLoading, setScriptLoading] = useState<boolean>(!data.scriptTag)
  const hasSite = Boolean(data.site)
  const siteHost = hasSite ? siteDisplayHost(data.site) : ''

  useEffect(() => {
    if (data.scriptTag) {
      setScriptLoading(false)
      return
    }

    let cancelled = false

    async function resolveScriptTag() {
      try {
        if (data.siteId) {
          const scriptRes = await get<{ data: { script_tag: string } }>(`/profile/sites/${data.siteId}/script`)
          if (!cancelled && scriptRes.data.script_tag) {
            setScriptTag(scriptRes.data.script_tag)
          }
          return
        }

        const sitesRes = await get<{ data: Array<{ id: number }> }>('/profile/sites')
        const firstSiteId = sitesRes.data?.[0]?.id

        if (!firstSiteId) {
          return
        }

        const scriptRes = await get<{ data: { script_tag: string } }>(`/profile/sites/${firstSiteId}/script`)
        if (!cancelled && scriptRes.data.script_tag) {
          setScriptTag(scriptRes.data.script_tag)
        }
      } catch {
        // Keep UI usable even if script lookup fails.
      } finally {
        if (!cancelled) {
          setScriptLoading(false)
        }
      }
    }

    void resolveScriptTag()

    return () => {
      cancelled = true
    }
  }, [data.scriptTag, data.siteId])

  async function handleCopy() {
    if (!scriptTag) {
      return
    }

    try {
      await navigator.clipboard.writeText(scriptTag)
      setCopied(true)
      toast.success('Скрипт скопійовано')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Не вдалося скопіювати')
    }
  }

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PageHeader />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, padding: '24px 20px 60px', maxWidth: 375, width: '100%', margin: '0 auto' }}>

        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none',
          border: 'none', cursor: 'pointer', padding: 0, color: '#8A8A8A',
        }}>
          <ArrowLeft size={14} strokeWidth={2} style={{ color: '#8A8A8A' }} />
          <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>Назад до вибору</span>
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <SuccessIcon />
          <h1 style={{ margin: 0, color: '#F0F0F0', fontFamily: 'Outfit, Inter, sans-serif', fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>
            Оплата пройшла успішно!
          </h1>
          <p style={{ margin: 0, color: '#8A8A8A', fontSize: 14, lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>
            Крок 2: вставте скрипт у CMS магазину
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ color: '#7AA2D6', fontSize: 11, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
            Ключовий блок: код для встановлення
          </span>
          <div style={{
            background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <code style={{ color: '#4ADE80', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, lineHeight: 1.6, wordBreak: 'break-all' }}>
              {scriptLoading ? 'Завантажуємо скрипт…' : (scriptTag || 'Додайте сайт у кабінеті, щоб отримати код встановлення.')}
            </code>
            <button onClick={handleCopy} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px',
              background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, cursor: 'pointer', color: '#F0F0F0',
              fontSize: 13, fontFamily: 'Inter, sans-serif', alignSelf: 'flex-start',
            }} disabled={scriptLoading || !scriptTag}>
              <Copy size={14} strokeWidth={2} />
              {copied ? 'Скопійовано' : 'Скопіювати'}
            </button>
          </div>
        </div>

        {hasSite && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, color: '#F0F0F0', fontSize: 15, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
              Інструкція для {siteHost}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { n: 1, text: <>Перейдіть до адмін-панелі: <a href={`https://${siteHost}/edit/settings/general`} target="_blank" rel="noreferrer" style={{ color: '#3B82F6' }}>{siteHost}/edit/settings/general</a></> },
                { n: 2, text: <>Перейдіть: <strong>Налаштування → Скрипти перед тегом &lt;/body&gt;</strong></> },
                { n: 3, text: 'Вставте скопійований код у це поле' },
                { n: 4, text: <><strong>«Зберегти»</strong></> },
              ].map(({ n, text }) => (
                <div key={n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 999, background: '#161616',
                    border: '1px solid rgba(255,255,255,0.1)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ color: '#8A8A8A', fontSize: 12, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>{n}</span>
                  </div>
                  <span style={{ color: '#8A8A8A', fontSize: 13, lineHeight: 1.6, fontFamily: 'Inter, sans-serif', paddingTop: 2 }}>{text}</span>
                </div>
              ))}
            </div>

            <div style={{
              height: 200, background: '#080808', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 999, background: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Play size={20} strokeWidth={2} style={{ color: '#fff', marginLeft: 2 }} />
              </div>
            </div>
          </div>
        )}

        <div style={{
          background: '#161616', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <span style={{ color: '#8A8A8A', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Виникли труднощі?</span>
          <button
            onClick={() => { window.location.href = 'https://t.me/widgetis_support' }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
              background: '#0D1F3C', border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: 8, cursor: 'pointer', color: '#3B82F6',
              fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif', alignSelf: 'flex-start',
            }}
          >
            <Send size={16} strokeWidth={2} />
            Написати менеджеру
          </button>
        </div>

      </div>
      <PageFooter />
    </div>
  )
}

// ─── Screen 3: Manager / channel selection ────────────────────────
function ManagerScreen({ data, onBack }: { data: SignupData; onBack: () => void }) {
  const [selected, setSelected] = useState<Channel>('telegram')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const channels: { key: Channel; label: string; icon: React.ReactNode }[] = [
    { key: 'telegram', label: 'Telegram', icon: <Send size={22} strokeWidth={2} /> },
    { key: 'viber', label: 'Viber', icon: <Phone size={22} strokeWidth={2} /> },
    { key: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={22} strokeWidth={2} /> },
  ]

  async function handleSend() {
    if (sending) return
    setSending(true)
    try {
      await post('/profile/support-requests', {
        type: 'install_help',
        site_id: data.siteId ?? null,
        messenger: selected,
        message: `Клієнт обрав допомогу з підключенням. Канал: ${selected}. Email: ${data.email}`,
      })
      setSent(true)
      toast.success('Заявку відправлено')
    } catch {
      toast.error('Не вдалося відправити заявку')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PageHeader />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 20px 60px', maxWidth: 375, width: '100%', margin: '0 auto' }}>

        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none',
          border: 'none', cursor: 'pointer', padding: 0, color: '#8A8A8A',
        }}>
          <ArrowLeft size={14} strokeWidth={2} style={{ color: '#8A8A8A' }} />
          <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>Назад до вибору</span>
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <SuccessIcon />
          <h1 style={{ margin: 0, color: '#F0F0F0', fontFamily: 'Outfit, Inter, sans-serif', fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>
            Оплата пройшла успішно!
          </h1>
          <p style={{ margin: 0, color: '#8A8A8A', fontSize: 14, lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>
            Крок 2: оберіть канал зв'язку з менеджером
          </p>
        </div>

        <span style={{ color: '#7AA2D6', fontSize: 11, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
          Ключовий блок: канал зв'язку
        </span>

        {!sent ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {channels.map(({ key, label, icon }) => {
                const isActive = selected === key
                return (
                  <button key={key} onClick={() => setSelected(key)} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                    background: isActive ? '#0D1F3C' : '#161616',
                    border: `1px solid ${isActive ? '#3B82F6' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 12, cursor: 'pointer',
                  }}>
                    <span style={{ color: isActive ? '#3B82F6' : '#8A8A8A' }}>{icon}</span>
                    <span style={{ flex: 1, color: isActive ? '#F0F0F0' : '#8A8A8A', fontSize: 15, fontWeight: 600, fontFamily: 'Inter, sans-serif', textAlign: 'left' }}>
                      {label}
                    </span>
                    {isActive && <Check size={18} strokeWidth={2.5} style={{ color: '#3B82F6' }} />}
                  </button>
                )
              })}
            </div>

            <button onClick={handleSend} disabled={sending} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '18px 24px', background: '#3B82F6', borderRadius: 14, border: 'none',
              cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1,
              color: '#0A0A0A', fontSize: 16, fontWeight: 700, fontFamily: 'Outfit, Inter, sans-serif',
              letterSpacing: 0.2,
            }}>
              {sending ? <LoaderCircle size={18} strokeWidth={2} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              Надіслати заявку
              {!sending && <ArrowRight size={16} strokeWidth={2.5} />}
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center', padding: '20px 0' }}>
            <p style={{ margin: 0, color: '#8A8A8A', fontSize: 14, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>
              Менеджер напише вам у <strong style={{ color: '#F0F0F0' }}>{channels.find(c => c.key === selected)?.label}</strong> протягом 15 хвилин.
            </p>
            <Link to="/cabinet" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '16px 24px', background: '#3B82F6', borderRadius: 14,
              color: '#0A0A0A', fontSize: 15, fontWeight: 700, fontFamily: 'Inter, sans-serif',
              textDecoration: 'none',
            }}>
              До кабінету <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
          </div>
        )}
      </div>
      <PageFooter />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────
export function TrialSuccessPage() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [data, setData] = useState<SignupData | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'checking' | 'success' | 'failed'>('checking')
  const [choice, setChoice] = useState<Choice>(null)
  const pollRef = useRef(0)

  useEffect(() => {
    const raw = sessionStorage.getItem('wty_trial_signup')
    if (!raw) { navigate('/pricing', { replace: true }); return }

    try {
      setData(JSON.parse(raw) as SignupData)
    } catch {
      navigate('/pricing', { replace: true })
      return
    }

    refreshUser()
  }, [navigate, refreshUser])

  useEffect(() => {
    if (!data) return

    if (user?.subscription_status && ACTIVE_STATUSES.has(user.subscription_status)) {
      setPaymentStatus('success')
      return
    }

    if (pollRef.current >= POLL_MAX_ATTEMPTS) {
      setPaymentStatus('failed')
      return
    }

    if (paymentStatus === 'checking') {
      const timer = setTimeout(async () => {
        await refreshUser()
        pollRef.current += 1
      }, POLL_INTERVAL_MS)
      return () => clearTimeout(timer)
    }
  }, [user, data, paymentStatus, refreshUser])

  // ── Checking screen ──
  if (paymentStatus === 'checking') {
    return (
      <div style={{ background: '#0A0A0A', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <PageHeader />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <LoaderCircle size={40} strokeWidth={1.75} style={{ color: '#3B82F6', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#8A8A8A', fontSize: 15, fontFamily: 'Inter, sans-serif', margin: 0 }}>Перевіряємо статус оплати…</p>
        </div>
      </div>
    )
  }

  // ── Failed screen ──
  if (paymentStatus === 'failed') {
    return (
      <div style={{ background: '#0A0A0A', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Helmet><title>Оплата не пройшла — Widgetis</title></Helmet>
        <PageHeader />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, padding: '60px 24px 40px', maxWidth: 375, width: '100%', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 999,
              background: 'rgba(168,85,247,0.13)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <XCircle size={28} strokeWidth={2} style={{ color: '#A855F7' }} />
            </div>
          </div>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h1 style={{ margin: 0, color: '#F0F0F0', fontSize: 22, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>Оплата не пройшла</h1>
            <p style={{ margin: 0, color: '#888', fontSize: 13, lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>
              Картка була відхилена. Ми спробуємо ще 3 рази протягом 72 годин. Оновіть дані картки, щоб не втратити доступ.
            </p>
          </div>
          <div style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Grace period', value: '3 дні', color: '#A855F7' },
              { label: 'Наступна спроба', value: 'через 24 год', color: '#F0F0F0' },
              { label: 'Спроба', value: '1 із 3', color: '#F0F0F0' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#AAA', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>{label}</span>
                <span style={{ color, fontSize: 12, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>{value}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ color: '#F0F0F0', fontSize: 12, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>Можливі причини відхилення</span>
            {['• Недостатньо коштів на картці', '• Ліміт/блокування онлайн-платежів банком', '• Термін дії картки завершився'].map(r => (
              <span key={r} style={{ color: '#888', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>{r}</span>
            ))}
          </div>
          <Link to="/cabinet/choose-plan" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 12, background: '#3B82F6', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'Inter, sans-serif', textDecoration: 'none' }}>
            <CreditCard size={16} strokeWidth={2} /> Оновити картку
          </Link>
          <Link to="/cabinet/choose-plan" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 12, background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', color: '#F0F0F0', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', textDecoration: 'none' }}>
            <Wallet size={15} strokeWidth={2} /> Спробувати інший метод
          </Link>
          <Link to="/cabinet/support" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 12, background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', color: '#AAA', fontSize: 13, fontFamily: 'Inter, sans-serif', textDecoration: 'none' }}>
            <MessageCircle size={15} strokeWidth={2} /> Написати в підтримку
          </Link>
          <p style={{ margin: 0, color: '#555', fontSize: 11, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
            Якщо оплата не пройде — доступ буде призупинено на 90 днів
          </p>
        </div>
      </div>
    )
  }

  // ── Success screens ──
  if (!data) return null

  if (choice === 'self') return <SelfScreen data={data} onBack={() => setChoice(null)} />
  if (choice === 'concierge') return <ManagerScreen data={data} onBack={() => setChoice(null)} />
  return <ChoiceScreen data={data} onChoice={setChoice} />
}
