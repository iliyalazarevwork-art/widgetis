import { useSearchParams } from 'react-router-dom'
import { SeoHead } from '../components/SeoHead'
import { DemoSection } from '../components/DemoSection'
import { BRAND_NAME, BRAND_NAME_UPPER } from '../constants/brand'
import './FreeDemoPage.css'

const logoSvg = (
  <svg className="fdp-logo-mark" viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M 14 14 L 42 86 L 60 46 L 78 86 L 106 14" fill="none" stroke="currentColor" strokeWidth="22" strokeLinejoin="miter" strokeLinecap="round" />
  </svg>
)

export function FreeDemoPage() {
  const [params] = useSearchParams()
  const initialUrl = params.get('url') ?? undefined

  return (
    <div className="fdp">
      <SeoHead
        title={`Безкоштовне демо — ${BRAND_NAME_UPPER}`}
        description={`Введіть адресу вашого магазину і побачте маркетингові віджети ${BRAND_NAME_UPPER} в дії за 10 секунд.`}
        path="/free-demo"
        noindex
      />

      <header className="fdp-header">
        <a className="fdp-logo" href="/">
          {logoSvg}
          <span>{BRAND_NAME}</span>
        </a>
      </header>

      <main className="fdp-main">
        <DemoSection initialUrl={initialUrl} />
      </main>
    </div>
  )
}
