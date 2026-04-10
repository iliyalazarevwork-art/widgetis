import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { SeoHead } from '../components/SeoHead'
import { LiveDemoModal } from '../components/LiveDemoModal'
import { BRAND_NAME_UPPER } from '../constants/brand'

export function LiveDemoPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const code = params.get('code') || ''

  if (!code) {
    return (
      <div className="dm-overlay">
        <div className="dm-page">
          <div className="dm-center">
            <AlertCircle size={48} strokeWidth={1.5} />
            <div className="dm-error-title">Демо недоступне</div>
            <p className="dm-loading-text">Невірне посилання: відсутній код демо.</p>
            <Link to="/" className="dm-close-error">
              На головну <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <SeoHead
        title={`Демо — ${BRAND_NAME_UPPER}`}
        description={`Інтерактивне демо віджетів ${BRAND_NAME_UPPER}.`}
        path="/live-demo"
        noindex
      />
      <LiveDemoModal isOpen code={code} onClose={() => navigate('/')} />
    </>
  )
}
