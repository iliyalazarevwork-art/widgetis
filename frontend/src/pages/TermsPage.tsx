import { SeoHead } from '../components/SeoHead'
import { Link } from 'react-router-dom'
import { BRAND_NAME_UPPER } from '../constants/brand'
import termsContent from './termsContent.html?raw'
import './SimpleLegalPage.css'

export function TermsPage() {
  return (
    <div className="simple-doc-page">
      <SeoHead
        title={`Умови використання — ${BRAND_NAME_UPPER}`}
        description="Умови використання SaaS-платформи Widgetis: правила користування сервісом, права та обов'язки сторін."
        path="/terms"
      />

      <main className="simple-doc-page__container">
        <Link to="/" className="simple-doc-page__back">← На головну</Link>
        <article
          className="simple-doc-page__offer"
          dangerouslySetInnerHTML={{ __html: termsContent }}
        />
      </main>
    </div>
  )
}
