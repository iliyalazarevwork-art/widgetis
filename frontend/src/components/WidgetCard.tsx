import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { WidgetIcon } from './WidgetIcon'
import { getTagColorClass } from '../data/widgetTags'
import type { ApiWidget } from '../api/widgets'
import { PREVIEW_MAP } from './WidgetPreviews'
import './WidgetCard.css'

interface WidgetCardProps {
  widget: ApiWidget
  index?: number
}

export function WidgetCard({ widget: w, index = 0 }: WidgetCardProps) {
  const tagLabel = w.tag?.name ?? ''
  const colorClass = getTagColorClass(w.tag?.slug)
  const Preview = PREVIEW_MAP[w.slug]

  return (
    <Link
      to={`/widgets/${w.slug}`}
      className="widget-card"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div className="widget-card__head">
        <div className="widget-card__badges">
          {w.is_new && <span className="widget-card__badge widget-card__badge--new">NEW</span>}
          {w.is_popular && (
            <span className="widget-card__badge widget-card__badge--popular">Популярне</span>
          )}
        </div>
        <span className={`widget-card__tag widget-card__tag--${colorClass}`}>{tagLabel}</span>
      </div>

      <div className="widget-card__preview">
        {Preview ? <Preview /> : <div className="widget-card__preview-icon"><WidgetIcon name={w.icon} size={32} /></div>}
      </div>

      <div className="widget-card__body">
        <h3 className="widget-card__title">{w.name}</h3>
        <p className="widget-card__desc">{w.description}</p>
      </div>

      <div className="widget-card__footer">
        <span className="widget-card__more">
          Детальніше
          <ArrowRight size={13} strokeWidth={2.25} />
        </span>
      </div>
    </Link>
  )
}
