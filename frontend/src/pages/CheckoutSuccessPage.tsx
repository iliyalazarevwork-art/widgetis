import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Code2,
  Headphones,
  ArrowRight,
  Mail,
  FileText,
  PhoneCall,
  Sparkles,
} from 'lucide-react'
import { BRAND_NAME_UPPER } from '../constants/brand'
import './CheckoutSuccessPage.css'

interface StoredOrder {
  email: string
  phone: string
  site: string
  platform: string
  orderNumber: string
  totalPrice: number
  items: Array<{ kind: string; title: string }>
}

type InstallChoice = 'self' | 'manager' | null

export function CheckoutSuccessPage() {
  const navigate = useNavigate()
  const [order, setOrder] = useState<StoredOrder | null>(null)
  const [choice, setChoice] = useState<InstallChoice>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('wty_last_order')
    if (!raw) {
      navigate('/catalog', { replace: true })
      return
    }
    try {
      setOrder(JSON.parse(raw))
    } catch {
      navigate('/catalog', { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [choice])

  if (!order) return null

  return (
    <div className="success">
      <Helmet>
        <title>{`Замовлення оплачено — ${BRAND_NAME_UPPER}`}</title>
      </Helmet>

      <div className="success__container">
        {/* ── Hero confirmation ── */}
        <div className="success__hero">
          <div className="success__icon" aria-hidden="true">
            <CheckCircle2 size={48} strokeWidth={2} />
          </div>
          <h1 className="success__title">
            Замовлення <span className="success__title-accent">оплачено</span>
          </h1>
          <p className="success__sub">
            Номер замовлення: <strong>{order.orderNumber}</strong>
          </p>
          <p className="success__sub-email">
            Підтвердження відправили на <strong>{order.email}</strong>
          </p>
        </div>

        {!choice ? (
          <>
            {/* ── Install choice ── */}
            <h2 className="success__choice-title">Як будемо встановлювати?</h2>
            <p className="success__choice-sub">Обери варіант — ми підлаштуємось під тебе</p>

            <div className="success__options">
              <button
                className="success__option"
                onClick={() => setChoice('self')}
                type="button"
              >
                <div className="success__option-icon" aria-hidden="true">
                  <Code2 size={26} strokeWidth={2} />
                </div>
                <h3 className="success__option-title">Встановлю сам</h3>
                <p className="success__option-desc">
                  Отримаєш на email готовий скрипт і покрокову інструкцію. 3 хвилини — і готово.
                </p>
                <ul className="success__option-list">
                  <li>
                    <Mail size={13} strokeWidth={2.25} />
                    <span>Скрипт прийде на пошту за 5 хвилин</span>
                  </li>
                  <li>
                    <FileText size={13} strokeWidth={2.25} />
                    <span>Інструкція зі скріншотами під твою CMS</span>
                  </li>
                </ul>
                <span className="success__option-cta">
                  Обрати цей варіант
                  <ArrowRight size={14} strokeWidth={2.5} />
                </span>
              </button>

              <button
                className="success__option success__option--featured"
                onClick={() => setChoice('manager')}
                type="button"
              >
                <div className="success__option-badge" aria-hidden="true">
                  <Sparkles size={11} strokeWidth={2.5} />
                  <span>Швидше</span>
                </div>
                <div className="success__option-icon success__option-icon--accent" aria-hidden="true">
                  <Headphones size={26} strokeWidth={2} />
                </div>
                <h3 className="success__option-title">Хочу допомогу менеджера</h3>
                <p className="success__option-desc">
                  Наш менеджер зв'яжеться протягом 15 хвилин і встановить разом з тобою через
                  екран.
                </p>
                <ul className="success__option-list">
                  <li>
                    <PhoneCall size={13} strokeWidth={2.25} />
                    <span>Дзвінок або Telegram/Viber — як зручно</span>
                  </li>
                  <li>
                    <CheckCircle2 size={13} strokeWidth={2.25} />
                    <span>Перевіримо, що все працює</span>
                  </li>
                </ul>
                <span className="success__option-cta">
                  Обрати цей варіант
                  <ArrowRight size={14} strokeWidth={2.5} />
                </span>
              </button>
            </div>
          </>
        ) : (
          <div className="success__confirm">
            <div className="success__confirm-icon" aria-hidden="true">
              {choice === 'self' ? (
                <Mail size={32} strokeWidth={2} />
              ) : (
                <PhoneCall size={32} strokeWidth={2} />
              )}
            </div>
            <h2 className="success__confirm-title">
              {choice === 'self'
                ? 'Скрипт уже летить на твою пошту'
                : 'Чекай на дзвінок протягом 15 хвилин'}
            </h2>
            <p className="success__confirm-text">
              {choice === 'self' ? (
                <>
                  Перевір <strong>{order.email}</strong> (і теку «Спам» на всяк випадок).
                  У листі — готовий скрипт і коротка інструкція під {order.platform}.
                </>
              ) : (
                <>
                  Менеджер напише на <strong>{order.email}</strong>{' '}
                  {order.phone && (
                    <>або зателефонує на <strong>{order.phone}</strong>{' '}</>
                  )}
                  і допоможе встановити на <strong>{order.site}</strong>.
                </>
              )}
            </p>
            <div className="success__confirm-actions">
              <button
                className="success__confirm-switch"
                onClick={() => setChoice(null)}
                type="button"
              >
                Змінити варіант
              </button>
              <Link to="/catalog" className="success__confirm-cta">
                До каталогу
                <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
