import { useSearchParams } from 'react-router-dom'
import { SeoHead } from '../components/SeoHead'
import { DemoSection } from '../components/DemoSection'
import { BRAND_NAME_UPPER } from '../constants/brand'
import './FreeDemoPage.css'

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
      <DemoSection initialUrl={initialUrl} />
    </div>
  )
}
