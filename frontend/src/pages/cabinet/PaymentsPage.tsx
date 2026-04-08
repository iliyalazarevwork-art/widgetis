import { useEffect, useState } from 'react'
import { get } from '../../api/client'
import type { Payment, PaginatedResponse } from '../../types'
import './styles/payments.css'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    get<PaginatedResponse<Payment>>('/profile/payments')
      .then((res) => setPayments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-loader">Завантаження…</div>

  return (
    <div className="pay-page">
      <h1 className="pay-page__title">Історія платежів</h1>

      {payments.length === 0 ? (
        <div className="pay-page__empty">Платежів поки немає</div>
      ) : (
        <div className="pay-page__list">
          {payments.map((p) => (
            <div key={p.id} className="pay-page__item">
              <div className="pay-page__item-left">
                <span className="pay-page__item-type">{p.type === 'charge' ? 'Оплата' : p.type}</span>
                <span className="pay-page__item-date">
                  {new Date(p.created_at).toLocaleDateString('uk-UA')}
                </span>
              </div>
              <div className="pay-page__item-right">
                <span className="pay-page__item-amount">
                  {p.amount > 0 ? '+' : ''}{p.amount} {p.currency || '₴'}
                </span>
                <span className={`pay-page__item-status pay-page__item-status--${p.status}`}>
                  {statusLabel(p.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function statusLabel(s: string): string {
  switch (s) {
    case 'success': return 'Успішно'
    case 'pending': return 'Очікує'
    case 'failed': return 'Помилка'
    default: return s
  }
}
