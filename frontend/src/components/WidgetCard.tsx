import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { WidgetIcon } from './WidgetIcon'
import { tagLabels, type Widget } from '../data/widgets'
import { PREVIEW_MAP } from './WidgetPreviews'
import './WidgetCard.css'

interface WidgetCardProps {
  widget: Widget
  index?: number
}

export function WidgetCard({ widget: w, index = 0 }: WidgetCardProps) {
  const tagLabel = tagLabels[w.tag]
  const Preview = PREVIEW_MAP[w.id]

  return (
    <Link
      to={`/widgets/${w.id}`}
      className="widget-card"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div className="widget-card__head">
        <div className="widget-card__badges">
          {w.isNew && <span className="widget-card__badge widget-card__badge--new">NEW</span>}
          {w.isPopular && (
            <span className="widget-card__badge widget-card__badge--popular">Популярне</span>
          )}
        </div>
        <span className={`widget-card__tag widget-card__tag--${w.tagColor}`}>{tagLabel}</span>
      </div>

      <div className="widget-card__preview">
        {Preview ? <Preview /> : <div className="widget-card__preview-icon"><WidgetIcon name={w.icon} size={32} /></div>}
      </div>

      <div className="widget-card__body">
        <h3 className="widget-card__title">{w.title}</h3>
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
