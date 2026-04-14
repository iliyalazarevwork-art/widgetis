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
} from 'lucide-react'
import { platformConfig } from '../data/widgets'
import type { Platform } from '../data/widgets'
import { post } from '../api/client'
import type { SiteCreateResponse, User } from '../types'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import liqpaySymbol from '../assets/logo-liqpay-symbol.svg'
import plataSymbol from '../assets/logo-plata-symbol-dark.svg'
import './SignupPage.css'

// ─── Plan data ────────────────────────────────────────────────────────────────

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

// ─── OTP input component ──────────────────────────────────────────────────────

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const len = 6
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }

  function handleChange(i: number, raw: string) {
    const digits = raw.replace(/\D/g, '')

    // iOS autofill fills the whole code into the focused input at once
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
    if (digit && i < len - 1) {
      inputs.current[i + 1]?.focus()
    }
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

// ─── Steps ────────────────────────────────────────────────────────────────────

type Step = 'auth' | 'otp' | 'store'
type PaymentMethodId = 'liqpay' | 'monobank'

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
] as const

const SIGNUP_DRAFT_KEY = 'wty_signup_draft'
const RESEND_COOLDOWN_SECONDS = 60

interface SignupDraft {
  step: Step
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SignupPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user, login } = useAuth()
  const verifyingOtpRef = useRef(false)
  const lastAutoSubmittedOtpRef = useRef('')

  const rawPlan = params.get('plan') ?? 'pro'
  const billing = params.get('billing') === 'monthly' ? 'monthly' : 'yearly'
  const planKey: PlanKey = rawPlan in PLAN_META ? (rawPlan as PlanKey) : 'pro'
  const plan = PLAN_META[planKey]
  const Icon = plan.icon
  const displayPrice = billing === 'yearly' ? plan.yearlyMonthly : plan.monthlyPrice

  // If user is already authenticated, skip email/OTP steps — go straight to store
  const [step, setStep] = useState<Step>(user ? 'store' : 'auth')
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

  useEffect(() => {
    const rawDraft = sessionStorage.getItem(SIGNUP_DRAFT_KEY)
    if (!rawDraft) {
      setDraftHydrated(true)
      return
    }

    try {
      const draft = JSON.parse(rawDraft) as SignupDraft
      if (draft.plan !== planKey || draft.billing !== billing) return

      // If user is already authenticated, don't restore auth/otp steps — stay on 'store'
      if (!user || draft.step === 'store') {
        setStep(draft.step)
      }
      setEmail(draft.email || user?.email || '')
      setOtp(draft.otp)
      setSite(draft.site)
      setPlatform(draft.platform)
      setPaymentMethod(draft.paymentMethod ?? 'liqpay')

      if (draft.resendAvailableAt && draft.resendAvailableAt > Date.now()) {
        setResendCooldown(Math.ceil((draft.resendAvailableAt - Date.now()) / 1000))
      }
    } catch {
      sessionStorage.removeItem(SIGNUP_DRAFT_KEY)
    }

    setDraftHydrated(true)
  }, [billing, planKey])

  useEffect(() => {
    if (!draftHydrated) return

    const resendAvailableAt = resendCooldown > 0
      ? Date.now() + resendCooldown * 1000
      : null

    const draft: SignupDraft = {
      step,
      email,
      otp,
      site,
      platform,
      paymentMethod,
      plan: planKey,
      billing,
      resendAvailableAt,
    }

    sessionStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(draft))
  }, [billing, draftHydrated, email, otp, paymentMethod, planKey, platform, resendCooldown, site, step])

  useEffect(() => {
    if (resendCooldown <= 0) return

    const id = window.setInterval(() => {
      setResendCooldown(value => (value <= 1 ? 0 : value - 1))
    }, 1000)

    return () => window.clearInterval(id)
  }, [resendCooldown])

  // ── Step 1: send OTP ──
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
        setStep('otp')
        startCooldown()
        toast.success('Код підтвердження надіслано на email')
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Не вдалося надіслати код')
      })
      .finally(() => setLoading(false))
  }

  function startCooldown() {
    setResendCooldown(RESEND_COOLDOWN_SECONDS)
  }

  function handleResend() {
    setResending(true)
    post('/auth/otp/resend', { email: email.trim() })
      .then(() => {
        setOtp('')
        lastAutoSubmittedOtpRef.current = ''
        startCooldown()
        toast.success('Код надіслано повторно')
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Не вдалося надіслати код повторно')
      })
      .finally(() => setResending(false))
  }

  // ── Step 2: verify OTP ──
  async function verifyOtpCode(rawCode: string) {
    const clean = rawCode.replace(/\s/g, '')
    if (clean.length < 6) {
      setOtpError('Введіть 6-значний код')
      return
    }
    if (verifyingOtpRef.current) return

    verifyingOtpRef.current = true
    setOtpError('')
    setLoading(true)

    try {
      const res = await post<{ token: string; user: User }>('/auth/otp/verify', { email: email.trim(), code: clean })
      login(res.token, res.user)
      setStep('store')
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

  useEffect(() => {
    if (step !== 'otp' || loading) return

    const clean = otp.replace(/\s/g, '')
    if (clean.length < 6) {
      lastAutoSubmittedOtpRef.current = ''
      return
    }
    if (clean === lastAutoSubmittedOtpRef.current) return

    lastAutoSubmittedOtpRef.current = clean
    void verifyOtpCode(clean)
  }, [loading, otp, step])

  // ── Step 3: store + start checkout via selected provider ──
  async function handleStartTrial(e: React.FormEvent) {
    e.preventDefault()
    const normalizedUrl = normalizeSiteUrl(site)
    if (!normalizedUrl || normalizedUrl.length < 10) {
      setSiteError('Вкажіть адресу магазину')
      return
    }
    setSiteError('')
    setLoading(true)

    try {
      // 1. Create site first (non-blocking if it fails — user can add later).
      //    This must run BEFORE the checkout endpoint because the unified
      //    /subscription/checkout endpoint uses the primary site domain
      //    to build a unique order number.
      let siteId: number | null = null
      let scriptTag: string | null = null
      try {
        const siteRes = await post<{ data: SiteCreateResponse }>('/profile/sites', { url: normalizedUrl, platform })
        siteId = siteRes.data.id
        scriptTag = siteRes.data.script.script_tag
      } catch {
        toast.error('Не вдалося додати сайт. Ви зможете додати його пізніше у кабінеті.')
      }

      // 2. Store data for TrialSuccessPage (survives payment redirect)
      sessionStorage.setItem('wty_trial_signup', JSON.stringify({
        email,
        site: normalizedUrl,
        platform,
        plan: planKey,
        billing,
        siteId,
        scriptTag,
        paymentMethod,
      }))

      sessionStorage.removeItem(SIGNUP_DRAFT_KEY)

      // 3. Branch on provider:
      //    - LiqPay supports a deferred-charge trial → use the legacy
      //      /subscription/checkout/trial endpoint which defers the
      //      first charge by the plan's trial_days.
      //    - Monobank has no deferred-charge capability → use the
      //      unified /subscription/checkout endpoint which charges
      //      immediately. We warn the user in the UI.
      if (paymentMethod === 'liqpay') {
        const checkoutRes = await post<LiqPayTrialCheckoutResponse>('/profile/subscription/checkout/trial', {
          plan_slug: planKey,
          billing_period: billing === 'yearly' ? 'yearly' : 'monthly',
        })

        submitLiqPayForm(checkoutRes.data)
        return
      }

      const checkoutRes = await post<UnifiedCheckoutResponse>('/profile/subscription/checkout', {
        plan_slug: planKey,
        billing_period: billing === 'yearly' ? 'yearly' : 'monthly',
        provider: paymentMethod,
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

    const dataInput = document.createElement('input')
    dataInput.type = 'hidden'
    dataInput.name = 'data'
    dataInput.value = checkout.data
    form.appendChild(dataInput)

    const sigInput = document.createElement('input')
    sigInput.type = 'hidden'
    sigInput.name = 'signature'
    sigInput.value = checkout.signature
    form.appendChild(sigInput)

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
        input.type = 'hidden'
        input.name = key
        input.value = value
        form.appendChild(input)
      }

      document.body.appendChild(form)
      form.submit()
      return
    }

    // GET redirect — providers like Monobank return a pageUrl the user
    // follows directly in the same tab.
    window.location.href = checkout.url
  }

  return (
    <>
      <SeoHead
        title="Початок тріалу — widgetis | 7 днів безкоштовно"
        description="Зареєструйтесь у widgetis та отримайте 7 днів безкоштовного доступу до всіх віджетів. Без прив'язки картки."
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
              <div className="signup__plan-top">
                <div className="signup__plan-icon-wrap">
                  <Icon size={20} strokeWidth={2} />
                </div>
                <div>
                  <p className="signup__plan-name">{plan.name}</p>
                  <p className="signup__plan-pitch">{plan.pitch}</p>
                </div>
              </div>

              <div className="signup__plan-price">
                <span className="signup__plan-amount">{displayPrice.toLocaleString('uk-UA')}</span>
                <span className="signup__plan-unit">грн/міс</span>
              </div>
              {billing === 'yearly' && (
                <p className="signup__plan-annual">
                  {plan.yearlyPrice.toLocaleString('uk-UA')} грн/рік · 2 міс у подарунок
                </p>
              )}

              <div className="signup__trial-badge">
                <CalendarClock size={14} strokeWidth={2} />
                7 днів безкоштовно
              </div>

              <ul className="signup__plan-features">
                {plan.features.map(f => (
                  <li key={f}>
                    <Check size={13} strokeWidth={2.5} className="signup__plan-check" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="signup__trust-list">
                <div className="signup__trust-item">
                  <BadgeCheck size={13} strokeWidth={2} />
                  Картка не списується 7 днів
                </div>
                <div className="signup__trust-item">
                  <CreditCard size={13} strokeWidth={2} />
                  Скасуєте в один клік
                </div>
              </div>

              <Link to={user ? '/cabinet/choose-plan' : '/pricing'} className="signup__plan-change">Змінити план</Link>
            </aside>

            {/* ══ Right: Steps ══ */}
            <div className="signup__form-wrap">

              {/* ── Step progress ── */}
              <div className="signup__steps">
                {(['auth', 'otp', 'store'] as Step[]).map((s, i) => (
                  <div
                    key={s}
                    className={`signup__step ${step === s ? 'signup__step--active' : ''} ${
                      ['auth', 'otp', 'store'].indexOf(step) > i ? 'signup__step--done' : ''
                    }`}
                  >
                    <div className="signup__step-dot">
                      {['auth', 'otp', 'store'].indexOf(step) > i
                        ? <Check size={11} strokeWidth={3} />
                        : i + 1
                      }
                    </div>
                    <span className="signup__step-label">
                      {s === 'auth' ? 'Email' : s === 'otp' ? 'Код' : 'Магазин'}
                    </span>
                  </div>
                ))}
              </div>

              {/* ── Step 1: Email ── */}
              {step === 'auth' && (
                <>
                  <h1 className="signup__title">Введіть email</h1>
                  <p className="signup__subtitle">Надішлемо код підтвердження — реєстрація без пароля</p>

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
                    Продовжити через Google
                  </button>

                  <div className="signup__or"><span>або</span></div>

                  <form onSubmit={handleSendOtp} noValidate>
                    <label className={`signup__field ${emailError ? 'signup__field--error' : ''}`}>
                      <span className="signup__field-label">
                        Email <span className="signup__field-req">*</span>
                      </span>
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
                    </label>

                    <button type="submit" className="signup__submit" disabled={loading} style={{ marginTop: 16 }}>
                      {loading
                        ? <><LoaderCircle size={17} strokeWidth={2.5} className="signup__spinner" /> Надсилаємо код...</>
                        : <>Отримати код <ArrowRight size={15} strokeWidth={2.5} /></>
                      }
                    </button>
                  </form>

                  <p className="signup__login-hint">
                    Вже є акаунт?{' '}
                    <Link to="/login" className="signup__login-link">Увійти</Link>
                  </p>
                </>
              )}

              {/* ── Step 2: OTP ── */}
              {step === 'otp' && (
                <>
                  <h1 className="signup__title">Введіть код</h1>
                  <p className="signup__subtitle">
                    Надіслали 6-значний код на <strong className="signup__email-accent">{email}</strong>
                  </p>

                  <form onSubmit={handleVerifyOtp} noValidate>
                    <div className={`signup__field ${otpError ? 'signup__field--error' : ''}`}>
                      <OtpInput value={otp} onChange={v => { setOtp(v); setOtpError('') }} />
                      {otpError && <span className="signup__field-hint signup__field-hint--center">{otpError}</span>}
                    </div>

                    <button type="submit" className="signup__submit" disabled={loading} style={{ marginTop: 20 }}>
                      {loading
                        ? <><LoaderCircle size={17} strokeWidth={2.5} className="signup__spinner" /> Перевіряємо...</>
                        : <>Підтвердити <ArrowRight size={15} strokeWidth={2.5} /></>
                      }
                    </button>
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

                  <button type="button" className="signup__back-step" onClick={() => setStep('auth')}>
                    <ArrowLeft size={13} strokeWidth={2} /> Змінити email
                  </button>
                </>
              )}

              {/* ── Step 3: Store ── */}
              {step === 'store' && (
                <>
                  <h1 className="signup__title">Ваш магазин</h1>
                  <p className="signup__subtitle">Вкажіть сайт — підключимо після активації тріалу</p>

                  <form onSubmit={handleStartTrial} noValidate>
                    <div className="signup__fields">
                      <label className={`signup__field ${siteError ? 'signup__field--error' : ''}`}>
                        <span className="signup__field-label">
                          Адреса магазину <span className="signup__field-req">*</span>
                        </span>
                        <div className="signup__input-wrap">
                          <Globe size={15} strokeWidth={2} />
                          <input
                            type="text"
                            placeholder="store.com.ua"
                            value={site}
                            onChange={e => { setSite(e.target.value); setSiteError('') }}
                            autoFocus
                          />
                        </div>
                        {siteError && <span className="signup__field-hint">{siteError}</span>}
                      </label>

                      <div className="signup__field">
                        <span className="signup__field-label">Платформа</span>
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

                      {/* Payment method */}
                      <div className="signup__card-section">
                        <div className="signup__card-label">
                          <CreditCard size={14} strokeWidth={2} />
                          <span>Спосіб оплати</span>
                        </div>
                        <div className="signup__payment-methods">
                          {PAYMENT_METHODS.map(method => (
                            <button
                              key={method.id}
                              type="button"
                              className={`signup__payment-method ${paymentMethod === method.id ? 'signup__payment-method--active' : ''}`}
                              onClick={() => setPaymentMethod(method.id)}
                              aria-pressed={paymentMethod === method.id}
                              aria-label={method.name}
                            >
                              <img
                                src={method.symbol}
                                alt=""
                                className="signup__payment-method-symbol"
                                aria-hidden="true"
                              />
                              <span className="signup__payment-method-name">{method.name}</span>
                              <span className="signup__payment-method-hint">{method.hint}</span>
                            </button>
                          ))}
                        </div>
                        {!PAYMENT_METHODS.find(m => m.id === paymentMethod)?.trial && (
                          <p className="signup__payment-notice">
                            plata by mono списує оплату одразу — тріальний період не підтримується цим провайдером. Для безкоштовних 7 днів оберіть LiqPay.
                          </p>
                        )}
                      </div>
                    </div>

                    <button type="submit" className="signup__submit signup__submit--trial" disabled={loading}>
                      {loading
                        ? <><LoaderCircle size={17} strokeWidth={2.5} className="signup__spinner" /> {paymentMethod === 'liqpay' ? 'Активуємо тріал...' : 'Переходимо до оплати...'}</>
                        : paymentMethod === 'liqpay'
                          ? <>Почати 7 днів безкоштовно <ArrowRight size={15} strokeWidth={2.5} /></>
                          : <>Перейти до оплати <ArrowRight size={15} strokeWidth={2.5} /></>
                      }
                    </button>

                    <p className="signup__terms">
                      Продовжуючи, Ви погоджуєтесь з{' '}
                      <a href="/terms" target="_blank" rel="noreferrer">умовами використання</a>
                      {' '}та{' '}
                      <a href="/privacy" target="_blank" rel="noreferrer">політикою конфіденційності</a>
                    </p>
                  </form>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  )
}
