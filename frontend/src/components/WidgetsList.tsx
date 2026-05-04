import { Link } from 'react-router-dom'
import { useWidgets } from '../hooks/useWidgets'
import { FeaturedWidgetCard } from './FeaturedWidgetCard'
import './WidgetsList.css'

const FEATURED_SLUGS = ['delivery-date', 'cart-goal', 'promo-line', 'photo-video-reviews']

export function WidgetsList() {
  const { widgets, loading } = useWidgets()

  const featured = loading
    ? []
    : FEATURED_SLUGS.map((slug) => widgets.find((w) => w.slug === slug)).filter(Boolean) as typeof widgets

  return (
    <section className="wl">
      <div className="wl__container">
        <header className="wl__header">
          <p className="wl__eyebrow">Каталог</p>
          <h2 className="wl__title">Віджети для магазину</h2>
          <p className="wl__subtitle">
            Кожен вирішує конкретну задачу. Підключайте ті, що потрібні.
          </p>
        </header>

        <div className="wp__grid">
          {loading
            ? FEATURED_SLUGS.map((slug) => <div key={slug} className="wc wc--skeleton" style={{ height: 260 }} />)
            : featured.map((w, i) => <FeaturedWidgetCard key={w.slug} widget={w} index={i} />)
          }
        </div>

        <div className="wl__cta">
          <Link to="/widgets" className="wl__cta-btn">
            Переглянути всі віджети →
          </Link>
        </div>
      </div>
    </section>
  )
}
