import { useEffect, useState } from 'react'
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Gift } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { get } from '../../api/client'
import type { Payment, PaginatedResponse, Subscription } from '../../types'
import './styles/payments.css'

export default function PaymentsPage() {
  const navigate = useNavigate()
  const [sub, setSub] = useState<Subscription | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      get<{ data: Subscription }>('/profile/subscription').catch(() => null),
      get<PaginatedResponse<Payment>>('/profile/payments', { page, per_page: 8 }),
    ])
      .then(([subRes, paymentsRes]) => {
        if (subRes) setSub(subRes.data)
        setPayments(paymentsRes.data)
        setLastPage(Math.max(1, paymentsRes.meta?.last_page ?? 1))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  const pages = buildPages(page, lastPage)
  const nextChargeDate = sub?.current_period_end
    ? formatDate(sub.current_period_end)
    : '—'
  const planLabel = sub
    ? `${sub.plan.name} · ${formatCurrency(sub.plan.price_monthly)}`
    : 'Немає активного плану'

  if (loading) return <div className="page-loader">Завантаження…</div>

  return (
    <div className="pay-page">
      <header className="pay-page__header">
        <button className="pay-page__back" onClick={() => navigate(-1)} aria-label="Назад">
          <ArrowLeft size={18} />
        </button>
        <h1 className="pay-page__title">Історія платежів</h1>
        <div className="pay-page__header-spacer" />
      </header>

      <div className="pay-page__summary">
        <div className="pay-page__summary-card">
          <span className="pay-page__summary-label">Поточний план</span>
          <span className="pay-page__summary-value pay-page__summary-value--accent">{planLabel}</span>
        </div>
        <div className="pay-page__summary-card">
          <span className="pay-page__summary-label">Наступне списання</span>
          <span className="pay-page__summary-value">{nextChargeDate}</span>
        </div>
      </div>

      <p className="pay-page__section-title">Транзакції</p>

      {payments.length === 0 && (
        <div className="pay-page__empty-card">Платежів поки немає</div>
      )}

      <div className="pay-page__list">
        {payments.map((p) => {
          const trial = isTrialPayment(p)
          return (
            <div key={p.id} className="pay-page__item">
              <div className={`pay-page__icon-wrap ${trial ? 'pay-page__icon-wrap--trial' : 'pay-page__icon-wrap--ok'}`}>
                {trial ? <Gift size={16} /> : <Check size={16} />}
              </div>
              <div className="pay-page__item-left">
                <span className="pay-page__item-type">{paymentTitle(p)}</span>
                <span className="pay-page__item-date">{paymentSubtitle(p)}</span>
              </div>
              <div className="pay-page__item-right">
                <span className={`pay-page__item-amount ${trial ? 'pay-page__item-amount--trial' : ''}`}>
                  {paymentAmount(p)}
                </span>
                <span className={`pay-page__item-status ${trial ? 'pay-page__item-status--trial' : statusClass(p.status)}`}>
                  {trial ? 'Trial 7 днів' : statusLabel(p.status)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {lastPage > 1 && (
        <div className="pay-page__pagination">
          <button
            type="button"
            className="pay-page__page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label="Попередня сторінка"
          >
            <ChevronLeft size={16} />
          </button>
          {pages.map((item, idx) => (
            item === '...'
              ? <span key={`dots-${idx}`} className="pay-page__dots">…</span>
              : (
                <button
                  key={item}
                  type="button"
                  className={`pay-page__page-btn ${item === page ? 'pay-page__page-btn--active' : ''}`}
                  onClick={() => setPage(item)}
                >
                  {item}
                </button>
              )
          ))}
          <button
            type="button"
            className="pay-page__page-btn"
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            disabled={page >= lastPage}
            aria-label="Наступна сторінка"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

function paymentTitle(p: Payment): string {
  if (isTrialPayment(p)) return 'Trial активовано'
  if (p.type.includes('subscription')) return `Pro підписка — ${monthName(p.created_at)}`
  if (p.type === 'charge') return `Оплата — ${monthName(p.created_at)}`

  return p.type
}

function paymentSubtitle(p: Payment): string {
  if (isTrialPayment(p)) return formatDate(p.created_at)

  return `${formatDate(p.created_at)} · LiqPay`
}

function paymentAmount(p: Payment): string {
  if (isTrialPayment(p)) return '0 ₴'

  return `−${formatCurrency(Math.abs(p.amount), false)}`
}

function isTrialPayment(p: Payment): boolean {
  return p.type === 'trial_activation' || p.amount === 0
}

function formatDate(raw: string): string {
  return new Date(raw).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function monthName(raw: string): string {
  return new Date(raw).toLocaleDateString('uk-UA', { month: 'long' })
}

function formatCurrency(amount: number, withSign = true): string {
  const value = Math.round(amount)
  const text = value.toLocaleString('uk-UA')
  if (!withSign) return `${text} ₴`

  return `${text} ₴`
}

function statusClass(status: string): string {
  switch (status) {
    case 'success': return 'pay-page__item-status--success'
    case 'pending': return 'pay-page__item-status--pending'
    case 'failed': return 'pay-page__item-status--failed'
    default: return ''
  }
}

function statusLabel(s: string): string {
  switch (s) {
    case 'success': return 'Успішно'
    case 'pending': return 'Очікує'
    case 'failed': return 'Помилка'
    default: return s
  }
}

function buildPages(current: number, total: number): Array<number | '...'> {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 3) return [1, 2, 3, '...', total]
  if (current >= total - 2) return [1, '...', total - 2, total - 1, total]

  return [1, '...', current, '...', total]
}
