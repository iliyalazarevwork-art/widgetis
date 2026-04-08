import { Flame, ArrowRight } from 'lucide-react'
import './PromoStrip.css'

export function PromoStrip() {
  return (
    <aside className="promo-strip" role="note" aria-label="Спеціальна пропозиція">
      <div className="promo-strip__inner">
        <span className="promo-strip__badge" aria-hidden="true">
          <Flame size={13} strokeWidth={2.5} />
        </span>
        <span className="promo-strip__text">
          <strong>Залишилось 7 пакетів</strong> за стартовою ціною
          <span className="promo-strip__sep" aria-hidden="true">•</span>
          <span className="promo-strip__muted">потім +400 грн</span>
        </span>
        <a href="#pricing" className="promo-strip__link">
          <span>Забрати знижку</span>
          <ArrowRight size={13} strokeWidth={2.5} />
        </a>
      </div>
    </aside>
  )
}
