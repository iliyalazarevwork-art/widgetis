import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Plus, Minus, ChevronDown } from 'lucide-react'
import { get } from '../../api/client'
import type { FaqItem } from '../../types'
import './styles/support.css'

const QUICK_TEMPLATES = [
  { label: 'Не працює віджет', msg: 'Не працює віджет' },
  { label: 'Як підключити?', msg: 'Як підключити?' },
  { label: 'Питання по оплаті', msg: 'Питання по оплаті' },
  { label: 'Попросити дзвінок', msg: 'Попросити дзвінок' },
]

const TG_USERNAME = 'widgetis'
const SUPPORT_EMAIL = 'support@widgetis.com'

function HeadsetIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 5C9.029 5 5 9.029 5 14v1" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round"/>
      <rect x="4" y="14" width="4" height="7" rx="2" fill="#10B981"/>
      <rect x="20" y="14" width="4" height="7" rx="2" fill="#10B981"/>
      <path d="M23 14v-1C23 9.029 18.971 5 14 5" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M24 20.5C24 22.433 22.433 24 20.5 24H16" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="15" cy="24" r="1.5" fill="#10B981"/>
    </svg>
  )
}

function TelegramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  )
}

export default function SupportPage() {
  const navigate = useNavigate()
  const [faq, setFaq] = useState<FaqItem[]>([])
  const [openId, setOpenId] = useState<number | null>(null)
  const [faqOpen, setFaqOpen] = useState(true)

  useEffect(() => {
    get<{ data: FaqItem[] }>('/faq', { category: 'support' })
      .then((res) => setFaq(res.data))
      .catch(() => {})
  }, [])

  const openTelegram = (msg?: string) => {
    const url = msg
      ? `https://t.me/${TG_USERNAME}?text=${encodeURIComponent(msg)}`
      : `https://t.me/${TG_USERNAME}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="sup">
      {/* Header */}
      <div className="sup__header">
        <button className="page-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <div className="sup__header-center">
          <span className="sup__title">Підтримка</span>
          <span className="sup__subtitle">Відповідаємо швидко</span>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Hero card */}
      <div className="sup__hero">
        <div className="sup__hero-icon-wrap">
          <HeadsetIcon />
        </div>
        <p className="sup__hero-title">Ми завжди поруч</p>
        <p className="sup__hero-sub">Середній час відповіді — 15 хвилин</p>
      </div>

      {/* Telegram CTA */}
      <button className="sup__tg-btn" onClick={() => openTelegram()}>
        <TelegramIcon />
        <div className="sup__tg-btn-text">
          <span className="sup__tg-btn-label">Написати в Telegram</span>
          <span className="sup__tg-btn-handle">@{TG_USERNAME}</span>
        </div>
      </button>

      {/* Email */}
      <a href={`mailto:${SUPPORT_EMAIL}`} className="sup__email-row">
        <Mail size={16} className="sup__email-icon" />
        <span className="sup__email-text">{SUPPORT_EMAIL}</span>
      </a>

      {/* Quick templates */}
      <div className="sup__section">
        <div className="sup__section-head">
          <span className="sup__section-title">Швидкі шаблони</span>
          <span className="sup__eta-badge">ETA ~ 15 хв</span>
        </div>
        <div className="sup__tags">
          {QUICK_TEMPLATES.map((t) => (
            <button
              key={t.label}
              className="sup__tag"
              onClick={() => openTelegram(t.msg)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ */}
      {faq.length > 0 && (
        <div className="sup__section">
          <button
            className="sup__section-head sup__section-head--btn"
            onClick={() => setFaqOpen((v) => !v)}
          >
            <span className="sup__section-title">Часті питання</span>
            <ChevronDown
              size={16}
              className={`sup__faq-chevron${faqOpen ? ' sup__faq-chevron--open' : ''}`}
            />
          </button>
          {faqOpen && (
            <div className="sup__faq">
              {faq.map((item) => {
                const isOpen = openId === item.id
                return (
                  <div key={item.id} className="sup__faq-item">
                    <button
                      className="sup__faq-q"
                      onClick={() => setOpenId(isOpen ? null : item.id)}
                    >
                      <span>{item.question}</span>
                      {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                    </button>
                    {isOpen && (
                      <div className="sup__faq-a">{item.answer}</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Status bar */}
      <div className="sup__status">
        <span className="sup__status-dot" />
        <span className="sup__status-text">Підтримка онлайн · Пн-Пт 9:00–20:00</span>
      </div>
    </div>
  )
}
