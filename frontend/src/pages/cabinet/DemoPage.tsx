import { ArrowLeft, Share2, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import './styles/demo.css'

export default function DemoPage() {
  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast.success('Посилання скопійовано')
  }

  return (
    <div className="demo-page">
      <div className="demo-page__header">
        <Link to="/cabinet" className="demo-page__back"><ArrowLeft size={18} /></Link>
        <span className="demo-page__title">Демо-сесія</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="demo-page__body">
        <div className="demo-page__info">
          <p className="demo-page__info-text">
            Подивіться, як Ваш магазин виглядає з підключеними віджетами в реальному часі
          </p>
        </div>

        <div className="demo-page__preview">
          <div className="demo-page__preview-bar">
            <div className="demo-page__preview-dots">
              <span /><span /><span />
            </div>
            <span className="demo-page__preview-url">demo.widgetis.com</span>
          </div>
          <div className="demo-page__preview-body">
            <div className="demo-page__preview-placeholder">
              Демо-превʼю буде тут
            </div>
          </div>
        </div>

        <div className="demo-page__actions">
          <button className="demo-page__btn-primary" onClick={handleShare}>
            <Share2 size={18} /> Поділитись
          </button>
          <a
            href="https://t.me/widgetis_support"
            target="_blank"
            rel="noopener noreferrer"
            className="demo-page__btn-tg"
          >
            <Send size={18} /> Написати менеджеру
          </a>
        </div>
      </div>
    </div>
  )
}
