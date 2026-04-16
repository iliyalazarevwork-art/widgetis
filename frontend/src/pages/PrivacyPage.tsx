import { SeoHead } from '../components/SeoHead'
import { Link } from 'react-router-dom'
import { BRAND_NAME_UPPER } from '../constants/brand'
import privacyContent from './privacyContent.html?raw'
import './SimpleLegalPage.css'

export function PrivacyPage() {
  return (
    <div className="simple-doc-page">
      <SeoHead
        title={`Політика конфіденційності — ${BRAND_NAME_UPPER}`}
        description="Політика конфіденційності Widgetis: як ми збираємо, обробляємо та захищаємо ваші персональні дані."
        path="/privacy"
      />

      <main className="simple-doc-page__container">
        <Link to="/" className="simple-doc-page__back">← На головну</Link>
        <article
          className="simple-doc-page__offer"
          dangerouslySetInnerHTML={{ __html: privacyContent }}
        />
      </main>
    </div>
  )
}
