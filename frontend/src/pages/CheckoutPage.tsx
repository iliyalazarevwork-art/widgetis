import { useEffect, useState } from 'react'
import { SeoHead } from '../components/SeoHead'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Globe,
  Phone,
  LoaderCircle,
  ShieldCheck,
  Lock,
  CreditCard,
} from 'lucide-react'
import { useCart } from '../context/CartContext'
import { WidgetIcon } from '../components/WidgetIcon'
import { BRAND_NAME_UPPER } from '../constants/brand'
import { platformConfig } from '../data/widgets'
import liqpaySymbol from '../assets/logo-liqpay-symbol.svg'
import plataSymbol from '../assets/logo-plata-symbol-dark.svg'
import './CheckoutPage.css'

type PaymethodId = 'liqpay' | 'monobank'

const PAYMENTS: readonly { id: PaymethodId; name: string; symbol: string; hint: string }[] = [
  {
    id: 'liqpay',
    name: 'LiqPay',
    symbol: liqpaySymbol,
    hint: 'Visa · Mastercard · Apple Pay · Google Pay',
  },
  {
    id: 'monobank',
    name: 'plata by mono',
    symbol: plataSymbol,
    hint: 'Apple Pay · Google Pay · картки будь-якого банку',
  },
] as const

type Platform = (typeof platformConfig)[number]['id']

interface FormState {
  email: string
  phone: string
  site: string
  platform: Platform
  agreed: boolean
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, totalPrice, originalTotal, savings, clear } = useCart()

  const [form, setForm] = useState<FormState>(() => {
    try {
      const raw = localStorage.getItem('wty_checkout_draft')
      if (raw) {
        const saved = JSON.parse(raw) as Partial<FormState>
        return {
          email: saved.email ?? '',
          phone: saved.phone ?? '',
          site: saved.site ?? '',
          platform: (saved.platform as Platform) ?? 'horoshop',
          agreed: true,
        }
      }
    } catch { /* ignore */ }
    return { email: '', phone: '', site: '', platform: 'horoshop', agreed: true }
  })
  const [paying, setPaying] = useState(false)
  const [paymethod, setPaymethod] = useState<PaymethodId>('liqpay')
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  // Redirect to catalog if cart empty
  useEffect(() => {
    if (items.length === 0 && !paying) {
      navigate('/catalog', { replace: true })
    }
  }, [items.length, paying, navigate])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key !== 'agreed') {
        try {
          const { agreed: _, ...draft } = next
          localStorage.setItem('wty_checkout_draft', JSON.stringify(draft))
        } catch { /* quota */ }
      }
      return next
    })
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const next: typeof errors = {}
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Вкажи коректний email'
    }
    if (form.phone.trim() && !/^[+\d\s\-()]{7,20}$/.test(form.phone)) {
      next.phone = 'Невірний формат телефону'
    }
    if (!form.site.trim() || form.site.trim().length < 4) {
      next.site = 'Вкажи адресу магазину'
    }
    if (!form.agreed) {
      next.agreed = 'Потрібна згода на обробку'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || paying) return

    setPaying(true)
    // Fake payment delay — simulate LiqPay redirect
    setTimeout(() => {
      // Store order info in sessionStorage for success page
      sessionStorage.setItem(
        'wty_last_order',
        JSON.stringify({
          email: form.email,
          phone: form.phone,
          site: form.site,
          platform: form.platform,
          items,
          totalPrice,
          orderNumber: `W-${Date.now().toString(36).toUpperCase()}`,
        }),
      )
      try { localStorage.removeItem('wty_checkout_draft') } catch { /* ignore */ }
      clear()
      navigate('/checkout/success', { replace: true })
    }, 1400)
  }

  if (items.length === 0 && !paying) return null

  return (
    <div className="checkout">
      <SeoHead
        title={`Оформлення замовлення — ${BRAND_NAME_UPPER}`}
        description="Оформлення замовлення widgetis."
        path="/checkout"
        noindex
      />

      <div className="checkout__container">
        <Link to="/catalog" className="checkout__back">
          <ArrowLeft size={16} strokeWidth={2.25} />
          До каталогу
        </Link>

        <h1 className="checkout__title">Оформлення замовлення</h1>

        <div className="checkout__grid">
          {/* ── Form ── */}
          <form className="checkout__form" onSubmit={handlePay} noValidate>
            <section className="checkout__section">
              <h2 className="checkout__section-title">Контактні дані</h2>
              <div className="checkout__fields">
                <label
                  className={`checkout__field ${errors.email ? 'checkout__field--error' : ''}`}
                >
                  <span className="checkout__field-label">
                    Email <span className="checkout__field-req">*</span>
                  </span>
                  <div className="checkout__input-wrap">
                    <Mail size={16} strokeWidth={2} />
                    <input
                      type="email"
                      placeholder="you@store.ua"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && <span className="checkout__field-hint">{errors.email}</span>}
                </label>

                <label
                  className={`checkout__field ${errors.phone ? 'checkout__field--error' : ''}`}
                >
                  <span className="checkout__field-label">Телефон</span>
                  <div className="checkout__input-wrap">
                    <Phone size={16} strokeWidth={2} />
                    <input
                      type="tel"
                      placeholder="+380 __ ___ __ __"
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      autoComplete="tel"
                    />
                  </div>
                  {errors.phone && <span className="checkout__field-hint">{errors.phone}</span>}
                </label>
              </div>
            </section>

            <section className="checkout__section">
              <h2 className="checkout__section-title">Магазин</h2>
              <div className="checkout__fields">
                <label
                  className={`checkout__field ${errors.site ? 'checkout__field--error' : ''}`}
                >
                  <span className="checkout__field-label">
                    Адреса магазину <span className="checkout__field-req">*</span>
                  </span>
                  <div className="checkout__input-wrap">
                    <Globe size={16} strokeWidth={2} />
                    <input
                      type="text"
                      placeholder="store.com.ua"
                      value={form.site}
                      onChange={(e) => update('site', e.target.value)}
                    />
                  </div>
                  {errors.site && <span className="checkout__field-hint">{errors.site}</span>}
                </label>

                <div className="checkout__field">
                  <span className="checkout__field-label">Платформа</span>
                  <div className="checkout__platforms">
                    {platformConfig.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        disabled={!p.available}
                        className={`checkout__platform ${form.platform === p.id ? 'checkout__platform--active' : ''} ${!p.available ? 'checkout__platform--disabled' : ''}`}
                        onClick={() => p.available && update('platform', p.id)}
                      >
                        {p.label}
                        {!p.available && <span className="checkout__platform-soon">Скоро</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="checkout__section">
              <h2 className="checkout__section-title">Спосіб оплати</h2>
              <div className="checkout__paymethods">
                {PAYMENTS.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    className={`checkout__paymethod ${paymethod === method.id ? 'checkout__paymethod--active' : ''}`}
                    onClick={() => setPaymethod(method.id)}
                    aria-pressed={paymethod === method.id}
                    aria-label={method.name}
                  >
                    <img
                      src={method.symbol}
                      alt=""
                      className="checkout__paymethod-symbol"
                      aria-hidden="true"
                    />
                    <div className="checkout__paymethod-body">
                      <strong className="checkout__paymethod-name">{method.name}</strong>
                      <span className="checkout__paymethod-hint">{method.hint}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <label
              className={`checkout__agree ${errors.agreed ? 'checkout__agree--error' : ''}`}
            >
              <input
                type="checkbox"
                checked={form.agreed}
                onChange={(e) => update('agreed', e.target.checked)}
              />
              <span>
                Погоджуюсь з{' '}
                <a href="/privacy" target="_blank" rel="noreferrer">
                  обробкою даних
                </a>{' '}
                та{' '}
                <a href="/terms" target="_blank" rel="noreferrer">
                  умовами
                </a>
              </span>
            </label>

            <button type="submit" className="checkout__pay-btn" disabled={paying}>
              {paying ? (
                <>
                  <LoaderCircle size={18} strokeWidth={2.5} className="checkout__spinner" />
                  <span>Переходимо до оплати...</span>
                </>
              ) : (
                <>
                  <CreditCard size={18} strokeWidth={2} />
                  <span>Оплатити {totalPrice.toLocaleString('uk-UA')} грн</span>
                  <ArrowRight size={16} strokeWidth={2.5} />
                </>
              )}
            </button>

            <div className="checkout__trust">
              <span className="checkout__trust-item">
                <Lock size={13} strokeWidth={2.25} />
                Безпечна оплата
              </span>
              <span className="checkout__trust-sep" aria-hidden="true">
                ·
              </span>
              <span className="checkout__trust-item">
                <ShieldCheck size={13} strokeWidth={2.25} />
                14 днів гарантія повернення
              </span>
            </div>
          </form>

          {/* ── Summary ── */}
          <aside className="checkout__summary">
            <h2 className="checkout__summary-title">Замовлення</h2>

            <ul className="checkout__items">
              {items.map((item) => (
                <li key={`${item.kind}-${item.id}`} className="checkout__item">
                  <div className="checkout__item-icon">
                    {item.kind === 'package' ? (
                      <div className="checkout__pkg-icon">P</div>
                    ) : (
                      <WidgetIcon name={item.icon} size={20} />
                    )}
                  </div>
                  <div className="checkout__item-body">
                    <p className="checkout__item-title">{item.title}</p>
                    <p className="checkout__item-meta">
                      {item.kind === 'package'
                        ? `${item.widgetsCount ?? 0} віджетів`
                        : 'Одиночний віджет'}
                    </p>
                  </div>
                  <span className="checkout__item-price">
                    {item.price.toLocaleString('uk-UA')} грн
                  </span>
                </li>
              ))}
            </ul>

            <div className="checkout__totals">
              {savings > 0 && (
                <div className="checkout__total-row">
                  <span>Без знижки:</span>
                  <span className="checkout__total-old">
                    {originalTotal.toLocaleString('uk-UA')} грн
                  </span>
                </div>
              )}
              {savings > 0 && (
                <div className="checkout__total-row checkout__total-row--savings">
                  <span>Ви економите:</span>
                  <span>−{savings.toLocaleString('uk-UA')} грн</span>
                </div>
              )}
              <div className="checkout__total-row checkout__total-row--final">
                <span>До сплати:</span>
                <strong>{totalPrice.toLocaleString('uk-UA')} грн</strong>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
