import { SeoHead } from '../components/SeoHead'
import { Link } from 'react-router-dom'
import { BRAND_NAME_UPPER } from '../constants/brand'
import offerContent from './offerContent.html?raw'
import './SimpleLegalPage.css'

export function OfferPage() {
  return (
    <div className="simple-doc-page">
      <SeoHead
        title={`Публічна оферта — ${BRAND_NAME_UPPER}`}
        description="Публічна оферта Widgetis: договір про надання послуг доступу до SaaS-платформи на умовах підписки."
        path="/offer"
      />

      <main className="simple-doc-page__container">
        <Link to="/" className="simple-doc-page__back">← На головну</Link>
        <article
          className="simple-doc-page__offer"
          dangerouslySetInnerHTML={{ __html: offerContent }}
        />
      </main>
    </div>
  )
}
