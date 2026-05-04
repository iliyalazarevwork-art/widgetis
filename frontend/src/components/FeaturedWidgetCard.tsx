import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Star, Sparkles } from 'lucide-react'
import { PREVIEW_MAP, PreviewOnePlusOneCard } from './WidgetPreviews'
import type { ApiWidget } from '../api/widgets'
import type { TagSlug } from '../data/widgetTags'
import '../pages/WidgetsPage.css'

export const WIDGET_CASES: Record<string, { store: string; metric: string; color: string }[]> = {
  'promo-line':         [
    { store: 'ptashkinsad.com', metric: '+5% середній чек',  color: '#22C55E' },
    { store: 'benihome.com.ua', metric: '+4% конверсія',     color: '#22C55E' },
    { store: 'ballistic.com.ua',metric: '−8% відмов',        color: '#3B82F6' },
  ],
  'delivery-date':      [
    { store: 'modnakasta.ua', metric: '−18% питань до чату', color: '#22C55E' },
  ],
  'buyer-count':        [
    { store: 'kyivfit.store', metric: '+11% email-база', color: '#22C55E' },
  ],
  'cart-goal':          [
    { store: 'homedetail.ua', metric: '+5% середній чек', color: '#22C55E' },
  ],
  'stock-left':         [
    { store: 'ballistic.com.ua', metric: '−8% відмов', color: '#3B82F6' },
  ],
  'photo-video-reviews':[
    { store: 'kyivfit.store', metric: '+11% email-база', color: '#22C55E' },
  ],
  'spin-the-wheel':     [
    { store: 'kyivfit.store', metric: '+11% email-база', color: '#22C55E' },
  ],
  'progressive-discount': [
    { store: 'homedetail.ua', metric: '+5% середній чек', color: '#22C55E' },
  ],
  'last-chance-popup':  [
    { store: 'stylehub.com.ua', metric: '+5% конверсія', color: '#22C55E' },
  ],
  'one-plus-one':       [
    { store: 'benihome.com.ua', metric: '+6% середній чек', color: '#22C55E' },
  ],
}

export const TAG_ACCENT: Record<TagSlug, string> = {
  conversion:     '#10B981',
  trust:          '#3B82F6',
  'social-proof': '#F59E0B',
  visual:         '#8B5CF6',
  'avg-order':    '#10B981',
  urgency:        '#EF4444',
  loyalty:        '#3B82F6',
  engagement:     '#EC4899',
}

function WidgetMockup({ id }: { id: string }) {
  const Preview = id === 'one-plus-one' ? PreviewOnePlusOneCard : PREVIEW_MAP[id]
  if (!Preview) return null
  return (
    <div className="wc__preview">
      <Preview />
    </div>
  )
}

export function FeaturedWidgetCard({ widget, index = 0 }: { widget: ApiWidget; index?: number }) {
  const accent = TAG_ACCENT[widget.tag?.slug as TagSlug] ?? '#10B981'
  const usedIn = WIDGET_CASES[widget.slug] ?? []
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.08 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <article
      ref={ref}
      role="button"
      tabIndex={0}
      className={`wc ${visible ? 'wc--visible' : ''}`}
      style={{ '--wc-accent': accent, transitionDelay: visible ? `${index * 0.06}s` : '0s' } as React.CSSProperties}
      onClick={() => navigate(`/widgets/${widget.slug}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/widgets/${widget.slug}`) }}
    >
      <div className="wc__body">
        <div className="wc__badges">
          <span className="wc__tag" style={{ color: accent, background: `${accent}18` }}>
            {widget.tag?.name ?? ''}
          </span>
          {(widget.is_new || widget.is_popular) && (
            <span className="wc__markers">
              {widget.is_new && (
                <span className="wc__new">
                  <Star size={10} strokeWidth={2.5} />
                  Новинка
                </span>
              )}
              {widget.is_popular && (
                <span className="wc__popular">
                  <Sparkles size={10} strokeWidth={2.5} />
                  Хіт
                </span>
              )}
            </span>
          )}
        </div>

        <h3 className="wc__title">{widget.name}</h3>

        <WidgetMockup id={widget.slug} />

        {usedIn.length > 0 && (
          <div className="wc__used">
            <span className="wc__used-label">Використовується в</span>
            <div className="wc__used-list">
              {usedIn.slice(0, 2).map((c) => (
                <span key={c.store} className="wc__used-store">
                  <span className="wc__used-bullet" aria-hidden="true" />
                  <span className="wc__used-domain">{c.store}</span>
                  <strong style={{ color: c.color }}>{c.metric}</strong>
                </span>
              ))}
            </div>
          </div>
        )}

        <span className="wc__cta" aria-hidden="true">
          Детальніше
          <ArrowRight size={14} strokeWidth={2.25} />
        </span>
      </div>
    </article>
  )
}
