import { useEffect, useState } from 'react'
import { X, AlertCircle, ExternalLink, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { get } from '../api/client'
import { BRAND_NAME } from '../constants/brand'
import './LiveDemoModal.css'

interface DemoSessionData {
  code: string
  domain: string
  expires_at: string
}

interface LiveDemoModalProps {
  isOpen: boolean
  onClose: () => void
  code: string
}

export function LiveDemoModal({ isOpen, onClose, code }: LiveDemoModalProps) {
  const [demo, setDemo] = useState<DemoSessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !code) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDemo(null)
    setLoading(true)
    setError(null)

    get<{ data: DemoSessionData }>(`/demo-sessions/${encodeURIComponent(code)}`)
      .then(({ data }) => setDemo(data))
      .catch(() => setError('Не вдалося завантажити демо-сесію.'))
      .finally(() => setLoading(false))
  }, [isOpen, code])

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const logoSvg = (
    <svg className="dm-topbar-logo-mark" viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M 14 14 L 42 86 L 60 46 L 78 86 L 106 14" fill="none" stroke="currentColor" strokeWidth="22" strokeLinejoin="miter" strokeLinecap="round" />
    </svg>
  )

  const topbar = (domain?: string) => (
    <div className="dm-topbar">
      <div className="dm-topbar-left">
        <span className="dm-topbar-logo">
          {logoSvg}
          <span className="dm-topbar-logo-text">{BRAND_NAME}</span>
        </span>
        {domain && (
          <>
            <span className="dm-topbar-sep" />
            <span className="dm-topbar-domain">{domain}</span>
          </>
        )}
      </div>
      <div className="dm-topbar-right">
        {domain && (
          <a
            className="dm-topbar-btn"
            href={`https://${domain}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={14} />
            <span>Сайт</span>
          </a>
        )}
        <button className="dm-close-btn" onClick={onClose} aria-label="Закрити">
          <X size={18} />
        </button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="dm-overlay">
        <div className="dm-page">
          {topbar()}
          <div className="dm-center">
            <div className="dm-spinner-big" />
            <div className="dm-loading-text">Завантаження демо...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !demo) {
    return (
      <div className="dm-overlay">
        <div className="dm-page">
          {topbar()}
          <div className="dm-center">
            <AlertCircle size={48} strokeWidth={1.5} />
            <div className="dm-error-title">Демо недоступне</div>
            <p className="dm-loading-text">{error || 'Невідома помилка'}</p>
            <button className="dm-close-error" onClick={onClose}>Закрити</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dm-overlay">
      <div className="dm-page">
        {topbar(demo.domain)}

        <div className="dm-body">
          <div className="dm-iframe-area">
            <iframe
              className="dm-iframe"
              src={`${(import.meta.env.VITE_PREVIEW_BASE_URL || '').replace(/\/+$/, '')}/site/${demo.domain}/?v=mobile`}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              title={`Preview of ${demo.domain}`}
            />

            <Link to="/pricing" className="dm-floating-cta" onClick={onClose}>
              <Zap size={15} />
              <span>Замовити віджети</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
