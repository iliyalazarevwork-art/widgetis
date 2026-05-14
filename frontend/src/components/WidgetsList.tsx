import { Link } from 'react-router-dom'
import { useWidgets } from '../hooks/useWidgets'
import { FeaturedWidgetCard } from './FeaturedWidgetCard'
import './WidgetsList.css'

const FEATURED_WIDGETS_COUNT = 4

export function WidgetsList() {
  const { widgets, loading } = useWidgets({ sort: 'widgets-page' })

  const featured = loading ? [] : widgets.slice(0, FEATURED_WIDGETS_COUNT)

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

        <div className="wl__grid">
          {loading
            ? Array.from({ length: FEATURED_WIDGETS_COUNT }, (_, i) => (
                <div key={i} className="wc wc--skeleton" style={{ height: 260 }} />
              ))
            : featured.map((w, i) => <FeaturedWidgetCard key={w.slug} widget={w} index={i} eager />)
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
