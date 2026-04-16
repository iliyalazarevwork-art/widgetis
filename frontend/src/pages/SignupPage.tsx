import { useEffect, useRef, useState } from 'react'
import { SeoHead } from '../components/SeoHead'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Globe,
  LoaderCircle,
  Sprout,
  Zap,
  Crown,
  Check,
  BadgeCheck,
  CalendarClock,
  CreditCard,
  RefreshCw,
  Lock,
  AlertCircle,
} from 'lucide-react'
import { platformConfig } from '../data/widgets'
import type { Platform } from '../data/widgets'
import { post } from '../api/client'
import type { User } from '../types'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import liqpaySymbol from '../assets/logo-liqpay-symbol.svg'
import wayForPaySymbol from '../assets/logo-wayforpay-symbol.webp'
import plataSymbol from '../assets/logo-plata-symbol-dark.svg'
import './SignupPage.css'

// ─── Plan data ─────────────────────────────────────────────────────────────────

const PLAN_META = {
  basic: {
    icon: Sprout,
    name: 'Basic',
    pitch: 'Для початку',
    monthlyPrice: 799,
    yearlyMonthly: 666,
    yearlyPrice: 7990,
    colorClass: 'signup__plan--basic',
    features: [
      'Дата доставки',
      'Безкоштовна доставка',
      'Бігуча стрічка',
      'Хто зараз дивиться',
      '1 сайт',
      'Email + Telegram підтримка',
    ],
  },
  pro: {
    icon: Zap,
    name: 'Pro',
    pitch: 'Оптимально',
    monthlyPrice: 1599,
    yearlyMonthly: 1333,
    yearlyPrice: 15990,
    colorClass: 'signup__plan--pro',
    features: [
      'Всі 8 віджетів',
      'Лічильник залишків',
      'Прогрес кошика',
      'Фотовідгуки',
      '3 сайти',
      'Self-service кастомізація',
    ],
  },
  max: {
    icon: Crown,
    name: 'Max',
    pitch: 'Все включено',
    monthlyPrice: 2899,
    yearlyMonthly: 2416,
    yearlyPrice: 28990,
    colorClass: 'signup__plan--max',
    features: [
      'Всі 17 віджетів',
      'Кешбек-калькулятор',
      'Таймер терміновості',
      '5 сайтів',
      'VIP підтримка',
      'Повна кастомізація',
    ],
  },
} as const

type PlanKey = keyof typeof PLAN_META

// ─── OTP input ─────────────────────────────────────────────────────────────────

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const len = 6
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { inputs.current[0]?.focus() }, [])

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !value[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  function handleChange(i: number, raw: string) {
    const digits = raw.replace(/\D/g, '')
    if (digits.length > 1) {
      const filled = digits.slice(0, len)
      onChange(filled)
      inputs.current[Math.min(filled.length, len - 1)]?.focus()
      return
    }
    const digit = digits.slice(-1)
    const arr = value.padEnd(len, ' ').split('')
    arr[i] = digit || ' '
    const next = arr.join('').trimEnd()
    onChange(next)
    if (digit && i < len - 1) inputs.current[i + 1]?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, len)
    if (pasted) {
      onChange(pasted)
      inputs.current[Math.min(pasted.length, len - 1)]?.focus()
    }
    e.preventDefault()
  }

  return (
    <div className="signup__otp-row" onPaste={handlePaste}>
      {Array.from({ length: len }).map((_, i) => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el }}
          className={`signup__otp-cell ${value[i] && value[i] !== ' ' ? 'signup__otp-cell--filled' : ''}`}
          type="text"
          inputMode="numeric"
          maxLength={i === 0 ? 6 : 1}
          value={value[i] && value[i] !== ' ' ? value[i] : ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
        />
      ))}
    </div>
  )
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type EmailStatus = 'idle' | 'sent' | 'verified'
type PaymentMethodId = 'liqpay' | 'monobank' | 'wayforpay'

interface PaymentMethod {
  id: PaymentMethodId
  name: string
  symbol: string
  hint: string
  trial: boolean
}

const PAYMENT_METHODS: readonly PaymentMethod[] = [
  {
    id: 'liqpay',
    name: 'LiqPay',
    symbol: liqpaySymbol,
    hint: 'Visa · Mastercard · Apple Pay · Google Pay',
    trial: true,
  },
  {
    id: 'monobank',
    name: 'plata by mono',
    symbol: plataSymbol,
    hint: 'Apple Pay · Google Pay · картки будь-якого банку',
    trial: false,
  },
  {
    id: 'wayforpay',
    name: 'WayForPay',
    symbol: wayForPaySymbol,
    hint: 'Visa · Mastercard · Apple Pay · Google Pay',
    trial: true,
  },
] as const

const SIGNUP_DRAFT_KEY = 'wty_signup_draft'
const RESEND_COOLDOWN_SECONDS = 60

interface SignupDraft {
  emailStatus: EmailStatus
  email: string
  otp: string
  site: string
  platform: Platform
  paymentMethod: PaymentMethodId
  plan: PlanKey
  billing: 'monthly' | 'yearly'
  resendAvailableAt: number | null
}

interface LiqPayTrialCheckoutResponse {
  data: {
    checkout_url: string
    data: string
    signature: string
    order_id: string
  }
}

interface UnifiedCheckoutResponse {
  data: {
    provider: PaymentMethodId
    reference: string
    method: 'GET' | 'POST'
    url: string
    form_fields: Record<string, string>
    provider_reference: string | null
  }
}

function normalizeSiteUrl(value: string): string {
  const raw = value.trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  return `https://${raw}`
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function SignupPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user, login } = useAuth()
  const verifyingOtpRef = useRef(false)
  const lastAutoSubmittedOtpRef = useRef('')
  const siteInputRef = useRef<HTMLInputElement>(null)

  const rawPlan = params.get('plan') ?? 'pro'
  const billing = params.get('billing') === 'monthly' ? 'monthly' : 'yearly'
  const planKey: PlanKey = rawPlan in PLAN_META ? (rawPlan as PlanKey) : 'pro'
  const plan = PLAN_META[planKey]
  const Icon = plan.icon
  const displayPrice = billing === 'yearly' ? plan.yearlyMonthly : plan.monthlyPrice

  const [emailStatus, setEmailStatus] = useState<EmailStatus>(user ? 'verified' : 'idle')
  const [email, setEmail] = useState(user?.email ?? '')
  const [emailError, setEmailError] = useState('')
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [site, setSite] = useState('')
  const [siteError, setSiteError] = useState('')
  const [platform, setPlatform] = useState<Platform>('horoshop')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('liqpay')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [draftHydrated, setDraftHydrated] = useState(false)

  // Auth context may not be loaded when this component first mounts, so
  // emailStatus could be initialised to 'idle' even for an authenticated user.
  // Also, the draft restoration effect may run first and set emailStatus to
  // 'sent' from a stale draft, then user loads and we need to override it.
  // Depend on draftHydrated so this always runs AFTER draft restoration.
  useEffect(() => {
    if (draftHydrated && user) {
      setEmailStatus('verified')
      if (!email) setEmail(user.email ?? '')
    }
  }, [user, draftHydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Restore draft ──
  useEffect(() => {
    // Helper: read persisted site data from localStorage (shared with AddSitePage)
    function getSavedSite(): { url: string; platform: Platform } {
      try {
        const raw = localStorage.getItem('wty_add_site_draft')
        if (!raw) return { url: '', platform: 'horoshop' }
        const parsed = JSON.parse(raw) as { url?: string; platform?: string }
        return {
          url: parsed.url ?? '',
          platform: (parsed.platform as Platform) ?? 'horoshop',
        }
      } catch {
        return { url: '', platform: 'horoshop' }
      }
    }

    const rawDraft = sessionStorage.getItem(SIGNUP_DRAFT_KEY)
    if (!rawDraft) {
      // No session draft — still restore site from localStorage if available
      const saved = getSavedSite()
      if (saved.url) { setSite(saved.url); setPlatform(saved.platform) }
      setDraftHydrated(true)
      return
    }

    try {
      const draft = JSON.parse(rawDraft) as SignupDraft
      if (draft.plan !== planKey || draft.billing !== billing) return

      // If draft had emailStatus=verified but there's no active user, fallback to idle
      const safeStatus: EmailStatus =
        draft.emailStatus === 'verified' && !user ? 'idle' : draft.emailStatus ?? 'idle'

      setEmailStatus(safeStatus)
      setEmail(draft.email || user?.email || '')
      setOtp(draft.otp)
      // Prefer session draft site; fall back to localStorage if empty
      const savedSite = draft.site || getSavedSite().url
      const savedPlatform = draft.site ? draft.platform : (getSavedSite().platform)
      setSite(savedSite)
      setPlatform(savedPlatform)
      setPaymentMethod(draft.paymentMethod ?? 'liqpay')

      if (draft.resendAvailableAt && draft.resendAvailableAt > Date.now()) {
        setResendCooldown(Math.ceil((draft.resendAvailableAt - Date.now()) / 1000))
      }
    } catch {
      sessionStorage.removeItem(SIGNUP_DRAFT_KEY)
    }

    setDraftHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billing, planKey])

  // ── Save draft ──
  useEffect(() => {
    if (!draftHydrated) return
    const draft: SignupDraft = {
      emailStatus,
      email,
      otp,
      site,
      platform,
      paymentMethod,
      plan: planKey,
      billing,
      resendAvailableAt: resendCooldown > 0 ? Date.now() + resendCooldown * 1000 : null,
    }
    sessionStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(draft))
  }, [billing, draftHydrated, email, emailStatus, otp, paymentMethod, planKey, platform, resendCooldown, site])

  // ── Persist site URL to localStorage so it survives tab close ──
  useEffect(() => {
    if (!draftHydrated || !site.trim()) return
    try {
      const prev = JSON.parse(localStorage.getItem('wty_add_site_draft') || '{}') as Record<string, string>
      localStorage.setItem('wty_add_site_draft', JSON.stringify({ ...prev, url: site.trim(), platform }))
    } catch { /* quota */ }
  }, [draftHydrated, site, platform])

  // ── Resend countdown ──
  useEffect(() => {
    if (resendCooldown <= 0) return
    const id = window.setInterval(() => {
      setResendCooldown(v => (v <= 1 ? 0 : v - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [resendCooldown])

  // ── Send OTP ──
  function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Вкажіть коректний email')
      return
    }
    setEmailError('')
    setLoading(true)
    post('/auth/otp', { email: email.trim() })
      .then(() => {
        setEmailStatus('sent')
        setResendCooldown(RESEND_COOLDOWN_SECONDS)
        toast.success('Код підтвердження надіслано на email')
      })
      .catch(err => toast.error(err instanceof Error ? err.message : 'Не вдалося надіслати код'))
      .finally(() => setLoading(false))
  }

  function handleResend() {
    setResending(true)
    post('/auth/otp/resend', { email: email.trim() })
      .then(() => {
        setOtp('')
        lastAutoSubmittedOtpRef.current = ''
        setResendCooldown(RESEND_COOLDOWN_SECONDS)
        toast.success('Код надіслано повторно')
      })
      .catch(err => toast.error(err instanceof Error ? err.message : 'Не вдалося надіслати код'))
      .finally(() => setResending(false))
  }

  // ── Verify OTP ──
  async function verifyOtpCode(rawCode: string) {
    const clean = rawCode.replace(/\s/g, '')
    if (clean.length < 6) { setOtpError('Введіть 6-значний код'); return }
    if (verifyingOtpRef.current) return

    verifyingOtpRef.current = true
    setOtpError('')
    setLoading(true)

    try {
      const res = await post<{ token: string; user: User }>('/auth/otp/verify', {
        email: email.trim(),
        code: clean,
      })
      login(res.token, res.user)
      setEmailStatus('verified')
      toast.success('Email підтверджено')
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Невірний або прострочений код')
    } finally {
      setLoading(false)
      verifyingOtpRef.current = false
    }
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    void verifyOtpCode(otp)
  }

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    if (emailStatus !== 'sent' || loading) return
    const clean = otp.replace(/\s/g, '')
    if (clean.length < 6) { lastAutoSubmittedOtpRef.current = ''; return }
    if (clean === lastAutoSubmittedOtpRef.current) return
    lastAutoSubmittedOtpRef.current = clean
    void verifyOtpCode(clean)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, otp, emailStatus])

  // ── Start checkout ──
  async function handleStartTrial(e: React.FormEvent) {
    e.preventDefault()

    if (!user) {
      toast.error('Сесія завершилась. Увійдіть ще раз.')
      setEmailStatus('idle')
      return
    }

    const normalizedUrl = normalizeSiteUrl(site)
    if (!normalizedUrl || normalizedUrl.length < 10) {
      setSiteError('Вкажіть адресу магазину')
      siteInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      siteInputRef.current?.focus()
      return
    }
    setSiteError('')
    setLoading(true)

    try {
      sessionStorage.setItem('wty_trial_signup', JSON.stringify({
        email, site: normalizedUrl, platform, plan: planKey, billing, paymentMethod,
      }))
      sessionStorage.removeItem(SIGNUP_DRAFT_KEY)
      try { localStorage.removeItem('wty_add_site_draft') } catch { /* ignore */ }

      if (paymentMethod === 'liqpay') {
        const checkoutRes = await post<LiqPayTrialCheckoutResponse>('/profile/subscription/checkout/trial', {
          plan_slug:      planKey,
          billing_period: billing === 'yearly' ? 'yearly' : 'monthly',
          site_domain:    normalizedUrl,
          platform,
        })
        submitLiqPayForm(checkoutRes.data)
        return
      }

      const checkoutRes = await post<UnifiedCheckoutResponse>('/profile/subscription/checkout', {
        plan_slug:      planKey,
        billing_period: billing === 'yearly' ? 'yearly' : 'monthly',
        provider:       paymentMethod,
        site_domain:    normalizedUrl,
        platform,
      })
      redirectToProvider(checkoutRes.data)
    } catch (err: unknown) {
      const error = err as Error & { code?: string }
      if (error.code === 'ALREADY_SUBSCRIBED') {
        sessionStorage.removeItem(SIGNUP_DRAFT_KEY)
        navigate('/cabinet', { replace: true })
      } else {
        toast.error(error.message || 'Не вдалося розпочати оформлення')
        setLoading(false)
      }
    }
  }

  function submitLiqPayForm(checkout: { checkout_url: string; data: string; signature: string }) {
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = checkout.checkout_url
    const d = document.createElement('input'); d.type = 'hidden'; d.name = 'data'; d.value = checkout.data
    const s = document.createElement('input'); s.type = 'hidden'; s.name = 'signature'; s.value = checkout.signature
    form.appendChild(d); form.appendChild(s)
    document.body.appendChild(form)
    form.submit()
  }

  function redirectToProvider(checkout: UnifiedCheckoutResponse['data']) {
    if (checkout.method === 'POST') {
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = checkout.url
      for (const [key, value] of Object.entries(checkout.form_fields)) {
        const input = document.createElement('input')
        input.type = 'hidden'; input.name = key; input.value = value
        form.appendChild(input)
      }
      document.body.appendChild(form)
      form.submit()
      return
    }
    window.location.href = checkout.url
  }

  const isCtaActive = emailStatus === 'verified' && !loading

  return (
    <>
      <SeoHead
        title="Початок тріалу — widgetis | 7 днів безкоштовно"
        description="Зареєструйтесь у widgetis та отримайте 7 днів безкоштовного доступу до всіх віджетів."
        path="/signup"
        noindex
      />

      <div className="signup">
        <div className="signup__container">

          <Link to={user ? '/cabinet/choose-plan' : '/pricing'} className="signup__back">
            <ArrowLeft size={15} strokeWidth={2.25} />
            {user ? 'До вибору плану' : 'До тарифів'}
          </Link>

          <div className="signup__grid">

            {/* ══ Left: Plan summary ══ */}
            <aside className={`signup__plan ${plan.colorClass}`}>
              <div className="signup__plan-info">
                <div className="signup__plan-icon-wrap">
                  <Icon size={18} strokeWidth={2} />
                </div>
                <div className="signup__plan-text">
                  <p className="signup__plan-name">
                    {plan.name}
                    <span className="signup__plan-inline-pitch">
                      <span className="signup__plan-sep"> · </span>
                      {plan.pitch}
                    </span>
                  </p>
                  {billing === 'yearly' && (
                    <p className="signup__plan-annual">
                      {plan.yearlyPrice.toLocaleString('uk-UA')} грн/рік · 2 міс у подарунок
                    </p>
                  )}
                </div>
              </div>

              <div className="signup__plan-price">
                <span className="signup__plan-amount">{displayPrice.toLocaleString('uk-UA')}</span>
                <span className="signup__plan-unit">грн/міс</span>
              </div>

              <div className="signup__trial-badge">
                <CalendarClock size={14} strokeWidth={2} />
                7 днів безкоштовно
              </div>

              <div className="signup__plan-divider" aria-hidden="true" />

              <ul className="signup__plan-features">
                {plan.features.map(feature => (
                  <li key={feature} className="signup__plan-feature">
                    <Check size={14} strokeWidth={2.5} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="signup__plan-divider" aria-hidden="true" />

              <Link to={user ? '/cabinet/choose-plan' : '/pricing'} className="signup__plan-change">
                Змінити план <ArrowRight size={13} strokeWidth={2.25} />
              </Link>
            </aside>

            {/* ══ Right: Unified form ══ */}
            <div className="signup__form-wrap">

              {/* ── Section 1: Email ── */}
              <div className="signup__section">
                <div className="signup__section-hdr">
                  <span className="signup__section-title">1. Підтвердження email</span>
                  {emailStatus === 'idle' && (
                    <span className="signup__email-badge signup__email-badge--warn">
                      <AlertCircle size={11} strokeWidth={2.5} />
                      Потрібно підтвердити
                    </span>
                  )}
                  {emailStatus === 'sent' && (
                    <span className="signup__email-badge signup__email-badge--sent">
                      <Check size={11} strokeWidth={2.5} />
                      Код надіслано
                    </span>
                  )}
                  {emailStatus === 'verified' && (
                    <span className="signup__email-badge signup__email-badge--ok">
                      <BadgeCheck size={11} strokeWidth={2} />
                      Підтверджено
                    </span>
                  )}
                </div>

                {/* Verified: show confirmed email row */}
                {emailStatus === 'verified' && (
                  <div className="signup__email-confirmed">
                    <Mail size={15} strokeWidth={2} className="signup__email-confirmed-icon" />
                    <span className="signup__email-confirmed-text">{email || user?.email}</span>
                  </div>
                )}

                {/* Idle: email input + send code + Google */}
                {emailStatus === 'idle' && (
                  <>
                    <form onSubmit={handleSendOtp} noValidate>
                      <div className="signup__email-row">
                        <div className={`signup__field signup__field--email ${emailError ? 'signup__field--error' : ''}`}>
                          <div className="signup__input-wrap">
                            <Mail size={15} strokeWidth={2} />
                            <input
                              type="email"
                              placeholder="you@store.ua"
                              value={email}
                              onChange={e => { setEmail(e.target.value); setEmailError('') }}
                              autoComplete="email"
                              autoFocus
                            />
                          </div>
                          {emailError && <span className="signup__field-hint">{emailError}</span>}
                        </div>
                        <button type="submit" className="signup__send-btn" disabled={loading}>
                          {loading
                            ? <LoaderCircle size={16} strokeWidth={2.5} className="signup__spinner" />
                            : 'Надіслати код'
                          }
                        </button>
                      </div>
                    </form>

                    <button
                      className="signup__google-btn"
                      type="button"
                      onClick={() => {
                        sessionStorage.setItem('google_return_to', window.location.pathname + window.location.search)
                        window.location.href = '/auth/google'
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      </svg>
                      Або увійти через Google
                    </button>
                  </>
                )}

                {/* Sent: OTP inline */}
                {emailStatus === 'sent' && (
                  <>
                    <div className="signup__email-sent-row signup__email-sent-row--sent">
                      <div className="signup__email-sent-left">
                        <Mail size={15} strokeWidth={2} />
                        <span>{email}</span>
                      </div>
                      <button
                        type="button"
                        className="signup__change-email-btn signup__change-email-btn--green"
                        onClick={() => { setEmailStatus('idle'); setOtp(''); setOtpError('') }}
                      >
                        Змінити
                      </button>
                    </div>

                    <div className="signup__otp-box">
                      <p className="signup__otp-box-label">Введіть 6-значний код з листа</p>
                      <form onSubmit={handleVerifyOtp} noValidate>
                        <div className={`signup__field ${otpError ? 'signup__field--error' : ''}`}>
                          <OtpInput value={otp} onChange={v => { setOtp(v); setOtpError('') }} />
                          {otpError && (
                            <span className="signup__field-hint signup__field-hint--center">{otpError}</span>
                          )}
                        </div>
                      </form>
                      <div className="signup__resend">
                        {resendCooldown > 0
                          ? <span className="signup__resend-wait">Надіслати повторно через {resendCooldown} с</span>
                          : (
                            <button
                              type="button"
                              className="signup__resend-btn"
                              onClick={handleResend}
                              disabled={resending}
                            >
                              {resending
                                ? <><RefreshCw size={13} strokeWidth={2} className="signup__spinner" /> Надсилаємо...</>
                                : 'Надіслати повторно'
                              }
                            </button>
                          )
                        }
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="signup__section-divider" />

              {/* ── Section 2: Site ── */}
              <div className="signup__section">
                <div className="signup__section-hdr">
                  <span className="signup__section-title">2. Ваш магазин</span>
                </div>

                <label className={`signup__field ${siteError ? 'signup__field--error' : ''}`}>
                  <div className="signup__input-wrap">
                    <Globe size={15} strokeWidth={2} />
                    <input
                      ref={siteInputRef}
                      type="text"
                      placeholder="store.com.ua"
                      value={site}
                      onChange={e => { setSite(e.target.value); setSiteError('') }}
                    />
                  </div>
                  {siteError && <span className="signup__field-hint">{siteError}</span>}
                </label>

                <div className="signup__platforms">
                  {platformConfig.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      disabled={!p.available}
                      className={`signup__platform ${platform === p.id ? 'signup__platform--active' : ''} ${!p.available ? 'signup__platform--disabled' : ''}`}
                      onClick={() => p.available && setPlatform(p.id)}
                    >
                      {p.label}
                      {!p.available && <span className="signup__platform-soon">Скоро</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="signup__section-divider" />

              {/* ── Section 3: Payment ── */}

              <div className="signup__section">
                <div className="signup__section-hdr">
                  <CreditCard size={14} strokeWidth={2} className="signup__section-icon" />
                  <span className="signup__section-title">3. Спосіб оплати</span>
                </div>

                <div className="signup__payment-list">
                  {PAYMENT_METHODS.map(method => (
                    <button
                      key={method.id}
                      type="button"
                      className={`signup__payment-card ${paymentMethod === method.id ? 'signup__payment-card--active' : ''}`}
                      onClick={() => setPaymentMethod(method.id)}
                      aria-pressed={paymentMethod === method.id}
                    >
                      <div className="signup__payment-card-info">
                        <span className="signup__payment-card-name">{method.name}</span>
                        <span className="signup__payment-card-hint">{method.hint}</span>
                        {method.trial && (
                          <span className="signup__payment-card-trial">
                            <Check size={10} strokeWidth={3} />
                            Тріал 7 днів
                          </span>
                        )}
                      </div>
                      <img
                        src={method.symbol}
                        alt={method.name}
                        className={`signup__payment-card-logo signup__payment-card-logo--${method.id}`}
                      />
                    </button>
                  ))}
                </div>

                {!PAYMENT_METHODS.find(m => m.id === paymentMethod)?.trial && (
                  <p className="signup__payment-notice">
                    plata by mono списує оплату одразу — тріал не підтримується. Для 7 безкоштовних днів оберіть LiqPay або WayForPay.
                  </p>
                )}
              </div>

              <div className="signup__section-divider" />

              {/* ── CTA ── */}
              <div className="signup__section">
                <form onSubmit={handleStartTrial} noValidate>
                  {emailStatus !== 'verified' && (
                    <div className="signup__cta-lock">
                      <Lock size={13} strokeWidth={2.5} />
                      Підтвердіть email, щоб продовжити
                    </div>
                  )}

                  <button
                    type="submit"
                    className={`signup__submit signup__submit--trial${!isCtaActive ? ' signup__submit--locked-state' : ''}`}
                    disabled={!isCtaActive}
                  >
                    {loading
                      ? <><LoaderCircle size={17} strokeWidth={2.5} className="signup__spinner" /> {paymentMethod === 'liqpay' ? 'Активуємо тріал...' : 'Переходимо до оплати...'}</>
                      : !isCtaActive
                        ? <>Почати 7 днів безкоштовно <Lock size={14} strokeWidth={2} /></>
                        : paymentMethod === 'liqpay'
                          ? <>Почати 7 днів безкоштовно <ArrowRight size={15} strokeWidth={2.5} /></>
                          : <>Перейти до оплати <ArrowRight size={15} strokeWidth={2.5} /></>
                    }
                  </button>

                  <p className="signup__terms">
                    Натискаючи, Ви погоджуєтесь з{' '}
                    <a href="/terms" target="_blank" rel="noreferrer">умовами використання</a>
                    {' '}та{' '}
                    <a href="/privacy" target="_blank" rel="noreferrer">політикою конфіденційності</a>
                  </p>
                </form>
              </div>

            </div>

          </div>
        </div>
      </div>
    </>
  )
}
