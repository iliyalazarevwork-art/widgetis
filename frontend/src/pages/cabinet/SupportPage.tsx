import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, ChevronDown, ChevronUp, MessageCircle, ArrowLeft } from 'lucide-react'
import { get } from '../../api/client'
import type { FaqItem } from '../../types'
import './styles/support.css'

export default function SupportPage() {
  const navigate = useNavigate()
  const [faq, setFaq] = useState<FaqItem[]>([])
  const [openId, setOpenId] = useState<number | null>(null)

  useEffect(() => {
    get<{ data: FaqItem[] }>('/faq', { category: 'support' })
      .then((res) => setFaq(res.data))
      .catch(() => {})
  }, [])

  return (
    <div className="sup-page">
      <div className="sup-page__header">
        <button className="page-back" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <h1 className="sup-page__title">Підтримка</h1>
        <div style={{ width: 36 }} />
      </div>

      <div className="sup-page__contacts">
        <a href="https://t.me/widgetis_support" target="_blank" rel="noopener noreferrer" className="sup-page__contact">
          <Send size={18} className="sup-page__tg-icon" />
          <div>
            <span className="sup-page__contact-label">Telegram</span>
            <span className="sup-page__contact-desc">Швидка відповідь</span>
          </div>
        </a>
        <a href="mailto:support@widgetis.com" className="sup-page__contact">
          <MessageCircle size={18} className="sup-page__email-icon" />
          <div>
            <span className="sup-page__contact-label">Email</span>
            <span className="sup-page__contact-desc">support@widgetis.com</span>
          </div>
        </a>
      </div>

      {faq.length > 0 && (
        <>
          <h2 className="sup-page__section-title">Часті питання</h2>
          <div className="sup-page__faq">
            {faq.map((item) => (
              <div key={item.id} className="sup-page__faq-item">
                <button
                  className="sup-page__faq-q"
                  onClick={() => setOpenId(openId === item.id ? null : item.id)}
                >
                  <span>{item.question}</span>
                  {openId === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {openId === item.id && (
                  <div className="sup-page__faq-a">{item.answer}</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
