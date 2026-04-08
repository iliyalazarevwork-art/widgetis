import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  PreviewPhotoReviews,
  PreviewViewers,
  PreviewStock,
  PreviewCartGoal,
  PreviewDelivery,
  PreviewCashback,
} from './WidgetPreviews'
import './WidgetPreviews.css'
import './WidgetsList.css'

// ─── Card data ────────────────────────────────────────────────────────────────

const WIDGETS = [
  {
    slug: 'photo-reviews',
    name: 'Фотовідгуки',
    description: 'Покупці довіряють фото інших покупців більше, ніж опису товару.',
    preview: PreviewPhotoReviews,
  },
  {
    slug: 'live-viewers',
    name: 'Хто зараз дивиться',
    description: 'Соціальний доказ у реальному часі — підштовхує до рішення.',
    preview: PreviewViewers,
  },
  {
    slug: 'purchase-counter',
    name: 'Лічильник залишків',
    description: 'Дефіцит товару стимулює швидку покупку і знижує зволікання.',
    preview: PreviewStock,
  },
  {
    slug: 'free-delivery',
    name: 'Прогрес кошика',
    description: 'Збільшує середній чек — покупець сам докладає товари для бонусу.',
    preview: PreviewCartGoal,
  },
  {
    slug: 'delivery-date',
    name: 'Дата доставки',
    description: 'Конкретна дата прибирає сумніви і прискорює рішення про покупку.',
    preview: PreviewDelivery,
  },
  {
    slug: 'cashback',
    name: 'Кешбек-калькулятор',
    description: 'Утримує клієнтів і стимулює повторні покупки через бонуси.',
    preview: PreviewCashback,
  },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

export function WidgetsList() {
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
          {WIDGETS.map((w) => {
            const Preview = w.preview
            return (
              <Link key={w.slug} to={`/widgets/${w.slug}`} className="wl__card">
                <h3 className="wl__card-title">{w.name}</h3>
                <div className="wl__preview">
                  <Preview />
                </div>
                <p className="wl__desc">{w.description}</p>
                <span className="wl__card-more">
                  Детальніше
                  <ArrowRight size={13} strokeWidth={2.5} />
                </span>
              </Link>
            )
          })}
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
